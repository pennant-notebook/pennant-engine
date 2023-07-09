// /* RabbitMQ */
// const amqp = require("amqplib");

// const msg = {number: process.argv[2]}
// connect();
// async function connect() {

//     try {
//         const amqpServer = "amqp://localhost:5672"
//         const connection = await amqp.connect(amqpServer)
//         const channel = await connection.createChannel();
//         await channel.assertQueue("jobs");
//         await channel.sendToQueue("jobs", Buffer.from(JSON.stringify(msg)))
//         console.log(`Job sent successfully ${msg.number}`);
//         await channel.close();
//         await connection.close();
//     }
//     catch (ex){
//         console.error(ex)
//     }

// }






// // const amqp = require("amqplib");
// const amqp = require('amqp-connection-manager');
const QUEUE_NAME = 'jobs'

// const connection = amqp.connect('amqp://rabbitmq:5672');

// connection.on('connect', function() {
//     console.log('Connected!');
// });

// connection.on('disconnect', function(err) {
//     console.log('Disconnected.', err);
// });

// const channelWrapper = connection.createChannel({
//     json: true,
//     setup: function(channel) {
//         // `channel` here is a regular amqplib `ConfirmChannel`.
//         return channel.assertQueue(QUEUE_NAME, {durable: true});
//     }
// });

// const sendMessage = async (data) => {
//     channelWrapper.sendToQueue(QUEUE_NAME, data)
//     .then(function() {
//         console.log("Message sent");
//     })
//     .catch(function(err) {
//         console.log("Message was rejected:", err.stack);
//         channelWrapper.close();
//         connection.close();
//     });
// };

// module.exports = {sendMessage}





//!
const DEFAULT_QUEUE_NAME = 'jobs'
var amqp = require('amqp-connection-manager');

let connection;
let channel;
let channelWrapper;

// ! rabbit uri assumes server is running on localhost, not a container
const initializeConnection = async() => {
  connection = await amqp.connect(['amqp://localhost:5672']);
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


(async () => {
  await initializeConnection();
  connection.on('connect', function () {
    console.log('Connected!');
  });
  connection.on('disconnect', function (err) {
    console.log('Disconnected.', err);
  });

})();

module.exports = { sendMessage, setupQueueForNoteBook, queueExists }
//!
// var amqp = require('amqp-connection-manager');

// // Create a new connection manager
// // ! assumes server is running on localhost, not a container
// var connection = amqp.connect(['amqp://localhost:5672'])
// // var connection = amqp.connect(['amqp://rabbitmq:5672'])
// // const delay = async () => {
// // await setTimeout(()=> {console.log('didnt connect')}, "3000")
// // };

// //  delay()

// // Ask the connection manager for a ChannelWrapper.  Specify a setup function to
// // run every time we reconnect to the broker.






// // var channelWrapper = connection.createChannel({
// //   json: true,
// //   setup: function (channel) {
// //     // `channel` here is a regular amqplib `ConfirmChannel`.
// //     // Note that `this` here is the channelWrapper instance.
// //     return channel.assertQueue('rxQueueName', { durable: true });
// //   },
// // });


// // // Send some messages to the queue.  If we're not currently connected, these will be queued up in memory
// // // until we connect.  Note that `sendToQueue()` and `publish()` return a Promise which is fulfilled or rejected
// // // when the message is actually sent (or not sent.)
// // const sendMessage = () => {
// //     console.log('triyee')
// //     console.log('ch', channelWrapper)
// // channelWrapper
// //   .sendToQueue('rxQueueName', { hello: 'world' })
// //   .then(function () {
// //     console.log('Message was sent!  Hooray!');
// //   })
// //   .catch(function (err) {
// //     console.log('Message was rejected...  Boo!');
// //   });




// connection.on('connect', function() {
//     console.log('Connected!');
// });

// connection.on('disconnect', function(err) {
//     console.log('Disconnected.', err);
// });

// const channelWrapper = connection.createChannel({
//     json: true,
//     setup: function(channel) {
//         // `channel` here is a regular amqplib `ConfirmChannel`.
//         console.log('tic tic')
//         return channel.assertQueue(QUEUE_NAME, {durable: true});
//     }
// });

// const sendMessage = async (data) => {
    
//     channelWrapper.sendToQueue(QUEUE_NAME, data)
//     .then(function() {
//         console.log('sendMessageData', data);
//         console.log("Message sent");
//     })
//     .catch(function(err) {
//         console.log("Message was rejected:", err.stack);
//         channelWrapper.close();
//         connection.close();
//     });
// };



// // }

// module.exports = {sendMessage}