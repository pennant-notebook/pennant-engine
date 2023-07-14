const  SCRIPT_TIMEOUT_S = process.env.SCRIPT_TIMEOUT_S || 10;

const vm = require('vm');
const { client } = require("./config/redis.js");
const { Console } = require('console');
const { loadContext, resetContext, updateContextWrapper } = require('./utils/context.js');
const { updateSubmissionOutput, initializeSubmissionOutput, getSubmissionOutput } = require('./utils/submissionOutput.js');
const { compileFrontendInput } = require("./utils/compileFrontendInput.js");
const { connect } = require("./config/rabbitmq.js");
const { setRedisHashkey, getAllFields } = require('./utils/redisHelpers.js');
const { get } = require('http');
console.log('Worker last updated Jul 12, 2023 10:01:35 AM ')

const engine = async (apiBody, ch, msg) => {
  console.log('apiBody', apiBody)

  console.log('engineProcessing')
  initializeSubmissionOutput(apiBody.folder, ...apiBody.cells)
  ch.ack(msg);

  for (let cell of apiBody.cells) {
    try {
      let compiler = compileFrontendInput(cell, apiBody.notebookId);
console.log('COMPILER', compiler);
      if (compiler === 'reset') {
        console.log('RESETRESETUP')
        // resetContext(apiBody.notebookId);
      }
      let result = executeCode(apiBody.folder, cell.cellId, cell.code, apiBody.notebookId);
      if (compiler === 'reset') {
        console.log('RESETRESET')
        setTimeout(() => {
          resetContext(apiBody.notebookId);
        }, 2000)
        
      }

    } catch (error) {
      console.error("running cells raised an error: ", error);
      break;
    }
  }
}

const executeCode = async (submissionId, cellId, code, notebookId) => {
  console.log('submissionId', submissionId)
  const stream = require('stream');
  var util = require('util');
  const arr = [];
  function EchoStream() { // step 2
    stream.Writable.call(this);
  };
  util.inherits(EchoStream, stream.Writable); // step 1
  EchoStream.prototype._write = function (chunk, encoding, done) { // step 3
    arr.push(chunk.toString())
    done();
  }

  var writableStream = new EchoStream();

  const customConsole = new Console(writableStream, writableStream);
  const context = loadContext(notebookId);
  context.console = customConsole;

  let isSyntaxOrRuntimeError = false;
  // copilot, are you there?

  try {
    await vm.runInNewContext(code, context, { timeout: SCRIPT_TIMEOUT_S *  1000 });
    updateContextWrapper(notebookId);
  } catch (error) {
    arr.push(String(error));
    isSyntaxOrRuntimeError = true;
  } finally {
    writableStream.end();

    updateSubmissionOutput(submissionId, cellId, isSyntaxOrRuntimeError, arr.join(''));
    const output = getSubmissionOutput(submissionId)

    await setRedisHashkey(submissionId.toString(), {
      status: 'success',
      timeProcessed: Date.now(),
      output: output,
    });
  }
}





module.exports = { engine };

