from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api import auth, devices, interfaces, ws, stats, alerts
from contextlib import asynccontextmanager
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(devices.router, prefix=f"{settings.API_V1_STR}/devices", tags=["devices"])
app.include_router(interfaces.router, prefix=f"{settings.API_V1_STR}/interfaces", tags=["interfaces"])
app.include_router(stats.router, prefix=f"{settings.API_V1_STR}/stats", tags=["stats"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])
app.include_router(ws.router, prefix="/ws", tags=["websockets"])

@app.get("/")
async def root():
    return {"message": "Welcome to PortSense API"}
