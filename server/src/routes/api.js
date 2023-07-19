const router = require('express').Router();
const { randomBytes } = require('crypto');
const { sendMessage, setupQueueForNoteBook, deleteQueue } = require('../config/rabbitmq.js');
const { errorResponse } = require('../utils/responses.js');
const { createTimestamp, exceedsTimeout } = require('../utils/executionTimeout.js');
const { setRedisHashkey, getField } = require('../utils/redisHelpers.js');

const { basicDataCheck } = require('../utils/basicDataCheck.js');

const { restartContainer, createNewWorker, startContainer, workerRunning, containerExists, killContainer, activeNotebooks } = require('../utils/workerManager.js');

// const activeNotebooks = activeNotebooks;

function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}
const timeouts = {};


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
    throw error;
  }
}


// changes lost by the merge
// TODO check if the worker is on? 
router.post('/submit', async (req, res, next) => {
  let thrown = {};

  try {
    console.log('made it to submit route')
    basicDataCheck(req, thrown);
    console.log('made it past basic data check')
    const { notebookId, cells } = req.body;
    console.log('made it past parsing')
    const workerExists = await containerExists(notebookId);
    console.log('made it past worker exists check')
    const workerActive = await workerRunning(notebookId);
    console.log('made it past worker active check')
    if (workerExists && !workerActive) {
      console.log('thinks container exists')
      await deleteQueue(notebookId);
      await startContainer(notebookId);
    } else if (!activeNotebooks[notebookId] && !workerExists) {
      createNewWorker(notebookId);
      console.log('made it past create new docker')
      activeNotebooks[notebookId] = true;
      //!replace with a sqL call to db
    }
    const data = { notebookId, cells }
    console.log('made it to rabbit queue setup')
    setupQueueForNoteBook(notebookId);
    console.log('made it past rabbit queue setup')
    data.folder = randomBytes(10).toString('hex');
    const submissionId = data.folder.toString();
    createTimestamp(submissionId, 10000);
    console.log('apiRoutesReq.body', data)

    await sendMessage(data, notebookId);
    console.log('made it past send message')
    await setRedisHashkey(submissionId, {
      status: 'pending',
      notebookId: notebookId,
      timeRequested: Date.now(),
      timeProcessed: null,
      output: null,
    });
    console.log('made it past set redis hashkey')
    res.status(202).json({
      submissionId,
    });
    console.log('made it past status submission')
   if(timeouts[notebookId]) {
    clearTimeout(timeouts[notebookId])
   };
   timeouts[notebookId] = setTimeout(() => {
    // console.log('container killed')
    killContainer(`${notebookId}`)
    delete activeNotebooks[notebookId];
    deleteQueue(notebookId);
   }, 1000*15*60)
   console.log('made it to bottom of try block')
  } catch (error) {
    console.log('made it to catch block')
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
router.get('/notebookstatus/:notebookId', async (req, res, next) => {
  try {
    if (!(await containerExists(req.params.notebookId))) {
      throw createError('Notebook does not exist', 404);
    }
    const { notebookId } = req.params;
    const active = await workerRunning(notebookId);
    res.send({ notebookId, active });
  } catch (error) {
    sendError(res, error);
  }
}
);

// reset context object

router.post('/reset/:notebookId', async (req, res, next) => {
  try {
    if (!(await containerExists(req.params.notebookId))) {
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
      throw createError('Submission ID does not exist', 404);
    }

    const output = await getField(key, 'output');

    if ([null, 'sent to queue', 'pending'].includes(status) && exceedsTimeout(key)) {

      console.log('exceeded timeout context reset')
      //TODO create a spindown worker?
      //TODO call it
      //TODO call createNewWorker()
      const notebookId = await getField(key, 'notebookId');
      await restartContainerHandler(notebookId);

      res.status(202).send({ "status": "critical error", "message": "Your notebook environment has been reset." });
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

router.get('/', (req, res) => {
  res.send('ok');
})



module.exports = router;