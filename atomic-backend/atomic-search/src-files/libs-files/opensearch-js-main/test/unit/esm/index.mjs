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

import t from 'tap';
import { Client } from '../../../index.mjs';

t.test('esm support', (t) => {
  t.plan(1);
  const client = new Client({ node: 'http://localhost:9200' });
  t.equal(client.name, 'opensearch-js');
});
