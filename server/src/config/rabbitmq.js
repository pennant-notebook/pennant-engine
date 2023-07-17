const { QUEUE_HOST, QUEUE_PORT } = require("../config");

const DEFAULT_QUEUE_NAME = 'jobs'
var amqp = require('amqp-connection-manager');

let connection;
let channel;
let channelWrapper;

async function initializeConnection() {
  connection = await amqp.connect([`${QUEUE_HOST}:${QUEUE_PORT}`]);
  channel = await connection.createChannel();

  channelWrapper = connection.createChannel({
    json: true,
    setup: function (channel) {
      return channel.assertQueue(DEFAULT_QUEUE_NAME, { durable: true });
    }
  });
}

// ! Warning ... the channel checkQueue method will always bork the channel when the queue does not exist. It's pretty much useless except for debugging.
// 
async function queueExists(notebookId) {
  try {
    const result = await channelWrapper.checkQueue(notebookId);
    console.log('queue DOES exist', notebookId);
    return result.queue;
  } catch (err) {
    console.log('queue does not exist: ', notebookId);
  }
}

async function setupQueueForNoteBook(notebookId) {
  channelWrapper.assertQueue(notebookId, { durable: true });
  console.log('queue for notebookId asserted: ', notebookId);
}

const sendMessage = async (data, queueName) => {
  channelWrapper.sendToQueue(queueName, data)
    .then(function () {
      console.log('sendMessageData', data);
      console.log("Message sent to queue: ", queueName);
    })
    .catch(function (err) {
      console.log("Message was rejected:", err.stack);
      channelWrapper.close();
      connection.close();
    });
};

const deleteQueue = async (queueName) => { 
  try {
    await channelWrapper.deleteQueue(queueName);
    console.log('Queue deleted: ', queueName);
  } catch (error) {
    console.log(`error deleting queue: ${queueName}`, error)
  }
}


(async () => {
  await initializeConnection();
  connection.on('connect', function () {
    console.log('Connected!');
  });
  connection.on('disconnect', function (err) {
    console.log('Disconnected.', err);
  });

})();

module.exports = { sendMessage, setupQueueForNoteBook, queueExists, deleteQueue }