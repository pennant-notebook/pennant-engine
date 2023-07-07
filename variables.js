let redisName = "redis-server";
let workerName = "worker";

const changedRedisName = (id= null) => {
    if (id) {
    return redisName += `-${id}`
    } else {
        return redisName;
    }
}

const changedWorkerName = (id= null) => {
    if (id) {
    return workerName += `-${id}`
    } else {
        return workerName;
    }
}

module.exports = {changedRedisName, changedWorkerName}