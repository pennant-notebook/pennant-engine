const router = require('express').Router();
const uuid = require('uuid');
const { randomBytes } = require('crypto');
//erased
// const {engine} = require('../utils/engine');
// const { resetContext } = require('../utils/context');
// const { initializeSubmissionOutput, getSubmissionOutput } = require('../utils/submissionOutput');
//above
//added
//!
// const { sendMessage } = require('../config/rabbitmq.js');
const { sendMessage, queueExists, setupQueueForNoteBook } = require('../config/rabbitmq.js');
//!
const { errorResponse, successResponse, getFromRedis } = require('../utils/responses.js');
const { createTimestamp, exceedsTimeout } = require('../utils/executionTimeout.js');
//above

const activeNotebooks = {}
//! BACK TO 0
let fileCount = 3;
let workerCount = 3;
//!
const fs = require('fs');
const child_process = require('child_process');



router.post('/submit', async (req, res, next) => {
  //added
  try {
    //!
    // restart = true;
    console.log('fileCountBefore', fileCount)
    //!
    console.log('reqbodyapiroute', req.body)
    //! CONST TO LET
    let { notebookId, cells } = req.body;
    //!
    if (!activeNotebooks[notebookId]) {
      // CREATE INTERFACE
      var interface = {
          
        terminal: child_process.spawn('/bin/sh'),
        // terminal: child_process.spawn('C:/bin/sh'),
        handler: console.log,
        send: (data) => {
            interface.terminal.stdin.write(data + '\n');
        },
        cwd: () => {
            let cwd = fs.readlinkSync('/proc/' + interface.terminal.pid + '/cwd');
            interface.handler({ type: 'cwd', data: cwd });
        }
      };

      // Handle Data
      interface.terminal.stdout.on('data', (buffer) => {
        interface.handler({ type: 'data', data: buffer });
      });

      // Handle Error
      interface.terminal.stderr.on('data', (buffer) => {
        interface.handler({ type: 'error', data: buffer });
      });

      // Handle Closure
      interface.terminal.on('close', () => {
        interface.handler({ type: 'closure', data: null });
      });

      //USE INTERFACE
      //! spin up another docker worker here
      interface.handler = (output) => {
        let data = ''; 
        if (output.data) data += ': ' + output.data.toString();
        console.log("from the cmd line", output.type + data);
      };
      interface.send('cd ../worker')
      interface.send('pwd');
      //!1 CREATE FILE
      interface.send(`touch docker-compose.${fileCount}.yml`);
      function wait(ms){
        var start = new Date().getTime();
        var end = start;
        while(end < start + ms) {
          end = new Date().getTime();
        }
      }
      console.log('before');
      wait(10);  //.01 seconds in milliseconds
      console.log('after');
      //!2 WRITE TO FILE
      //!don't change the format below, or it will create an incorrect formatted docker-compose
interface.send(`echo "version: '2.3'

services:
  node-worker-${workerCount}:
    build:
      context: .
      dockerfile: Dockerfile

    networks:
      - dredd-network

networks:
  dredd-network:
    external:
      name: dredd-network " >> docker-compose.${fileCount}.yml`);
      console.log('before');
      wait(10);  //.01 seconds in milliseconds
      console.log('after');
      //!3 DOCKER COMPOSE UP
      interface.send(`docker compose -f docker-compose.${fileCount}.yml up`);
      console.log('before');
      wait(10);  //.01 seconds in milliseconds
      console.log('after');
      //!ABOVE
      activeNotebooks[notebookId] = true;
      //!replace with a sqL call to db
      fileCount += 1;
      workerCount += 1;
    }
    //!CONST TO LET
    let data = { notebookId, cells }
    //!
    notebookId = 'jobs'
    // ! test notebookId test1
    notebookId = 'test4'
    //!
    // data.folder = uuid.v4();
    data.folder = randomBytes(10).toString('hex');
    const submissionId = data.folder.toString();
    createTimestamp(submissionId, 10000);
    console.log('apiRoutesReq.body', data)
    //!
    // await sendMessage(data);
     // ! queue must always be asserted, even if it already exists
     setupQueueForNoteBook(notebookId); 
     await sendMessage(data, notebookId); 
    //!
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

module.exports = router;