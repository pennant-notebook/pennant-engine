const { client } = require('../config/redis.js');


const getFromRedis = (key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, data) => {

      if (err) {
        reject('thisis an error', err);
      } else {
        resolve(data);
      }
    });
  })
}



// Options example
//  {
//     status: 'pending',
//     notebookId: notebookId,
//     timeRequested: Date.now(),
//     timeProcessed: null,
//     output: null,
//   }

const convertOptionsToFields = (obj) => {
  const arr = [];
  for (let key in obj) {
    arr.push(key);
    arr.push(JSON.stringify(obj[key]));
  }
  return arr;
}



const setRedisHashkey = (submissionId, options) => {
  if (!submissionId || !options) {
    throw new Error('Error setting field values: submissionId and options must be defined');
  };
  const fields = convertOptionsToFields(options);

  console.log(fields)
  return new Promise((resolve, reject) => {
    client.hset(submissionId, ...fields, function (err, reply) {
      if (err) {
        reject('Error setting field values:', err);
      } else {
        resolve(reply);
      }
    });
  });
};

const getField = async (key, field) => {
  return new Promise((resolve, reject) => {
    client.hget(key, field, (err, value) => {
      if (err) {
        console.error('Error retrieving field value:', err);
      } else {
        console.log('found: ', value)
        const parsed = JSON.parse(value);
        resolve(parsed);
      }
    });
  })
}

const getAllFields = async (key) => {
  return new Promise((resolve, reject) => {
    client.hgetall(key, (err, object) => {
      if (err) {
        console.error('Error retrieving hash key:', err);
        reject(err);
      } else {
        console.log(object);
        resolve(object);
      }
    });
  });
};

module.exports = { getFromRedis, setRedisHashkey, convertOptionsToFields, getField, getAllFields }
