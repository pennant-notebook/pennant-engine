const router = require('express').Router();
const uuid = require('uuid');
const {engine} = require('../utils/engine');
const { resetContext } = require('../utils/context');
const { initializeSubmissionOutput, getSubmissionOutput } = require('../utils/submissionOutput');

router.post('/submit', async (req, res, next) => {
  const { notebookId, cells } = req.body;
  const {cellId, code}  = cells[0];

  const cellIds = cells.map(cell => cell.cellId);

  const submissionId = uuid.v4();

  initializeSubmissionOutput(submissionId, cellIds);

  engine(submissionId, cells, notebookId);

  res.json({
    message: 'ok',
    submissionId,
  });
});



router.get('/status/:submissionId', (req, res, next) => {
  const { submissionId } = req.params;
  const result = getSubmissionOutput(submissionId);
  res.json(result);
});


// is the context active or not?
router.get('/status/:notebookId', (req, res, next) => { });

// reset context object

router.post('/reset/:notebookId', (req, res, next) => {
  resetContext(req.params.notebookId);
  res.json({ message: 'Context reset!' });
});


module.exports = router;
