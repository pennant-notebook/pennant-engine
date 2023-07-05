const { client } = require('../config/redis.js');

const errorResponse = (code, message) => {
    return {
        status: "error",
        data: null,
        error: {
            code: code,
            message: message
        }
    }
}

const successResponse = (data) => {
    console.log({
        status: "ok",
        data: data
    });
    return {
        status: "ok",
        data: data,
        submissionId: data.folder,
    }
}

const getFromRedis = (key) => {
    return new Promise((resolve, reject) => {
        client.get(key, (err, data) => {

            if (err) {
                reject('thisis an error', err);
            } else {
                resolve(data);
            }

        });
    })
}

module.exports = {errorResponse, successResponse, getFromRedis}