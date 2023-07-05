// // const amqp = require('amqp-connection-manager');
// // const { engine } = require('../engine.js');

// // const QUEUE_NAME = 'judge'
// // const connection = amqp.connect(['amqp://rabbitmq:5672']);

// // connection.on('connect', function () {
// //     console.log('Connected!');
// // });

// // connection.on('disconnect', function (err) {
// //     console.log('Disconnected.', err);
// // });

// // const onMessage = (data) => {

// //     let message = JSON.parse(data.content.toString());
// //     console.log('message', message);
// //     engine(message, channelWrapper, data);
// // }

// // // Set up a channel listening for messages in the queue.
// // const channelWrapper = connection.createChannel({
// //     setup: function (channel) {
// //         // `channel` here is a regular amqplib `ConfirmChannel`.
// //         console.log('set up channel')
// //         return Promise.all([
// //             channel.assertQueue(QUEUE_NAME, { durable: true }),
// //             channel.prefetch(1),
// //             channel.consume(QUEUE_NAME, onMessage)
// //         ]);
// //     }
// // });

// // channelWrapper.waitForConnect()
// //     .then(function () {
// //         console.log("Listening for messages");
// //     });

// const amqp = require("amqplib");


// async function connect() {

//     try {
//         const amqpServer = "amqp://localhost:5672"
//         const connection = await amqp.connect(amqpServer);
//         console.log('connection');
//         const channel = await connection.createChannel();
//         console.log('channel set')
//         //changed below
//         const onMessage = (data) => {

//             let message = JSON.parse(data.content.toString());
//             console.log('message', message);
//             engine(message, channelWrapper, data);
//         }
//         await channel.assertQueue("jobs");
//         // return Promise.all([
//         //                 channel.assertQueue(QUEUE_NAME, { durable: true }),
//         //                 channel.prefetch(1),
//         //                 channel.consume(QUEUE_NAME, onMessage)
//         //             ]);
        
//         //above
        
//         channel.consume("jobs", onMessage
//         // message => {
//         //     const input = JSON.parse(message.content.toString());
//         //     console.log(`Recieved job with input ${input.number}`)
//         //     //"7" == 7 true
//         //     //"7" === 7 false

//         //     if (input.number == 7 ) 
//         //         channel.ack(message);
//         // }
//         )

//         console.log("Waiting for messages...")
    
//     }
//     catch (ex){
//         console.error(ex)
//     }

// }

// // connect();

// module.exports = {connect};








const amqp = require("amqp-connection-manager");
// const amqp from 'amqp-connection-manager';
const { engine } = require('../engine.js')

const QUEUE_NAME = 'jobs'
// const connection = amqp.connect(['amqp://localhost:5672']);
const connection = amqp.connect(['amqp://rabbitmq:5672']);

connection.on('connect', function () {
    console.log('Connected on back!');
});

connection.on('disconnect', function (err) {
    console.log('Disconnected on back.', err);
});

const onMessage = (data) => {
//push a status change to redis?
    let message = JSON.parse(data.content.toString());
    console.log('inQueueMessage', message);
    engine(message, channelWrapper, data);
}

// Set up a channel listening for messages in the queue.

const channelWrapper = connection.createChannel({
    setup: function (channel) {
        // `channel` here is a regular amqplib `ConfirmChannel`.
        return Promise.all([
            channel.assertQueue(QUEUE_NAME, { durable: true }),
            channel.prefetch(1),
            channel.consume(QUEUE_NAME, onMessage)
        ]);
    }
});

const listenMessage = async (data) => {
channelWrapper.waitForConnect()
    .then(function () {
        console.log("Listening for messages");
    });
};



// }

module.exports = {listenMessage}