# Getting Started
To start the app, 
git clone this repository
cd into this repository
run the command `docker network create dredd-network --driver bridge` if network does not exist
run the command `docker compose up --build` from the base of this repository
run the server on host with `npm run start`

# Dredd API
The 1.0.0 branch implements the code execution service as an EDA. Endpoints have not changed.

Latest stable version is branch **v0.1.0**

**Last updated**: 6/28/23

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



# Examples

## POST /api/submit
**Returns**: 200 OK and `submissionId` (token)

Initiates submission. Starts code execution process. You can send one or many cells as an array value. Cells will be executed in order.

Sending one:
```json
{
	"notebookId": "111", // from FE
	"cells": [
    	{
        	"cellId": "2", // From frontend
        	"code": "console.log('hi judah!')"
    	}
	],
	"timeout": 5
}
```

Sending many:
```json
{
	"notebookId": "111",
	"cells": [  
    	{
        	"cellId": "3",
        	"code": "const name = 'Bob'"
    	},
    	{
        	"cellId": "4",
        	"code": "const age = 30"
    	},
    	{
        	"cellId": "5",
        	"code": "console.log(name, ' is ', age, ' years old')"
    	}
	],
	"timeout": 5
}
```


## GET /api/status/:sessionId
**Returns**: 200 OK and payload of results. `status` field may be "pending", "success" or "error". Note that error refers to an exception being raised by a cell execution; not a server-side issue. Such errors will be flagged using HTTP status codes.

```json
{
   "submissionId": "0c5796d7-c8fb-4b4c-a13d-9ebedc914551",
   "status": "success",
   "requestOrder": [
       [
           "3",
           "4",
           "5"
       ]
   ],
   "cellsExecuted": [
       "3",
       "4",
       "5"
   ],
   "results": [
       {
           "cellId": "3",
           "type": "output",
           "output": ""
       },
       {
           "cellId": "4",
           "type": "output",
           "output": ""
       },
       {
           "cellId": "5",
           "type": "output",
           "output": "Bob  is  30  years old\n"
       }
   ]
}
```
