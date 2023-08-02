const SCRIPT_TIMEOUT_S = process.env.SCRIPT_TIMEOUT_S || 10;

const { Console } = require('console');
const stream = require('stream');
const util = require('util');
const { VM } = require('vm2');
const { updateSubmissionOutput, initializeSubmissionOutput, getSubmissionOutput } = require('./utils/submissionOutput.js');
const { compileFrontendInput, setVariablesInMap } = require("./utils/compileFrontendInput.js");
const { setRedisHashkey } = require('./utils/redisHelpers.js');

let arr;

function EchoStream() {
  stream.Writable.call(this);
};
util.inherits(EchoStream, stream.Writable);
EchoStream.prototype._write = function (chunk, encoding, done) {
  arr.push(chunk.toString())
  done();
}

var writableStream = new EchoStream();
const customConsole = new Console(writableStream, writableStream);


const vm = new VM({
  timeout: SCRIPT_TIMEOUT_S * 1000,
  sandbox: {
    console: customConsole,
  },
});

const engine = async (apiBody, ch, msg) => {
  const submissionId = apiBody.folder;
  console.log('apiBody', apiBody)

  console.log('engineProcessing')
  initializeSubmissionOutput(submissionId, ...apiBody.cells)
  ch.ack(msg);

  for (let cell of apiBody.cells) {
    try {
      compileFrontendInput(cell, apiBody.notebookId);
      await executeCode(submissionId, cell.cellId, cell.code, apiBody.notebookId);

    } catch (error) {
      console.error("running cells raised an error: ", error);
      break;
    }
  }
  const output = getSubmissionOutput(submissionId)

  await setRedisHashkey(submissionId.toString(), {
    status: 'success',
    timeProcessed: Date.now(),
    output: output,
  });
}

const executeCode = async (submissionId, cellId, code) => {
  console.log('submissionId', submissionId)
  arr = [];

  let isSyntaxOrRuntimeError = false;

  try {
    const result = await vm.run(code);
    setVariablesInMap(cellId);
    arr.push(result);

  } catch (error) {
    arr.push(String(error));
    isSyntaxOrRuntimeError = true;

  } finally {
    updateSubmissionOutput(submissionId, cellId, isSyntaxOrRuntimeError, arr.join(''));
  }
}

module.exports = { engine };