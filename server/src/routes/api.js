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
const { errorResponse, successResponse, getFromRedis } = require('../utils/responses.js');
const { createTimestamp, exceedsTimeout } = require('../utils/executionTimeout.js');
//above

const activeNotebooks = {}
let fileCount = 0;
let workerCount = 0;
// let portCount = 3005;
// Import Modules
const fs = require('fs');
const child_process = require('child_process');

// Create Interface
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
//!ABOVE

router.post('/submit', async (req, res, next) => {
  //added
  try {
    console.log('reqbodyapiroute', req.body)
    const { notebookId, cells } = req.body;
    if (!activeNotebooks[notebookId]) {
      //! spin up another docker worker here
      //! for this to work, you have to de-dockerize server and start with separate command?
      //! or can start with the && to run simultaneously docker compose up --build && npm run dev (put the script in base of repo and link npm run dev to app.js in server)
      //? this is where the docker run --name ${notebookId} landzbej/worker command goes
      //? docker exec container-name tail /var/log/date.log
      //how to run this command?
      //!ADDED
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
      wait(10);  //7 seconds in milliseconds
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
      wait(10);  //7 seconds in milliseconds
      console.log('after');
     //!3 DOCKER COMPOSE UP
     interface.send(`docker compose -f docker-compose.${fileCount}.yml up`);
      console.log('before');
      wait(10);  //7 seconds in milliseconds
      console.log('after');
      //!ABOVE
      activeNotebooks[notebookId] = true;
      //!replaced by a sqL call to db
    }
    const data = { notebookId, cells }
    // data.folder = uuid.v4();
    data.folder = randomBytes(10).toString('hex');
    const submissionId = data.folder.toString();
    createTimestamp(submissionId, 10000);
    console.log('apiRoutesReq.body', data)
    await sendMessage(data);
    //!ADDED
    fileCount += 1;
    workerCount += 1;
    // portCount += 1;
    console.log('fileCount', fileCount)
    //!ABOVE
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