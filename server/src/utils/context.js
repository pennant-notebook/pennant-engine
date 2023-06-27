/* 
Context should be wrapped with metadata

- last update
- active: t or f
- reason for deactivation: error, timeout, user killed, idle, etc.



what happens to the context when there is an error?

should FE have an active context indicator?


Take in a notebook.
*/

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
}

const updateContextWrapper = (notebookId) => {
  contextStore[notebookId].lastUpdate = Date.now();
}

module.exports = { loadContext, updateContextWrapper, resetContext};