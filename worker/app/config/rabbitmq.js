const amqp = require("amqp-connection-manager");
const { engine } = require('../engine.js')

// notebookId / roomId
const QUEUE_NAME = process.env.QUEUE_NAME;
const QUEUE_HOST = process.env.QUEUE_HOST;
const QUEUE_PORT = process.env.QUEUE_PORT;

console.log("Establishing connection to broker ", QUEUE_HOST, QUEUE_PORT);
console.log("Queue name is: ", QUEUE_NAME);
const connection = amqp.connect([`${QUEUE_HOST}:${QUEUE_PORT}`]);

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




module.exports = {listenMessage}