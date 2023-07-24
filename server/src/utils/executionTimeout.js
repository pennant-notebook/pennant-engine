const submissionIdTimeCreated = {};
const DEFAULT_TIMEOUT = 10000 // 10 seconds;

// ! This is in memory only. If the server restarts, all the timestamps will be lost.
const getTimestamp = (submissionId) => {
  return submissionIdTimeCreated[submissionId];
};
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

const submissionTimeoutExceeded = (submissionId) => {
  const startTime = getTimestamp(submissionId);
  if (!startTime) return true;
  return elapsedTime(submissionId) > submissionIdTimeCreated[submissionId].timeout;
}

const timeoutExceeded = (time, timeout = DEFAULT_TIMEOUT) => {
  return Number(Date.now() - time) > Number(timeout);
}

module.exports = { submissionTimeoutExceeded, createTimestamp, timeoutExceeded };