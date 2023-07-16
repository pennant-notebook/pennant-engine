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

let variableMap = { 'const': {}, 'var': {}, 'let': {} };

// {
//   "variableName": {
//     declaration: "const", 
//     cellId: "cellId2385283" },
// }
let variableMapV2 = {};

const setVarInMap = (variable, declaration, cellId) => {
  if (variableMapV2[variable]) {
    console.log(`variable ${variable} already exists in variableMapV2`);
    return;
  }
  variableMapV2[variable] = { declaration, cellId };
}

const varDeclaredInThisCell = (variable, cellId) => {
  if (!variableMapV2[variable]) return false;
  return variableMapV2[variable].cellId === cellId;
}

const getVarFromMapV2 = (variable) => {
  return variableMapV2[variable];
}

const typeofDeclaration = (variable) => {
  if (!variableMapV2[variable]) return null;
  return variableMapV2[variable].declaration;
}

const getVarMapV2 = () => {
  return variableMapV2;
}



const cellsRun = {};
const declaredAt = {};
const changedVariables = {}

const updateVariableMap = (variable, value) => {
  variableMap[variable] = value;
}

const updateCellsRun = (cellId, value) => {
  cellsRun[cellId] = value
}

const updateDeclaredAt = (variable) => {
  declaredAt[variable] = true;
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

const getDeclaredAt = () => {
  return declaredAt;
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
  variableMapV2 = {};


  for (var member in cellsRun) delete cellsRun[member];
  for (var member in declaredAt) delete declaredAt[member];
}

const updateContextWrapper = (notebookId) => {
  contextStore[notebookId].lastUpdate = Date.now();
}

module.exports = {
  loadContext, updateContextWrapper, resetContext, getVariableMap, getCellsRun, getDeclaredAt, getChangedVariables, updateVariableMap, updateCellsRun, updateDeclaredAt, updateChangedVariables,

  setVarInMap,
  varDeclaredInThisCell,
  typeofDeclaration,
  getVarMapV2,
};