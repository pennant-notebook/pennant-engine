const router = require('express').Router();
const uuid = require('uuid');
const { randomBytes } = require('crypto');
const { sendMessage } = require('../config/rabbitmq.js');
const { errorResponse, successResponse, getFromRedis } = require('../utils/responses.js');
const { createTimestamp, exceedsTimeout } = require('../utils/executionTimeout.js');


const activeNotebooks = {}
const { createNewWorker } = require('../utils/workerTerminal.js');
const { listWorkers, containerExists } = require('../utils/workerManagement.js');



router.post('/submit', async (req, res, next) => {
  try {
    console.log('reqbodyapiroute', req.body)
    const { notebookId, cells } = req.body;

    const workerExists = await containerExists(notebookId);
    if (!activeNotebooks[notebookId] && !workerExists) {
      createNewWorker(notebookId);
      activeNotebooks[notebookId] = true;
      //!replace with a sqL call to db
    }
    const data = { notebookId, cells }
    data.folder = randomBytes(10).toString('hex');
    const submissionId = data.folder.toString();
    createTimestamp(submissionId, 10000);
    console.log('apiRoutesReq.body', data)
    await sendMessage(data);
    res.status(202).json({
      submissionId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(errorResponse(500, "System error"));
  }
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



router.get('/test', async (req, res) => {

  const workers = await listWorkers();

  console.log(workers)
  const result = await containerExists('CATMAN');

  console.log(result);
  res.send('ok');
})

module.exports = router;