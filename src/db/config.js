/**
* Creates a storage object for a given "zone", i.e, teams, channels, or users
*
* @param {Object} db A reference to the MongoDB instance
* @param {String} zone The table to query in the database
* @returns {{get: get, save: save, all: all}}
*/
function getStorage(db, zone) {
  const table = db.get(zone);

  return {
    get: (id, cb) => {
      table.findOne({ id }, cb);
    },
    findBy: (property, value, cb) => {
      const queryObj = {};
      queryObj[property] = value;
      table.findOne(queryObj, cb);
    },
    getByFBSenderID: (fbSenderID, cb) => {
      table.findOne({ 'fb.senderID': fbSenderID }, cb);
    },
    findOneByFBSenderIDAndUpdate: (fbSenderID, data, cb) => {
      table.findOneAndUpdate({ 'fb.senderID': fbSenderID }, data, cb);
    },
    update: (id, data, cb) => {
      table.findOneAndUpdate(id, { $set: data }, cb);
    },
    save: (data, cb) => {
      table.findOneAndUpdate({
        id: data.id,
      }, data, {
        upsert: true,
        new: true,
      }, cb);
    },
    all: (cb) => {
      table.find({}, cb);
    },
  };
}

module.exports = (config) => {
  if (!config || !config.dbURL) {
    throw new Error('You need to provide db url');
  }

  const monk = require('monk')(config.dbURL, {
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
  });

  console.log('connecting to db url');
  console.log(config.dbURL);
  const storage = {};

  // The below are needed for Botkit to let us use storage
  ['teams', 'channels', 'users', 'students'].forEach((zone) => {
    storage[zone] = getStorage(monk, zone);
  });

  return storage;
};
