const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = require("../config");
const redis = require("redis");

const clientOptions = {
  legacyMode: true,
  socket: {
    // host: "127.0.0.1",
    // host: "redis-server",
    // ! When running server on host machine, use 127.0.0.1
    host: REDIS_HOST,
    port: REDIS_PORT,
    reconnectStrategy (retries) {
      if (retries > 10) {
        console.log("Too many retries on REDIS. Connection Terminated");
        return new Error("Too many retries.");
      } else {
        return retries;
      }
    },
  },
  password: REDIS_PASSWORD,


}


let client;

(async () => {
  client = redis.createClient(clientOptions);

  client.on("connect", () => {
    console.log("Connected to Redis!");
  });

  client.on("error", (error) => {
    console.error(`Redis Error : ${error}`)
    process.exit(1);
  });

  await client.connect();
})();



// client.on("error", (err) => {
//   console.log("Error " + err);
// })

module.exports = { client }