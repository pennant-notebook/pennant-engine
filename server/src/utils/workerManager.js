const { NETWORK_NAME,
  WORKER_QUEUE_HOST,
  WORKER_QUEUE_PORT,
  WORKER_REDIS_HOST,
  WORKER_REDIS_PORT
} = require('../config');

const MEMORY_LIMIT = 100; // in mb;
const SCRIPT_TIMEOUT_SECONDS = 8;

const Docker = require('dockerode');
const docker = new Docker();
const fs = require('fs');
const child_process = require('child_process');

function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

const terminalInterface = {
  terminal: child_process.spawn('/bin/sh'),
  handler: console.log,
  send: (data) => {
    terminalInterface.terminal.stdin.write(data + '\n');
  },
  cwd: () => {
    let cwd = fs.readlinkSync('/proc/' + terminalInterface.terminal.pid + '/cwd');
    terminalInterface.handler({ type: 'cwd', data: cwd });
  }
};

// Handle Data
terminalInterface.terminal.stdout.on('data', (buffer) => {
  terminalInterface.handler({ type: 'data', data: buffer });
});

// Handle Error
terminalInterface.terminal.stderr.on('data', (buffer) => {
  terminalInterface.handler({ type: 'error', data: buffer });
});

// Handle Closure
terminalInterface.terminal.on('close', () => {
  terminalInterface.handler({ type: 'closure', data: null });
});

//USE INTERFACE
//! spin up another docker worker here
terminalInterface.handler = (output) => {
  let data = '';
  if (output.data) data += ': ' + output.data.toString();
  console.log("from the cmd line", output.type + data);
};

const createNewWorker = (notebookId) => {
  console.log('Deploying new worker for notebookId: ', notebookId);
  console.log(`Memory limit is ${MEMORY_LIMIT}mb`);
  console.log(`Script timeout is ${SCRIPT_TIMEOUT_SECONDS} seconds`);

  const DOCKER_RUN_CMD = `docker run -d \
  -m ${MEMORY_LIMIT}m --memory-swap ${MEMORY_LIMIT}m \
  --name worker.${notebookId} \
  --network ${NETWORK_NAME} \
  -e QUEUE_NAME=${notebookId} \
  -e SCRIPT_TIMEOUT_S=${SCRIPT_TIMEOUT_SECONDS} \
  -e QUEUE_HOST=${WORKER_QUEUE_HOST} \
  -e QUEUE_PORT=${WORKER_QUEUE_PORT} \
  -e REDIS_HOST=${WORKER_REDIS_HOST} \
  -e REDIS_PORT=${WORKER_REDIS_PORT} \
  -v ./app \
  -w /app \
  node-worker`;

  terminalInterface.send('cd ../worker')
  terminalInterface.send('pwd');
  wait(10);  //.01 seconds in milliseconds
  terminalInterface.send(DOCKER_RUN_CMD);
  wait(10);  //.01 seconds in milliseconds
}

const listWorkers = (options) => {
  return new Promise((resolve, reject) => {
    docker.listContainers(options, (err, containers) => {
      if (err) {
        reject(err);
      }
      resolve(containers.map(container => container.Names[0])
        .filter(workerName => /^\/worker/.test(workerName)));
    })
  })
}

// Lists all running containers
const containerActive = async (notebookId) => {
  const workerNames = await listWorkers();
  return workerNames.map(workerName => workerName.split('.')[1]).includes(notebookId);
};

// List all containers, running or stopped
const containerExists = async (notebookId) => {
  const workerNames = await listWorkers({ all: true });
  return workerNames.map(workerName => workerName.split('.')[1]).includes(notebookId);
};

const getContainerByName = async (workerName) => {
  return new Promise((resolve, reject) => {
    docker.listContainers({ all: true }, (err, containers) => {
      if (err) {
        reject(err);
      }
      resolve(containers.filter(container => {
        return container.Names[0] === '/worker.' + workerName;
      })[0]);
    })
  })
};

const getContainerId = async (workerName) => {
  const container = await getContainerByName(workerName);
  if (!container) return null;
  return container.Id;
}

const stopContainer = async (workerName) => {
  const id = await getContainerId(workerName);
  if (!id) {
    console.log(`Stopping container failed. Container not found/not active: /worker.${workerName}`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.stop();
}

const killContainer = async (workerName) => {
  const id = await getContainerId(workerName);
  if (!id) {
    console.log(`Killing container failed. Container not found/not active: /worker.${workerName}`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.kill();
}
const restartContainer = async (workerName) => {
  const id = await getContainerId(workerName);
  if (!id) {
    console.log(`Restarting container failed. Container not found/not active: /worker.${workerName}`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.restart();
}

const startContainer = async (workerName) => {
  const id = await getContainerId(workerName);
  if (!id) {
    console.log(`Starting container failed. Container not found/not active: /worker.${workerName}`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.start();
}

const workerRunning = async (workerName) => {
  const container = await getContainerByName(workerName);
  if (!container) return false;
  return container.State === 'running';
}

const removeContainer = async (workerName) => {
  const id = await getContainerId(workerName);
  if (!id) {
    console.log(`Removing container failed. Container not found: /worker.${workerName}`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.remove();
}

// TODO
/* 
containerExists and is running ( containerActive )
container does not exist ( would there ever be a situation when this is true? )
  
 */

const isRunning = (workerName) => {
  return false;
}



module.exports = { listWorkers, containerActive, createNewWorker, getContainerByName, getContainerId, killContainer, restartContainer, isRunning, containerExists, workerRunning, startContainer, removeContainer }