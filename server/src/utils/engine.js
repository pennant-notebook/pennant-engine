const vm = require('vm');
const { Console } = require('console');
const fs = require('fs');
const path = require('path');
const { loadContext, updateContextWrapper } = require('./context');




const createSubmissionOutputFile = (submissionId) => {
  const outputFilePath = path.join(__dirname, '/temp/', `output-${submissionId}.txt`);
  const outputFileStream = fs.createWriteStream(outputFilePath, { flags: 'a' });
  return outputFileStream;
}


const engine = (submissionId, code, notebookId, cellId) => {
  const logFileStream  = createSubmissionOutputFile(submissionId);
  const customConsole = new Console(logFileStream, logFileStream);
  const context = loadContext(notebookId);
  context.console = customConsole;
  console.log(`__dirname: `, __dirname)

  try {
    vm.runInNewContext(code, context);
    updateContextWrapper(notebookId);
  } catch (error) {
    logFileStream.write(`\n${error.stack}\n`);
  }
}



module.exports = engine;

