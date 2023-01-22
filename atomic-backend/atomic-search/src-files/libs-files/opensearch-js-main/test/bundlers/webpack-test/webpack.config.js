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

const path = require('path');

module.exports = {
  entry: './index.js',
  target: 'node',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname),
  },
};
