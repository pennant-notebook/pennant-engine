const fs = require('fs');
const child_process = require('child_process');

function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

var interface = {
  terminal: child_process.spawn('/bin/sh'),
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

const createNewWorker = (notebookId) => {
  const DOCKER_RUN_CMD = `docker run -d \
  --name worker.${notebookId} \
  --network dredd-network \
  -e QUEUE_NAME=${notebookId} \
  -v ./app \
  -w /app \
  node-worker`;

  interface.send('cd ../worker')
  interface.send('pwd');
  wait(10);  //.01 seconds in milliseconds
  interface.send(DOCKER_RUN_CMD);
  wait(10);  //.01 seconds in milliseconds
}


module.exports = { createNewWorker }