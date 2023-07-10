const Docker = require('dockerode');
const docker = new Docker();


const listWorkers = () => {
  return new Promise((resolve, reject) => {
    docker.listContainers((err, containers) => {
      if (err) {
        reject(err);
      }
      resolve(containers.map(container => container.Names[0])
        .filter(name => /^\/worker/.test(name)));
    })
  })
}

const containerExists = async (notebookId) => {
  const workerNames = await listWorkers();
  return workerNames.map(name => name.split('.')[1]).includes(notebookId);
};

module.exports = { listWorkers, containerExists }