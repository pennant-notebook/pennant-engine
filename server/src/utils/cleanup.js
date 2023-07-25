const { removeAllDockerContainers, flushRedis } = require('./workerManager')
const schedule = require('node-schedule');

const dailyCleanup = () => {
  var cleanupDocker = schedule.scheduleJob({ hour: 0, minute: 30 }, async () => {
    removeAllDockerContainers();
  });

  function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
      end = new Date().getTime();
    }
  }

  var cleanupRedis = schedule.scheduleJob({ hour: 0, minute: 40 }, async () => {
    flushRedis();
    wait(5000)
  });
}

module.exports = { dailyCleanup };