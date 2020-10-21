// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-mongodb
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

module.exports = require('should');

const juggler = require('@tispr/loopback-datasource-juggler');
let DataSource = juggler.DataSource;

const TEST_ENV = process.env.TEST_ENV || 'test';
let config = require('rc')('loopback', {test: {mongodb: {}}})[TEST_ENV]
  .mongodb;

config = {
  host: process.env.MONGODB_HOST || 'localhost',
  port: process.env.MONGODB_PORT || 27017,
  database:
    process.env.MONGODB_DATABASE ||
    'lb-ds-mongodb-test-' +
      (process.env.TRAVIS_BUILD_NUMBER || process.env.BUILD_NUMBER || '1'),
};

global.config = config;

let db;
global.getDataSource = global.getSchema = function(customConfig, customClass) {
  const ctor = customClass || DataSource;
  db = new ctor(require('../'), customConfig || config);
  db.log = function(a) {
    console.log(a);
  };

  return db;
};

global.resetDataSourceClass = function(ctor) {
  DataSource = ctor || juggler.DataSource;
  const promise = db ? db.disconnect() : Promise.resolve();
  db = undefined;
  return promise;
};

global.connectorCapabilities = {
  ilike: false,
  nilike: false,
  nestedProperty: true,
};

// TISRP: Add some utils method to simplify tests development <<<
const _ = require('lodash');
const chance = require('chance').Chance();

/**
 * Generate a random model name
 *
 * @return {string} A model name
 */
function modelName() {
  return _.upperFirst(_.camelCase(chance.sentence({words: chance.integer({min: 3, max: 5})})));
}

/**
 * Generate a random property name
 *
 * @return {string} A property name
 */
function propertyName() {
  // The property names can't be the same as any existing in loopback Model properties and functions
  return uniqueFirstWithout(chance.word, ['id', 'and', 'or', 'nor', 'errors', 'codes']);
}

/**
 * Generate an unique value. The function is guarantee that the value
 * is not the same as any value in the exceptions list
 *
 * @param {function} fn A function which generates something random
 * @param {[*]} exceptions A list of values which should not be generated
 * @param {object} [options] Any options to pass on to the generator function
 * @return {*} An unique value
 */
function uniqueFirstWithout(fn, exceptions, options) {
  return _.first(uniqueWithout(fn, 1, exceptions, options));
}

/**
 * Generate an array of unique values. The function is guarantee that none values
 * is the same as any value in the exceptions list
 *
 * @param {function} fn A function which generates something random
 * @param {number} count A count of generated values
 * @param {[*]} exceptions A list of values which should not be generated
 * @param {object} [options] Any options to pass on to the generator function
 * @return {[*]} An array of unique values
 */
function uniqueWithout(fn, count, exceptions, options) {
  // Generate unique values with deep compare
  const uniqueValues = chance.unique(wrapper, count + exceptions.length, {comparator});
  return _.take(_.differenceWith(uniqueValues, exceptions, isEqual), count);

  function wrapper() {
    return fn.call(chance, options);
  }

  function comparator(arr, value) {
    return _.some(arr, (el) => isEqual(el, value));
  }

  function isEqual(el1, el2) {
    el1 = el1 && el1.toObject ? el1.toObject() : el1;
    el2 = el2 && el2.toObject ? el2.toObject() : el2;
    return _.isEqual(el1, el2);
  }
}

global.chance = chance;
global.modelName = modelName;
global.propertyName = propertyName;
global.uniqueFirstWithout = uniqueFirstWithout;
global.uniqueWithout = uniqueWithout;
// >>>
