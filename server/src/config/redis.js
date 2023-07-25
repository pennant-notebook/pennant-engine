const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = require("../config");
const redis = require("redis");

const client = redis.createClient({
  legacyMode: true,
  socket: {
    // host: "127.0.0.1",
    // host: "redis-server",
    // ! When running server on host machine, use 127.0.0.1
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
  password: REDIS_PASSWORD,
});

client.connect().then(

  client.on("error", (err) => {
    console.log("Error " + err);
  })
);

module.exports = { client }