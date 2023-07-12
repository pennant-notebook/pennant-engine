const submissionIdTimeCreated = {};
const DEFAULT_TIMEOUT = 100000 // 10 seconds;

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

const exceedsTimeout = (submissionId) => {
  const startTime = getTimestamp(submissionId);
  if (!startTime) return true;
  return elapsedTime(submissionId) > submissionIdTimeCreated[submissionId].timeout;
}

module.exports = { exceedsTimeout, createTimestamp };