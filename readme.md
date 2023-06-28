# Dredd API

## Base URL
The default base URL for all API endpoints is: `http://localhost:3002/api`

## Endpoints

### Submit Cells
Submits a notebook for execution.

URL: `/submit`

Method: `POST`

Parameter | Type | Required | Description
--- | --- | --- | ---
`notebookId` | `string` | Yes | The ID of the notebook
`cells` | `array` | Yes | An array of cells to be executed.

The `cells` array should contain objects with the following properties:

Parameter | Type | Required | Description
--- | --- | --- | ---
`cellId` | `string` | Yes | The ID of the cell to be executed.
`code` | `string` | Yes | The code content of the cell to be executed.

Response:

Property | Type | Description
--- | --- | ---
`message` | `string` | A status message indicating success.
`submissionId` | `string` | Token to track the status of the submission.

### Get Submission Status
Retrieves the status of a submitted notebook.

URL: `/status/:submissionId`

Method: `GET`

Parameters:

Parameter | Type | Required | Description
--- | --- | --- | ---
`submissionId` | `string` | Yes | Token received by the submission endpoint.

Response:
Returns the output of the notebook submission.

Property | Type | Description
--- | --- | ---
`submissionId` | `string` |
`status` | `string` | `pending`, `success`, or `error`
`requestOrder` | `array` | Order of the cells array from the original submission
`cellsExecuted` | `array` | Actual cells executed
`results` | `array` | Array of cell execution results

`results` is an array of objects with the following properties:

Property | Type | Description
--- | --- | ---
`cellId` | `string` |
`type` | `string` | `output` or `error`
`output` | `string` | Console output string or stack trace

### Reset Notebook Context
Resets the context for a notebook.

URL: `/reset/:notebookId`

Method: `POST`

Parameter:

Parameter | Type | Required | Description
--- | --- | --- | ---
`notebookId` | `string` | Yes | The ID of the notebook to reset the context.

Response:
Returns a message indicating that the context has been reset.

## API Status Codes

Status code | Description
--- | ---
200 | OK
400 | Bad request
404 | Not found
500 | Internal server error
