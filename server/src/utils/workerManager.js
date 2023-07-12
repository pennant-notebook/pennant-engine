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
  const workerNames = await listWorkers({ all: true});
  return workerNames.map(workerName => workerName.split('.')[1]).includes(notebookId);
};

const getContainerByName = async (workerName) => {
  return new Promise((resolve, reject) => {
    docker.listContainers({all: true}, (err, containers) => {
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



module.exports = { listWorkers,  containerActive, createNewWorker, getContainerByName, getContainerId, killContainer, restartContainer, isRunning , containerExists, workerRunning, startContainer, removeContainer}

