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

'use strict';

const t = require('tap');
const semver = require('semver');

if (semver.lt(process.versions.node, '12.17.0')) {
  t.skip('Skip because Node version < 12.17.0');
  t.end();
} else {
  // Node v8 throw a `SyntaxError: Unexpected token import`
  // even if this branch is never touch in the code,
  // by using `eval` we can avoid this issue.
  // eslint-disable-next-line
  new Function('module', 'return import(module)')('./index.mjs').catch((err) => {
    process.nextTick(() => {
      throw err;
    });
  });
}
