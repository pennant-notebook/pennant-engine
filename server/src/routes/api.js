const router = require('express').Router();
const uuid = require('uuid');
const engine = require('../utils/engine');
const { resetContext } = require('../utils/context');

router.post('/submit', async (req, res, next) => {
  const submissionId = uuid.v4();
  console.log(req.body);
  const result = await engine(req.body.code, req.body.notebookid);

  console.log(`result 🍉: `, result)

  res.json({
    message: 'Hello, submission!', submissionId,
    banana: 'banana',
    cheeseits: result
  });
});

router.post('/submit/multiple', (req, res, next) => {
  const submissionId = uuid.v4();
  console.log(req.body);
  res.json({ message: 'Hello, multiple submission!', submissionId });
});

router.get('/status/:submissionId', (req, res, next) => {
  res.json({ message: 'Hello, status!' });
});


// is the context active or not?
router.get('/status/:notebookId', (req, res, next) => { });

// reset context object

router.post('/reset/:notebookId', (req, res, next) => { 
  resetContext(req.params.notebookId);
  res.json({ message: 'Context reset!' });
});


module.exports = router;
