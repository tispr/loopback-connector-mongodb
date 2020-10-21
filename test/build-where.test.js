'use strict';

/**
 * TISPR: Add support for a searches with object ids in string representation. This override is needed cause current
 * loopback implementation does not support case when property with type "object" contains some object id and client
 * want to search by it. The cast from string to object id does not performed.
 */

const _ = require('lodash');
const {ObjectId} = require('mongodb');
const should = require('./init.js');

describe('build where with object ids', function() {
  const {chance} = global;

  let propertyName, stringProperty, objectIdProperty, Model, instance;

  before('generate property names', () => {
    propertyName = global.propertyName();

    const subPropertyNames = chance.unique(global.propertyName, 2);
    stringProperty = `${propertyName}.${subPropertyNames[0]}`;
    objectIdProperty = `${propertyName}.${subPropertyNames[1]}`;
  });

  before('create a model and attach it to the app', () => {
    const datasource = global.getDataSource();

    Model = datasource.define(global.modelName(), {
      [propertyName]: Object,
    });
  });

  before('create entry with an object id embedded to the object', async () => {
    const prototype = {};
    _.set(prototype, objectIdProperty, new ObjectId());
    _.set(prototype, stringProperty, chance.word({length: 12})); // potential object id

    instance = await Model.create(prototype);
  });

  it('should find the instance by string', async () => {
    const value = _.get(instance, stringProperty);
    should(value).be.instanceOf(String);

    const dbInstance = await Model.findOne({where: {[stringProperty]: value}});

    should.exist(dbInstance);
    dbInstance.toObject().should.eql(instance.toObject());
  });

  it('should find the instance by object id', async () => {
    const id = _.get(instance, objectIdProperty);
    should(id).be.instanceOf(ObjectId);

    const dbInstance = await Model.findOne({where: {[objectIdProperty]: id}});

    should.exist(dbInstance);
    dbInstance.toObject().should.eql(instance.toObject());
  });

  it('should find the instance by object id in the string form', async () => {
    const id = _.toString(_.get(instance, objectIdProperty));
    should(id).not.be.instanceOf(ObjectId);

    const dbInstance = await Model.findOne({where: {[objectIdProperty]: id}});

    should.exist(dbInstance);
    dbInstance.toObject().should.eql(instance.toObject());
  });

  it('should find the instance by object id in the string form as a part of big query', async () => {
    const id = _.toString(_.get(instance, objectIdProperty));
    const query = {
      where: {
        and: [{
          and: [{
            [objectIdProperty]: id,
          }],
        }],
      },
    };

    should(id).not.be.instanceOf(ObjectId);

    const dbInstance = await Model.findOne(query);

    should.exist(dbInstance);
    dbInstance.toObject().should.eql(instance.toObject());
  });

  describe('when query match several instances', () => {
    let anotherInstance;

    before('create another entry with an object id embedded to the object', async () => {
      const prototype = {};
      _.set(prototype, objectIdProperty, new ObjectId());
      _.set(prototype, stringProperty, chance.word({length: 12})); // potential object id

      anotherInstance = await Model.create(prototype);
    });

    it('should find the instance by object id using array "inq" the query', async () => {
      const id1 = _.toString(_.get(instance, objectIdProperty));
      const id2 = _.toString(_.get(anotherInstance, objectIdProperty));

      const query = {
        where: {
          [objectIdProperty]: {
            inq: [id1, id2],
          },
        },
      };

      should(id1).not.be.instanceOf(ObjectId);
      should(id2).not.be.instanceOf(ObjectId);

      let instances = await Model.find(query);
      instances = _.map(instances, (instance) => instance.toObject());

      instances.should.have.lengthOf(2);
      instances.should.be.eql([
        instance.toObject(),
        anotherInstance.toObject(),
      ]);
    });

    it('should find the instance by object id using array "nin" the query', async () => {
      const id1 = _.toString(_.get(instance, objectIdProperty));

      const query = {
        where: {
          [objectIdProperty]: {
            nin: [id1],
          },
        },
      };

      should(id1).not.be.instanceOf(ObjectId);

      let instances = await Model.find(query);
      instances = _.map(instances, (instance) => instance.toObject());

      instances.should.have.lengthOf(1);
      instances.should.be.eql([anotherInstance.toObject()]);
    });
  });
});
