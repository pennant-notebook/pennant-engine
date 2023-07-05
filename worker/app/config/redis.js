const redis = require('redis');

// const client = redis.createClient({
// 	host: 'redis-server',
// 	port: 6379
// })

const client = redis.createClient({
	legacyMode: true,
	socket: {
	host: "127.0.0.1",
	port: 6379,
	}
});

client.connect().then(

  client.on("error", (err) => {
    console.log("Error " + err);
  })
  );
  

module.exports = {client};