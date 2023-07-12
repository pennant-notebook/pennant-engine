const router = require('express').Router();
const uuid = require('uuid');
const { randomBytes } = require('crypto');
const { sendMessage, setupQueueForNoteBook, deleteQueue } = require('../config/rabbitmq.js');
const { errorResponse, successResponse, getFromRedis } = require('../utils/responses.js');
const { createTimestamp, exceedsTimeout } = require('../utils/executionTimeout.js');
const { setRedisInitial, testSetHashKey, setRedisHashkey, getField, getAllFields } = require('../utils/redisHelpers.js');

const { basicDataCheck } = require('../utils/basicDataCheck.js');

const activeNotebooks = {}
// const { createNewWorker } = require('../utils/workerTerminal.js');
const { restartContainer, createNewWorker, startContainer, workerRunning, containerExists, killContainer, removeContainer, containerActive } = require('../utils/workerManager.js');
const { send } = require('process');


const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  console.log(error)
  res.status(statusCode).send(error.message);
}
const createError = (message, statusCode) => {
  let error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const restartContainerHandler = async (notebookId) => {
  try {
    const running = await workerRunning(notebookId);
    const containerStopped = await containerExists(notebookId);
    await deleteQueue(notebookId);

    if (running) {
      console.log('restarting notebook container')
      await restartContainer(notebookId)
    } else if (containerStopped) {
      console.log('Notebook container was stopped. Starting')
      await startContainer(notebookId);
    }

    else {
      // ! Dangerous to create new workers. Need to make sure that the id is not null
      // console.log(`Notebook container did not exist. Creating new worker for ${notebookId}`);
      // await createNewWorker(notebookId);
      throw createError('Notebook container did not exist', 404);
    }

    console.log('container restarted')
    return;
  } catch (error) {
    sendError(res, error);
  }
}


// TODO check if the worker is on? 
router.post('/submit', async (req, res, next) => {
  let thrown = {};

  try {
    basicDataCheck(req, thrown);
    const { notebookId, cells } = req.body;

    const workerExists = await containerExists(notebookId);
    const workerActive = await workerRunning(notebookId);
    if (workerExists && !workerActive) {
      await deleteQueue(notebookId);
      await startContainer(notebookId);
    } else if (!activeNotebooks[notebookId] && !workerExists) {
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
    await setRedisHashkey(submissionId, {
      status: 'pending',
      notebookId: notebookId,
      timeRequested: Date.now(),
      timeProcessed: null,
      output: null,
    });

    res.status(202).json({
      submissionId,
    });
  } catch (error) {
    console.log(error);
    if (thrown.yes) {
      delete thrown.yes;
      res.status(400).send(errorResponse(400, error));
    } else {
      res.status(500).send(errorResponse(500, "System error"));
    }
  }
});


// is the context active or not?
router.get('/notebookstatus/:notebookId', (req, res, next) => { });

// reset context object

router.post('/reset/:notebookId', async (req, res, next) => {
  try {
    if (! (await containerExists(req.params.notebookId))) {
      throw createError('Context could not be reset. Notebook does not exist', 404);
    }
    restartContainerHandler(req.params.notebookId)
    res.json({ message: 'Context reset!' });
  } catch (error) {
    sendError(res, error);
  }
});





const statusCheckHandler = async (req, res) => {
  try {
    let key = req.params.id;

    const status = await getField(key, 'status');

    if (!status) {
      throw createError('Notebook ID does not exist', 404);
    }

    const output = await getField(key, 'output');

    if ([null, 'sent to queue', 'pending'].includes(status) && exceedsTimeout(key)) {

      console.log('exceeded timeout context reset')
      //TODO create a spindown worker?
      //TODO call it
      //TODO call createNewWorker()
      const notebookId = await getField(key, 'notebookId');
      await restartContainerHandler(notebookId);

      res.status(202).send({ "status": "critical error", "message": "Your notebook environment has been reset. If you were changing already declared variables, and you believe that your logic is correct, run your code one more time and it should work." });

    } else if (status === 'sent to queue' || status === 'pending') {
      console.log('sent to queue branch')
      res.status(202).send({ "status": "pending" });
    }
    else if (status == 'Processing') {
      console.log('processing')
      res.status(202).send({ "status": "pending" });
    }
    else {
      res.status(200).send(output);
    }
  } catch (error) {
    sendError(res, error);
  }

}

router.get("/status/:id", statusCheckHandler);

router.get("/results/:id", statusCheckHandler);



router.get('/test', async (req, res) => {
  res.send('testroute')
})





module.exports = router;