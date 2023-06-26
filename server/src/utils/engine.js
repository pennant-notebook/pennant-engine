const vm = require('vm');
const { Console } = require('console');
const fs = require('fs');
const path = require('path');
const { loadContext, updateContextWrapper } = require('./context');


const logFileStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });


const customConsole = new Console(logFileStream, logFileStream);

const engine = (code, notebookId) => {
  const context = loadContext(notebookId);
  context.console = customConsole;
  updateContextWrapper(notebookId);
  vm.runInNewContext(code, context);
}



module.exports = engine;

