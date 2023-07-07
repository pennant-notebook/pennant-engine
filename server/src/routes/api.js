const router = require('express').Router();
const uuid = require('uuid');
const { randomBytes } = require('crypto');
//erased
// const {engine} = require('../utils/engine');
// const { resetContext } = require('../utils/context');
// const { initializeSubmissionOutput, getSubmissionOutput } = require('../utils/submissionOutput');
//above
//added
const { sendMessage, queueExists, setupQueueForNoteBook } = require('../config/rabbitmq.js');
const { errorResponse, successResponse, getFromRedis } = require('../utils/responses.js');
const { createTimestamp, exceedsTimeout } = require('../utils/executionTimeout.js');
//above

// TODO - request body validation
router.post('/submit', async (req, res, next) => {
  //added
  try {
    // ! hardcoding notebookId for now
    console.log('reqbodyapiroute', req.body)
    let { notebookId, cells } = req.body;
    notebookId = 'jobs'
    // ! test notebookId test1
    notebookId = 'test1'
    const data = { notebookId, cells }
    // data.folder = uuid.v4();
    data.folder = randomBytes(10).toString('hex');
    const submissionId = data.folder.toString();
    createTimestamp(submissionId, 10000);
    console.log('apiRoutesReq.body', data)
    // ! queue must always be asserted, even if it already exists
    setupQueueForNoteBook(notebookId); 
    await sendMessage(data, notebookId); 
    // console.log('apiRoutesReq.body', data)
    // res.status(202).send(successResponse(`http://localhost:3002/api/results/${data.folder}`));
    res.status(202).json({
      submissionId,
    });
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
router.get('/notebookstatus/:notebookId', (req, res, next) => { });

// reset context object

router.post('/reset/:notebookId', (req, res, next) => {
  resetContext(req.params.notebookId);
  res.json({ message: 'Context reset!' });
});

// TODO: More robust error handling that can distinguish between user code timeouts and system errors
const statusCheckHandler = async (req, res) => {
  try {
    let key = req.params.id;
    let status = await getFromRedis(key);
    console.log('status', status)


    if ((status === null || status === 'sent to queue') && exceedsTimeout(key)) {
      console.log('exceeded timeout')
      res.status(202).send({ "status": "timeout exceeded" });
    } else if (status === null || status === 'sent to queue') {
      console.log('sent to queue')
      res.status(202).send({ "status": "pending" });
    }
    else if (status == 'Processing') {
      console.log('processing')
      res.status(202).send({ "status": "pending" });
    }
    else {
      status = JSON.parse(status);
      res.status(200).send(successResponse(status));
    }
  } catch (error) {
    res.status(500).send(errorResponse(500, "System error"));
  }

}
router.get("/status/:id", statusCheckHandler);

//added
router.get("/results/:id", statusCheckHandler);


/* 
console.log('null')

status: null
status: sent to queue
status: processing

status: {output of executed code}

{status:  
output: 
}

*/
//above



module.exports = router;