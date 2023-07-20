const { NETWORK_NAME,
  WORKER_QUEUE_HOST,
  WORKER_QUEUE_PORT,
  WORKER_REDIS_HOST,
  WORKER_REDIS_PORT,
  DOCKER_HOST,
  DOCKER_PORT,
} = require('../config');

const MEMORY_LIMIT = 100; // in mb;
const SCRIPT_TIMEOUT_SECONDS = 8;

const Docker = require('dockerode');
const dockerOptions = DOCKER_HOST ? {
  host: DOCKER_HOST, port: DOCKER_PORT
} : {};

const docker = new Docker(dockerOptions);
const fs = require('fs');
const child_process = require('child_process');
const { deleteQueue } = require('../config/rabbitmq');

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
terminalInterface.handler = (output) => {
  let data = '';
  if (output.data) data += ': ' + output.data.toString();
  console.log("from the cmd line", output.type + data);
};

const flushRedis = () => {
  console.log('DONE DONE DONE DONE')
  terminalInterface.send('cd ..')
  terminalInterface.send('pwd');
  // terminalInterface.send('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')
  terminalInterface.send('docker-compose exec -it redis-dredd redis-cli')
  wait(5000)
  terminalInterface.send('FLUSHALL')
  wait(5000)
  console.log('DONE DONE DONE DONE')
}

const removeAllDockerContainers = async () => {
  await listWorkers({ all: true }).then((containers) => {
    console.log('containers', containers);
    containers.forEach(id => {
      removeContainer(id.slice(8));
    })
  }).then(() => { for (var member in activeNotebooks) delete activeNotebooks[member]; })
}

const createNewWorker = async (notebookId) => {
  try {
    const container = await docker.createContainer({
      Image: 'node-worker',
      name: `worker.${notebookId}`,
      HostConfig: {
        Memory: MEMORY_LIMIT * 1024 * 1024,
        MemorySwap: MEMORY_LIMIT * 1024 * 1024,
        NetworkMode: NETWORK_NAME,
      },
      Env: [
        `QUEUE_NAME=${notebookId}`,
        `SCRIPT_TIMEOUT_S=${SCRIPT_TIMEOUT_SECONDS}`,
        `QUEUE_HOST=${WORKER_QUEUE_HOST}`,
        `QUEUE_PORT=${WORKER_QUEUE_PORT}`,
        `REDIS_HOST=${WORKER_REDIS_HOST}`,
        `REDIS_PORT=${WORKER_REDIS_PORT}`
      ],
      WorkingDir: '/app',
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      OpenStdin: true,
      StdinOnce: false
    }
    )
    container.start();
  } catch (error) {
    console.log('error while creating container', error);
  }
}

// const listWorkers = (options) => {
//   console.log('made it to list workers');
//   // console.log();
//   return new Promise((resolve, reject) => {
//     if (!containers) {
//       console.log('made it to no containers')
//       resolve([]);
//     }
//     docker.listContainers(options, (err, containers) => {
//         if (err) {
//         reject(err);
//       } else {
//         resolve(containers.map(container => container.Names[0])
//           .filter(workerName => /^\/worker/.test(workerName)));
//       }
//     })
//   })
// }

const listWorkers = async() => {
  try {
    console.log('made it to listWorkers')
    // List containers using Dockerode
    const containers = await docker.listContainers();

    // Check if the containers array is empty, if yes, return an empty array []
    if (containers.length === 0) {
      return [];
    }

    // Process the list of containers or return it as needed
    return containers;
  } catch (err) {
    // Handle errors if necessary
    console.error('Error listing containers:', err);
    return [];
  }
}







// Lists all running containers
const containerActive = async (notebookId) => {
  const workerNames = await listWorkers();
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

const workerRunning = async (workerName) => {
  const container = await getContainerByName(workerName);
  if (!container) return false;
  return container.State === 'running';
}

const workerStopped = async (workerName) => {
  const container = await getContainerByName(workerName);
  if (!container) return false;
  return container.State === 'exited';
}

// List all containers, running or stopped
const containerExists = async (notebookId) => {
  // const workerNames = await listWorkers({ all: true });
  const workerNames = await listWorkers();
  console.log('workerNames', workerNames)
  return workerNames.map(workerName => workerName.split('.')[1]).includes(notebookId);
};


const getContainerId = async (workerName) => {
  const container = await getContainerByName(workerName);
  if (!container) return null;
  return container.Id;
}

const stopContainer = async (workerName) => {
  const id = await getContainerId(workerName);
  if (!id || await workerStopped(workerName)) {
    console.log(`Stopping container failed. Container not found/or already exited`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.stop();
}

const killContainer = async (workerName) => {
  const id = await getContainerId(workerName);
  if (!id || await workerStopped(workerName)) {
    console.log(`Killing container failed. Container not found/or already exited`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.kill();
}

const restartContainer = async (workerName) => {
  const id = await getContainerId(workerName);
  if (!id || await workerStopped(workerName)) {
    console.log(`Restarting container failed. Container not found/not active: /worker.${workerName}`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.restart();
}

const startContainer = async (workerName) => {
  const id = await getContainerId(workerName);

  if (!id || await workerRunning(workerName)) {
    console.log(`Starting container failed. Container either does not exist or is already running`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.start();
}


const removeContainer = async (workerName) => {
  console.log('workerName', workerName);
  await deleteQueue(workerName);
  const id = await getContainerId(workerName);
  if (!id) {
    console.log(`Removing container failed. Container not found: /worker.${workerName}`);
    return null;
  };
  const container = docker.getContainer(id);
  return container.remove({ force: true });
}

// TODO
/* 
containerExists and is running ( containerActive )
container does not exist ( would there ever be a situation when this is true? )
  
 */

const isRunning = (workerName) => {
  return false;
}

const activeNotebooks = {}



module.exports = { activeNotebooks, flushRedis, removeAllDockerContainers, listWorkers, containerActive, createNewWorker, getContainerByName, getContainerId, killContainer, restartContainer, isRunning, containerExists, workerRunning, startContainer, removeContainer }