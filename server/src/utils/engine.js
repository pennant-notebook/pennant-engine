const vm = require('vm');
const { Console } = require('console');
const { loadContext, updateContextWrapper } = require('./context');
const { updateSubmissionOutput } = require('./submissionOutput');
const {compileFrontendInput} = require("./compileFrontendInput");

const engine = async (submissionId, cells, notebookId) => {
  for (let cell of cells) {    
    try {
      let compiler = compileFrontendInput(cell, notebookId);
      if (compiler === 'broken') break;
    executeCode(submissionId, cell.cellId, cell.code, notebookId);
    } catch (error) {
      console.error("running cells raised an error: ", error);
      break;
    }
  }
}

const executeCode = async (submissionId, cellId, code, notebookId) => {

  const stream = require('stream'); 
  var util = require('util');
  const arr = [];
  function EchoStream () { // step 2
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
  }
}


module.exports = {engine};


