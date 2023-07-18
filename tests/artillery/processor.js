module.exports = {
  generateRandomNotebookId: (userContext, events, done) => {
    const notebookId = Math.random().toString(36).substring(2, 15);
    userContext.vars.notebookId = notebookId;
    return done();
  },
};