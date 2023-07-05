const router = require('express').Router();
const uuid = require('uuid');
const { randomBytes } = require('crypto');
//erased
// const {engine} = require('../utils/engine');
// const { resetContext } = require('../utils/context');
// const { initializeSubmissionOutput, getSubmissionOutput } = require('../utils/submissionOutput');
//above
//added
const { sendMessage } = require('../config/rabbitmq.js');
// const { listenMessage } = require('../../../worker/app/config/rabbitmq.js');
const { errorResponse, successResponse, getFromRedis } = require('../utils/responses.js')
//above

router.post('/submit', async (req, res, next) => {
  //added
  try {
    console.log('reqbodyapiroute', req.body)
    const { notebookId, cells } = req.body;
    const data = {notebookId, cells}
    // data.folder = uuid.v4();
    data.folder = randomBytes(10).toString('hex');
  // await sendMessage(req.body);
  // await listenMessage(req.body);
  console.log('apiRoutesReq.body', data)
  await sendMessage(data);
  await listenMessage(data);
  // console.log('apiRoutesReq.body', data)
  res.status(202).send(successResponse(`http://localhost:3002/api/results/${data.folder}`));
  } catch (error) {
    console.log(error);
    res.status(500).send(errorResponse(500, "System error"));
  }
  //above

  //deleted
  // const { notebookId, cells } = req.body;
  // const {cellId, code}  = cells[0];

  // const cellIds = cells.map(cell => cell.cellId);

  // const submissionId = uuid.v4();

  // initializeSubmissionOutput(submissionId, cellIds);

  // engine(submissionId, cells, notebookId);

  // res.json({
  //   message: 'ok',
  //   submissionId,
  // });
  //above
});



// router.get('/status/:submissionId', (req, res, next) => {
//   const { submissionId } = req.params;
//   const result = getSubmissionOutput(submissionId);
//   res.json(result);
// });


// is the context active or not?
router.get('/status/:notebookId', (req, res, next) => { });

// reset context object

router.post('/reset/:notebookId', (req, res, next) => {
  resetContext(req.params.notebookId);
  res.json({ message: 'Context reset!' });
});


module.exports = router;
