/* 
Context should be wrapped with metadata

- last update
- active: t or f
- reason for deactivation: error, timeout, user killed, idle, etc.



what happens to the context when there is an error?

should FE have an active context indicator?


Take in a notebook.
*/
// const main = require("./engine");

const contextStore = {
  "111": {
    active: true,
    lastUpdate: 1687812247076,
    context: {}
  }
}

const variableMap = {};
const cellsRun = {};
const flagged = {};
const changedVariables = {}

const updateVariableMap = (variable, value) => {
  variableMap[variable] = value;
}

const updateCellsRun = (cellId, value) => {
  cellsRun[cellId] = value
}

const updateFlagged = (variable) => {
  flagged[variable] = true;
}

const updateChangedVariables = (variable, cellId) => {
  changedVariables[variable] = `${variable}${cellsRun[cellId]}` 
}

const getVariableMap = () => {
  return variableMap;
}

const getCellsRun = () => {
  return cellsRun;
}

const getFlagged = () => {
  return flagged;
}

const getChangedVariables = () => {
  return changedVariables;
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
  for (var member in variableMap) delete variableMap[member];
  for (var member in cellsRun) delete cellsRun[member];
  for (var member in flagged) delete flagged[member];
}

const updateContextWrapper = (notebookId) => {
  contextStore[notebookId].lastUpdate = Date.now();
}

module.exports = { loadContext, updateContextWrapper, resetContext, getVariableMap, getCellsRun, getFlagged, getChangedVariables, updateVariableMap, updateCellsRun, updateFlagged, updateChangedVariables};