const submissionIdTimeCreated = {};
const DEFAULT_TIMEOUT = 10000 // 10 seconds;

const createTimestamp = (submissionId, timeout) => {
  submissionIdTimeCreated[submissionId] = {
    timestamp: Date.now(),
    timeout: timeout || DEFAULT_TIMEOUT,
  }
}

const elapsedTime = (submissionId) => {
  const startTime = submissionIdTimeCreated[submissionId].timestamp;
  return Date.now() - startTime;
}

const exceedsTimeout = (submissionId) => {
  return elapsedTime(submissionId) > submissionIdTimeCreated[submissionId].timeout;
}

module.exports = { exceedsTimeout, createTimestamp };