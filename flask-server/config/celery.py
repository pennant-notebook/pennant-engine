import os
from celery import Celery

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND")


def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=CELERY_RESULT_BACKEND,
        broker=CELERY_BROKER_URL,
    )
    celery.conf.update(app.config)
    celery.conf.update({"broker_connection_retry_on_startup": True})
    return celery
