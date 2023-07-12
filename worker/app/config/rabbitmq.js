const amqp = require("amqp-connection-manager");
const { engine } = require('../engine.js')
console.log('updated Jul 11, 2023 6:03:43 PM')
// QUEUE_NAME is roomId; passed during docker compose up
// e.g., QUEUE_NAME='room24' docker compose up
const QUEUE_NAME = process.env.QUEUE_NAME || 'jobs';
console.log("QUEUE_NAME IS ", QUEUE_NAME);
const connection = amqp.connect(['amqp://rabbitmq-dredd:5672']);

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