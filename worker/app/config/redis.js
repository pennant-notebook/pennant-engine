const redis = require('redis');
const HOST = process.env.REDIS_HOST;
const PORT = process.env.REDIS_PORT;
const PASSWORD = process.env.REDIS_PASSWORD;

console.log('Establishing connection to cache ', HOST, PORT);
const client = redis.createClient({
  legacyMode: true,
  socket: {
    host: HOST,
    port: PORT,
  },
  password: PASSWORD,
});

client.connect().then(

  client.on("error", (err) => {
    console.log("Error " + err);
  })
);

module.exports = { client };