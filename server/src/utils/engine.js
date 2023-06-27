const vm = require('vm');
const { Console } = require('console');
const fs = require('fs');
const path = require('path');
const { loadContext, updateContextWrapper } = require('./context');
const { updateSubmissionOutput } = require('./submissionOutput');

const getPath = (submissionId, cellId) => {
  return path.join(__dirname, '/temp/', `output-${submissionId}-${cellId}.txt`);
}

const engine = async (submissionId, cells, notebookId) => {
  for (let cell of cells) {
    try {
      executeCode(submissionId, cell.cellId, cell.code, notebookId);
    } catch (error) {
      console.error("running cells raised an error: ", error);
      break;
    }
  }
}

// we might want to reset context when the code raises errors.

const executeCode = async (submissionId, cellId, code, notebookId) => {
  const execOutputFile = getPath(submissionId, cellId);
  const logFileStream = fs.createWriteStream(execOutputFile, { flags: 'a' });

  const customConsole = new Console(logFileStream, logFileStream);
  const context = loadContext(notebookId);
  context.console = customConsole;

  let isSyntaxOrRuntimeError = false;

  try {
    await vm.runInNewContext(code, context);
    updateContextWrapper(notebookId);
  } catch (error) {
    isSyntaxOrRuntimeError = true;
    await logFileStream.write(`\n${error.stack}\n`);
  } finally {
    logFileStream.end();
  }

  fs.readFile(execOutputFile, 'utf8', (err, data) => {
    if (err) {
      console.error("file read error: ", err)
      return
    }

    updateSubmissionOutput(submissionId, cellId, isSyntaxOrRuntimeError, data);
    

    fs.unlink(execOutputFile, (err) => {
      if (err) {
        console.error("file delete error: ", err)
        return
      }
    })
  });
}



module.exports = engine;

