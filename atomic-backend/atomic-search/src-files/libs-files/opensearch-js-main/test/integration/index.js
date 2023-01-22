/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

'use strict';

process.on('unhandledRejection', function (err) {
  console.error(err);
  process.exit(1);
});

const { writeFileSync, readFileSync, readdirSync, statSync } = require('fs');
const { join, sep } = require('path');
const yaml = require('js-yaml');
const ms = require('ms');
const { Client } = require('../../index');
const build = require('./test-runner');
const { sleep } = require('./helper');
const createJunitReporter = require('./reporter');
const downloadArtifacts = require('../../scripts/download-artifacts');

const yamlFolder = downloadArtifacts.locations.ossTestFolder;

const MAX_API_TIME = 1000 * 90;
const MAX_FILE_TIME = 1000 * 30;
const MAX_TEST_TIME = 1000 * 3;

const ossSkips = {
  'cat.indices/10_basic.yml': ['Test cat indices output for closed index (pre 7.2.0)'],
  'cluster.health/10_basic.yml': ['cluster health with closed index (pre 7.2.0)'],
  // TODO: remove this once 'arbitrary_key' is implemented
  // https://github.com/elastic/elasticsearch/pull/41492
  'indices.split/30_copy_settings.yml': ['*'],
  'indices.stats/50_disk_usage.yml': ['Disk usage stats'],
  'indices.stats/60_field_usage.yml': ['Field usage stats'],
  // skipping because we are booting opensearch with `discovery.type=single-node`
  // and this test will fail because of this configuration
  'nodes.stats/30_discovery.yml': ['*'],
  // the expected error is returning a 503,
  // which triggers a retry and the node to be marked as dead
  'search.aggregation/240_max_buckets.yml': ['*'],
};

