const router = require('express').Router();
const uuid = require('uuid');
const { randomBytes } = require('crypto');
const { sendMessage, setupQueueForNoteBook } = require('../config/rabbitmq.js');
const { errorResponse, successResponse, getFromRedis } = require('../utils/responses.js');
const { createTimestamp, exceedsTimeout } = require('../utils/executionTimeout.js');


const activeNotebooks = {}
// const { createNewWorker } = require('../utils/workerTerminal.js');
const { restartContainer, createNewWorker, startContainer, workerRunning, containerExists, killContainer, removeContainer, containerActive } = require('../utils/workerManager.js');

router.post('/submit', async (req, res, next) => {
  try {
    //TODO some checks on req body if diff than shape we expect
    console.log('reqbodyapiroute', req.body)
    const { notebookId, cells } = req.body;

    const workerExists = await containerActive(notebookId);
    if (!activeNotebooks[notebookId] && !workerExists) {
      createNewWorker(notebookId);
      activeNotebooks[notebookId] = true;
      //!replace with a sqL call to db
    }
    const data = { notebookId, cells }
    setupQueueForNoteBook(notebookId);

    data.folder = randomBytes(10).toString('hex');
    const submissionId = data.folder.toString();
    createTimestamp(submissionId, 10000);
    console.log('apiRoutesReq.body', data)
    await sendMessage(data, notebookId);
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
  //TODO validation for invalid notebook Ids (throw err if invalid)
  //try
  resetContext(req.params.notebookId);
  res.json({ message: 'Context reset!' });
  //catch
  //send(400)
});

// TODO: More robust error handling that can distinguish between user code timeouts and system errors
const statusCheckHandler = async (req, res) => {
  try {
    let key = req.params.id;
    let status = await getFromRedis(key);
    console.log('status from redis: ', status);
    console.log('status', status)

    //create conditional with payload of {"status": "critical error"}
    if ((status === null || status === 'sent to queue') && exceedsTimeout(key)) {
      console.log('exceeded timeout context reset')
      //TODO create a spindown worker?
      //TODO call it
      //TODO call createNewWorker()

      //


      //
      res.status(202).send({ "status": "critical error", "message": "Your notebook environment has been reset. If you were changing already declared variables, and you believe that your logic is correct, run your code one more time and it should work." });
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


const Docker = require('dockerode');
const docker = new Docker();

// ! testing only
router.get('/test', async (req, res) => {


  removeContainer('looper');
  restartContainerHandler('looper')
  res.send('ok');
})

const restartContainerHandler = async (notebookId) => {
  try {
    const running = await workerRunning(notebookId);
    const containerStopped = await containerExists(notebookId);

    if (running) {
      console.log('restarting notebook container')
      await restartContainer(notebookId)
    } else if (containerStopped) {
      console.log('Notebook container was stopped. Starting')
      await startContainer(notebookId);
    } else {
      console.log(`Notebook container did not exist. Creating new worker for ${notebookId}`);
      await createNewWorker(notebookId);
    }
    console.log('container restarted')
    return;
  } catch (error) {
    console.log(error);
    return;
  }
}
/* 
if there's a timeout
  - check if the container is still running
    - if it is, stop it
    - if it isn't, restart it
*/



module.exports = router;