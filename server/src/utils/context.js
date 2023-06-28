/* 
Context should be wrapped with metadata

- last update
- active: t or f
- reason for deactivation: error, timeout, user killed, idle, etc.



what happens to the context when there is an error?

should FE have an active context indicator?


Take in a notebook.
*/
const main = require("./engine");

const contextStore = {
  "111": {
    active: true,
    lastUpdate: 1687812247076,
    context: {}
  }
}

const loadContext = (notebookId) => {
  if (!contextStore.hasOwnProperty(notebookId)) {
    contextStore[notebookId] = {
      active: true,
      lastUpdate: Date.now(),
      context: {},
    }
  };

  if (!contextStore[notebookId].active) {
    contextStore[notebookId].active = true;
    contextStore[notebookId].context = {};
  }
  return contextStore[notebookId].context;
}

const resetContext = (notebookId) => {
  contextStore[notebookId].active = false;
  contextStore[notebookId].context = {};
  //resets the in-memory state of context in engine.js
  for (var member in main.variableMap) delete main.variableMap[member];
  for (var member in main.cellsRun) delete main.cellsRun[member];
  for (var member in main.flagged) delete main.flagged[member];
}

const updateContextWrapper = (notebookId) => {
  contextStore[notebookId].lastUpdate = Date.now();
}

module.exports = { loadContext, updateContextWrapper, resetContext};