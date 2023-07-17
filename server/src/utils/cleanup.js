const {removeAllDockerContainers, flushRedis} = require('./workerManager')
//!below line is to test redis clear cache is working
const {getAllFields} = require('./redisHelpers');
const schedule = require('node-schedule');

const dailyCleanup = () => {
    var cleanupDocker = schedule.scheduleJob({hour: 15, minute: 14} , async () => {
        removeAllDockerContainers();
    });
    //!Same cleanup as one above, for now commented out
    // schedule.scheduleJob('0 0 * * *', async () => { removeAllDockerContainers();}) // run everyday at midnight
    //!below function is to test redis clear cache is working, 
    //!not used in functioning of cleanup process
    function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
    }

    var cleanupRedis =schedule.scheduleJob({hour: 0, minute: 0} , async () => {
    //!below line is only to test redis clear cache is working
    let before = await getAllFields('9821458b2ff376af38c3')
    //!below line is only to test redis clear cache is working
    console.log('before', before);
    flushRedis();
    //!below line is only to test redis clear cache is working
    wait(5000)
    //!below line is only to test redis clear cache is working
    let after = await getAllFields('9821458b2ff376af38c3')
    //!below line is only to test redis clear cache is working
    console.log('after', after);
    });
}

module.exports = { dailyCleanup };