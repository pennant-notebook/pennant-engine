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
    const data = { notebookId, cells }
    // data.folder = uuid.v4();
    data.folder = randomBytes(10).toString('hex');
    console.log('apiRoutesReq.body', data)
    await sendMessage(data);
    // await listenMessage(data);
    // console.log('apiRoutesReq.body', data)
    // res.status(202).send(successResponse(`http://localhost:3002/api/results/${data.folder}`));
    res.status(202).json({
      submissionId: data.folder.toString(),
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

const statusCheckHandler = async (req, res) => {
  console.log('pping')
  try {
    let key = req.params.id;
    //added
    console.log('key', key)
    //
    let status = await getFromRedis(key);
    console.log('status', status)
    if (status === null || status === 'sent to queue') {
      res.status(202).send({ "status": "pending" });
    }
    else if (status == 'Processing') {
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
