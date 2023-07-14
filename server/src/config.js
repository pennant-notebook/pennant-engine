require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3002,
  NETWORK_NAME: process.env.NETWORK_NAME || "dredd-network",
  QUEUE_HOST: process.env.SERVER_QUEUE_HOST || "amqp://localhost",
  QUEUE_PORT: process.env.SERVER_QUEUE_PORT || 5672,
  REDIS_HOST: process.env.SERVER_QUEUE_HOST || "127.0.0.1",
  REDIS_PORT: process.env.SERVER_QUEUE_PORT || 6379,
  WORKER_QUEUE_HOST: process.env.WORKER_QUEUE_HOST || "amqp://rabbitmq-dredd",
  WORKER_QUEUE_PORT: process.env.WORKER_QUEUE_PORT || 5672,
  WORKER_REDIS_HOST: process.env.WORKER_REDIS_HOST || "redis-dredd",
  WORKER_REDIS_PORT: process.env.WORKER_REDIS_PORT || 6379,
}