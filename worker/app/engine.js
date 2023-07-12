const vm = require('vm');
//deleted
const { client } = require("./config/redis.js");
//above
const { Console } = require('console');
const { loadContext, resetContext, updateContextWrapper } = require('./utils/context.js');
const { updateSubmissionOutput, initializeSubmissionOutput, getSubmissionOutput } = require('./utils/submissionOutput.js');
const { compileFrontendInput } = require("./utils/compileFrontendInput.js");
//added
const { connect } = require("./config/rabbitmq.js");
//above

// const engine = async (submissionId, cells, notebookId) => {
//added
const engine = async (apiBody, ch, msg) => {
  console.log('apiBody', apiBody)
  //changed all notebookId and to apiBody.notebookId, all submissionId to apiBody.folder
  //deleted
  // client.set(apiBody.folder.toString(), 'Processing');
  //above
  console.log('engineProcessing')
  //////added
  initializeSubmissionOutput(apiBody.folder, ...apiBody.cells)
  ch.ack(msg);
  //////above
  //above
  for (let cell of apiBody.cells) {
    try {
      // connect();
      let compiler = compileFrontendInput(cell, apiBody.notebookId);
      // if (compiler === 'broken') break;
      // if (compiler === 'broken') {
      //   executeCode(apiBody.folder, cell.cellId, cell.code, apiBody.notebookId);
      // }
      if (compiler === 'ok') {
        resetContext(apiBody.notebookId);
        // executeCode(apiBody.folder, cell.cellId, cell.code, apiBody.notebookId);

      }
      // executeCode(apiBody.folder, cell.cellId, cell.code, apiBody.notebookId);
      let result = executeCode(apiBody.folder, cell.cellId, cell.code, apiBody.notebookId);
      if (compiler === 'broken') {
        resetContext(apiBody.notebookId);
      }
      //added
      //////BUG HERE
      // client.setex(apiBody.folder.toString(), 3600, JSON.stringify(result));
      ////////BUG ABOVE
      //above
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

  try {
    await vm.runInNewContext(code, context);
    updateContextWrapper(notebookId);
  } catch (error) {
    arr.push(String(error));
    isSyntaxOrRuntimeError = true;
  } finally {
    writableStream.end();
    console.log('arr', arr)
    updateSubmissionOutput(submissionId, cellId, isSyntaxOrRuntimeError, arr.join(''));
    // await client.hset(submissionId.toString(), )
    await client.set(submissionId.toString(), JSON.stringify(getSubmissionOutput(submissionId)));
  }
}



module.exports = { engine };

