/* 
Payload example: 
{
    "submissionId": "997480da-26e7-4b45-80ba-9b84059c6d40",
    "status": "success",
    "cellExecutionOrder": [
        "2"
    ],
    "cellsExecuted": [
        "2"
    ],
    "results": {
        "2": {
            "type": "output",
            "output": "hi friends\n"
        }
    }
}
*/

const submissionResults = {};

const initializeSubmissionOutput = (submissionId, ...cellIds) => {
  submissionResults[submissionId] = {
    submissionId,
    status: 'pending',
    requestOrder: cellIds,
    cellsExecuted: [],
    results: [],
  };

  // console.log(`submissionResults: `, submissionResults);
}

// Payload structure still pending
const updateSubmissionOutput = (submissionId, cellId, isError, output) => {
  //Initialize submission output has not been run anywhere in worker
  //therefore, submissionResults[submissionId] is undefined
  submissionResults[submissionId].status = isError ? 'error' : 'success';
  submissionResults[submissionId].cellsExecuted.push(cellId);

  submissionResults[submissionId].results.push(
    {
      cellId,
      type: isError ? 'error' : 'output',
      output: output || 'undefined',
    }
  )


  // console.log(`submissionResults: `, submissionResults);
  // console.log(`submissionResults[submissionId]: `, submissionResults[submissionId]);
};

const getSubmissionOutput = (submissionId) => {
  return submissionResults[submissionId];
}

module.exports = {
  initializeSubmissionOutput,
  updateSubmissionOutput,
  getSubmissionOutput
}
