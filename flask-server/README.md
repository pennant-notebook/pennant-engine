# Pennant Flask Server

## Overview

This repository serves as the remote Python code execution backend for the Pennant notebook application. It uses Flask, Celery, RabbitMQ and Redis to handle code execution requests and manage notebook states.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/marwan37/pennant-flask-server.git
```

2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Configuration

- Celery Configuration: Modify the settings in the [config/celery.py](https://github.com/marwan37/pennant-flask-server/blob/main/config/celery.py) file.
- Celery Worker Service: A systemd service file is provided in [config/celery-worker.service](https://github.com/marwan37/pennant-flask-server/blob/main/config/celery-worker.service).

## Usage

Run the Flask application:

```bash
python app.py
```

## Running Celery Worker

### From Terminal, or Linux (e.g., DigitalOcean Droplet)

1. Navigate to the project directory.
2. Run the following command to start the Celery worker:

```bash
celery -A app.celery worker
```


## Endpoints

### Submit Code
Submits code for execution.

URL: `/api/submit`

Method: `POST`

Parameter | Type | Required | Description
--- | --- | --- | ---
`notebookId` | `string` | Yes | The ID of the notebook.
`cells` | `array` | Yes | An array of cells to be executed.

Response:

Property | Type | Description
--- | --- | ---
`submissionId` | `string` | Token to track the status of the submission.

### Get Submission Status
Retrieves the status of a submitted notebook.

URL: `/api/status/:submissionId`

Method: `GET`

Parameter | Type | Required | Description
--- | --- | --- | ---
`submissionId` | `string` | Yes | Token received by the submission endpoint.

### Reset Notebook
Resets the context for a notebook.

URL: `/api/reset/:notebookId`

Method: `POST`

Parameter | Type | Required | Description
--- | --- | --- | ---
`notebookId` | `string` | Yes | The ID of the notebook to reset.

### Notebook Status
Checks if a notebook is active.

URL: `/notebookstatus/:notebookId`

Method: `GET`

### Format Python Code
Formats Python code.

URL: `/format-python`

Method: `POST`

## API Status Codes

Status code | Description
--- | ---
200 | OK
202 | Accepted
400 | Bad request
404 | Not found
500 | Internal server error

## Examples

### POST /api/submit
**Returns**: 202 Accepted and `submissionId` (token)

Initiates submission. Starts code execution process.

```json
{
	"notebookId": "111",
	"cells": [
      {
        	"cellId": "3",
        	"code": "print('Hello, world!')"
      }
  ]  
}
```

### GET /api/status/:submissionId
**Returns**: 200 OK and payload of results.

```json
{
   "submissionId": "0c5796d7-c8fb-4b4c-a13d-9ebedc914551",
   "status": "success",
   "results": [
         {
           "cellId": "3",
           "type": "output",
           "output": "Hello, world!"
       }
   ]
}
```