function runner(opts = {}) {
  const options = { node: opts.node };
  const client = new Client(options);
  log('Loading yaml suite');
  start({ client }).catch((err) => {
    if (err.name === 'ResponseError') {
      console.error(err);
      
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

async function waitCluster(client, times = 0) {
  try {
    await client.cluster.health({ waitForStatus: 'green', timeout: '50s' });
  } catch (err) {
    if (++times < 10) {
      await sleep(5000);
      return waitCluster(client, times);
    }
    console.error(err);
    process.exit(1);
  }
}

async function start({ client }) {
  log('Waiting for OpenSearch');
  await waitCluster(client);

  const { body } = await client.info();
  const { number: version, build_hash: hash } = body.version;

  log(`Downloading artifacts for hash ${hash}...`);
  await downloadArtifacts({ hash, version });

  log('Testing api...');
  const junit = createJunitReporter();
  const junitTestSuites = junit.testsuites('Integration test for api');

  const stats = {
    total: 0,
    skip: 0,
    pass: 0,
    assertions: 0,
  };
  const folders = getAllFiles(yamlFolder)
    .filter((t) => !/(README|TODO)/g.test(t))
    // we cluster the array based on the folder names,
    // to provide a better test log output
    .reduce((arr, file) => {
      const path = file.slice(file.indexOf('/rest-api-spec/test'), file.lastIndexOf('/'));
      let inserted = false;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i][0].includes(path)) {
          inserted = true;
          arr[i].push(file);
          break;
        }
      }
      if (!inserted) arr.push([file]);
      return arr;
    }, []);

  const totalTime = now();
  for (const folder of folders) {
    // pretty name
    const apiName = folder[0].slice(
      folder[0].indexOf(`${sep}rest-api-spec${sep}test`) + 19,
      folder[0].lastIndexOf(sep)
    );

    log('Testing ' + apiName.slice(1));
    const apiTime = now();

    for (const file of folder) {
      const testRunner = build({
        client,
        version,
      });
      const fileTime = now();
      const data = readFileSync(file, 'utf8');
      // get the test yaml (as object), some file has multiple yaml documents inside,
      // every document is separated by '---', so we split on the separator
      // and then we remove the empty strings, finally we parse them
      const tests = data
        .split('\n---\n')
        .map((s) => s.trim())
        // empty strings
        .filter(Boolean)
        .map(parse)
        // null values
        .filter(Boolean);

      // get setup and teardown if present
      let setupTest = null;
      let teardownTest = null;
      for (const test of tests) {
        if (test.setup) setupTest = test.setup;
        if (test.teardown) teardownTest = test.teardown;
      }

      const cleanPath = file.slice(file.lastIndexOf(apiName));
      log('    ' + cleanPath);
      const junitTestSuite = junitTestSuites.testsuite(apiName.slice(1) + ' - ' + cleanPath);

      for (const test of tests) {
        const testTime = now();
        const name = Object.keys(test)[0];
        if (name === 'setup' || name === 'teardown') continue;
        const junitTestCase = junitTestSuite.testcase(name);

        stats.total += 1;
        if (shouldSkip(file, name)) {
          stats.skip += 1;
          junitTestCase.skip('This test is in the skip list of the client');
          junitTestCase.end();
          continue;
        }
        log('        - ' + name);
        try {
          await testRunner.run(setupTest, test[name], teardownTest, stats, junitTestCase);
          stats.pass += 1;
        } catch (err) {
          junitTestCase.failure(err);
          junitTestCase.end();
          junitTestSuite.end();
          junitTestSuites.end();
          generateJunitXmlReport(junit, 'oss');
          console.error(err);
          process.exit(1);
        }
        const totalTestTime = now() - testTime;
        junitTestCase.end();
        if (totalTestTime > MAX_TEST_TIME) {
          log('          took too long: ' + ms(totalTestTime));
        } else {
          log('          took: ' + ms(totalTestTime));
        }
      }
      junitTestSuite.end();
      const totalFileTime = now() - fileTime;
      if (totalFileTime > MAX_FILE_TIME) {
        log(`    ${cleanPath} took too long: ` + ms(totalFileTime));
      } else {
        log(`    ${cleanPath} took: ` + ms(totalFileTime));
      }
    }
    const totalApiTime = now() - apiTime;
    if (totalApiTime > MAX_API_TIME) {
      log(`${apiName} took too long: ` + ms(totalApiTime));
    } else {
      log(`${apiName} took: ` + ms(totalApiTime));
    }
  }
  junitTestSuites.end();
  generateJunitXmlReport(junit, 'oss');
  log(`Total testing time: ${ms(now() - totalTime)}`);
  log(`Test stats:
  - Total: ${stats.total}
  - Skip: ${stats.skip}
  - Pass: ${stats.pass}
  - Assertions: ${stats.assertions}
  `);
}

function log(text) {
  process.stdout.write(text + '\n');
}

function now() {
  const ts = process.hrtime();
  return ts[0] * 1e3 + ts[1] / 1e6;
}

function parse(data) {
  let doc;
  try {
    doc = yaml.load(data, { schema: yaml.CORE_SCHEMA });
  } catch (err) {
    console.error(err);
    return;
  }
  return doc;
}

function generateJunitXmlReport(junit, suite) {
  writeFileSync(join(__dirname, '..', '..', `${suite}-report-junit.xml`), junit.prettyPrint());
}

if (require.main === module) {
  const node = process.env.TEST_OPENSEARCH_SERVER || 'http://localhost:9200';
  const opts = {
    node,
  };
  runner(opts);
}

const shouldSkip = (file, name) => {
  const list = Object.keys(ossSkips);
  for (let i = 0; i < list.length; i++) {
    const ossTest = ossSkips[list[i]];
    for (let j = 0; j < ossTest.length; j++) {
      if (file.endsWith(list[i]) && (name === ossTest[j] || ossTest[j] === '*')) {
        const testName = file.slice(file.indexOf(`${sep}opensearch${sep}`)) + ' / ' + name;
        log(`Skipping test ${testName} because is denylisted in the oss test`);
        return true;
      }
    }
  }
  return false;
};

const getAllFiles = (dir) =>
  readdirSync(dir).reduce((files, file) => {
    const name = join(dir, file);
    const isDirectory = statSync(name).isDirectory();
    return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
  }, []);

module.exports = runner;
