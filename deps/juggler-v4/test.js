// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: loopback-connector-mongodb
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const semver = require('semver');
const should = require('should');
const juggler = require('@tispr/loopback-datasource-juggler');
const name = require('./package.json').name;

require('../../test/init');

describe(name, function() {
  before(function() {
    return global.resetDataSourceClass(juggler.DataSource);
  });

  after(function() {
    return global.resetDataSourceClass();
  });

  require('@tispr/loopback-datasource-juggler/test/common.batch.js');
  require('@tispr/loopback-datasource-juggler/test/default-scope.test.js');
  require('@tispr/loopback-datasource-juggler/test/include.test.js');

  // === Operation hooks ==== //

  const suite = require('@tispr/loopback-datasource-juggler/test/persistence-hooks.suite.js');

  const DB_VERSION = process.env.MONGODB_VERSION;

  if (!DB_VERSION) {
    console.log('The ENV variable MONGODB_VERSION is not set.' +
      ' Assuming MongoDB version 2.6 or newer.');
  }

  const DB_HAS_2_6_FEATURES = (!DB_VERSION ||
    semver.satisfies(DB_VERSION, '>=2.6.0'));

  const customConfig = Object.assign({}, global.config, {
    enableOptimisedFindOrCreate: DB_HAS_2_6_FEATURES,
  });

  suite(global.getDataSource(customConfig, juggler.DataSource), should, {
    replaceOrCreateReportsNewInstance: DB_HAS_2_6_FEATURES,
  });
});
