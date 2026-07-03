from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "portsense_worker",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    include=["app.workers.polling"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "poll-interfaces-every-10-seconds": {
            "task": "app.workers.polling.poll_all_interfaces",
            "schedule": 10.0,
        }
    }
)
