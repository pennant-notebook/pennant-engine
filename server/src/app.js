const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const {dailyCleanup, cleanupDocker, cleanupRedis} = require('./utils/cleanup');

dailyCleanup();
// cleanupDocker;
// cleanupRedis;

// const {removeAllDockerContainers, flushRedis} = require('./utils/workerManager')
// //!below line is to test redis clear cache is working
// const {getAllFields} = require('./utils/redisHelpers');
// const schedule = require('node-schedule');

// var k = schedule.scheduleJob({hour: 15, minute: 02} , async () => {
//   removeAllDockerContainers();
// });
// schedule.scheduleJob('0 0 * * *', async () => { removeAllDockerContainers();}) // run everyday at midnight
// //!below function is to test redis clear cache is working
// function wait(ms) {
//   var start = new Date().getTime();
//   var end = start;
//   while (end < start + ms) {
//     end = new Date().getTime();
//   }
// }
// // schedule.scheduleJob('0 12 1 * *', () => { flushRedis();}) // run everyday at midnight
// var j = schedule.scheduleJob({hour: 0, minute: 0} , async () => {
//   //!below line is to test redis clear cache is working
//   let before = await getAllFields('9821458b2ff376af38c3')
//   //!below line is to test redis clear cache is working
//   console.log('before', before);
//   flushRedis();
//   //!below line is to test redis clear cache is working
//   wait(5000)
//   //!below line is to test redis clear cache is working
//   let after = await getAllFields('9821458b2ff376af38c3')
// //!below line is to test redis clear cache is working
//   console.log('after', after);
// });
// // removeAllDockerContainers();
const app = express();
app.use(morgan('dev'));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api', require('./routes/api'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

app.listen(3002, () => {
  console.log('Server is listening on port 3002...');
});