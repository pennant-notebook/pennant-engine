from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

from IPython.core.interactiveshell import InteractiveShell
from IPython.utils.capture import capture_output
from config.celery import make_celery
import uuid
import black
import redis
import json
import re
import time

app = Flask(__name__)
CORS(app)

r = redis.Redis(host="127.0.0.1", port=6379, db=0, password=os.environ.get("REDIS_PW"))
celery = make_celery(app)

notebook_shells = {}


def get_or_create_shell(notebook_id):
    shell_data = r.get(notebook_id)
    if shell_data is None:
        notebook_shells[notebook_id] = InteractiveShell()
        r.set(notebook_id, json.dumps({"created": True}))
    elif notebook_id not in notebook_shells:
        # recreate the shell if it's not in notebook_shells but is in redis
        notebook_shells[notebook_id] = InteractiveShell()
    return notebook_shells[notebook_id]


@app.route("/api/reset/<notebook_id>", methods=["POST"])
def reset_notebook(notebook_id):
    shell_data = r.get(notebook_id)

    # Check if notebook_id exists in Redis or notebook_shells
    if shell_data is None and notebook_id not in notebook_shells:
        return jsonify({"message": "Notebook already reset or does not exist"}), 200

    # delete from redis
    if shell_data is not None:
        r.delete(notebook_id)

    # delete from notebook_shells
    if notebook_id in notebook_shells:
        del notebook_shells[notebook_id]

    return jsonify({"message": "Notebook reset"})


def clean_traceback(traceback_str):
    cleaned_traceback = re.sub(r"\x1b\[.*?m", "", traceback_str)
    lines = cleaned_traceback.split("\n")
    essential_lines = [line for line in lines if "Traceback" not in line]
    return "\n".join(essential_lines)


@celery.task
def execute_python(submission_id, cells, notebook_id):
    shell = get_or_create_shell(notebook_id)

    aggregated_output = []

    for cell in cells:
        cell_id = cell.get("cellId")
        code = cell.get("code")
        if code is None:
            aggregated_output.append(
                {"cellId": cell_id, "status": "error", "output": "Code is None"}
            )
            continue

        try:
            with capture_output() as captured:
                shell.run_cell(code)

            stdout = captured.stdout
            stderr = captured.stderr

            aggregated_output.append(
                {"cellId": cell_id, "status": "completed", "output": stdout}
            )

        except Exception as e:
            aggregated_output.append(
                {"cellId": cell_id, "status": "error", "output": str(e)}
            )

    r.setex(submission_id, 300, json.dumps(aggregated_output))


@app.route("/api/submit", methods=["POST"])
def submit_code():
    try:
        data = request.json
        notebook_id = data.get("notebookId")
        cells = data.get("cells")
        print("SHELLS SUBMIT: ", notebook_shells)

        if not cells or not isinstance(cells, list) or len(cells) == 0:
            return jsonify({"error": "No cells provided"}), 400

        submission_id = str(uuid.uuid4())
        initial_status = [{"status": "pending", "output": None} for _ in cells]
        r.set(submission_id, json.dumps(initial_status))

        execute_python.apply_async(args=[submission_id, cells, notebook_id])

        return jsonify({"submissionId": submission_id}), 202

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/notebookstatus/<notebook_id>", methods=["GET"])
def notebook_status(notebook_id):
    if notebook_id in notebook_shells:
        return jsonify({"notebookId": notebook_id, "active": True})
    else:
        return jsonify({"error": "Notebook does not exist"}), 404


@app.route("/api/status/<submission_id>", methods=["GET"])
def check_status(submission_id):
    retries = 3
    delay = 2

    for _ in range(retries):
        submission_data = r.get(submission_id)
        if submission_data is None:
            return jsonify({"error": "Submission ID does not exist"}), 404

        submissions = json.loads(submission_data.decode("utf-8"))
        if not isinstance(submissions, list):
            return jsonify({"error": "Invalid submission data"}), 500

        all_completed = all(cell["status"] != "pending" for cell in submissions)

        if all_completed:
            break

        time.sleep(delay)

    results = []
    for cell in submissions:
        cell_result = {}
        cell_result["cellId"] = cell["cellId"]
        cell_result["type"] = "error" if cell["status"] == "error" else "output"
        cell_result["output"] = cell["output"]
        results.append(cell_result)

    return jsonify({"results": results})


@app.route("/format-python", methods=["POST"])
def format_python():
    code = request.json.get("code")
    try:
        formatted_code = black.format_str(code, mode=black.FileMode())
        return jsonify({"formatted_code": formatted_code})
    except black.NothingChanged:
        return jsonify({"formatted_code": code})
    except black.InvalidInput:
        return jsonify({"error": "Invalid Python code"})
    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    app.run(port=7070, debug=True)
