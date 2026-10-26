import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Dict, List
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import (
    admin,
    agents,
    analytics,
    assistant,
    auth,
    clinician,
    devices,
    diseases,
    genetics,
    health,
    ingestion,
    metrics,
    ml,
    notifications,
    privacy,
    records,
    reports,
    research,
    search,
    users,
    voice,
)
from app.core.config import settings
from app.core.exceptions import (
    AISafetyException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from app.db.seed import seed_database
from app.db.session import Base, SessionLocal, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory sliding window rate limiter
_request_history: Dict[str, List[float]] = defaultdict(list)

def _is_rate_limited(client_ip: str, path: str) -> bool:
    now = time.time()
    window = 60.0  # 1 minute

    # Determine rate limit bucket
    if "/auth/login" in path:
        limit = settings.RATE_LIMIT_LOGIN_PER_MINUTE
    elif "/assistant" in path or "/voice" in path:
        limit = settings.RATE_LIMIT_AI_PER_MINUTE
    elif "/reports/upload" in path:
        limit = settings.RATE_LIMIT_UPLOAD_PER_MINUTE
    else:
        limit = settings.RATE_LIMIT_GENERAL_PER_MINUTE

    key = f"{client_ip}:{path}"
    # Evict timestamps older than sliding window
    _request_history[key] = [t for t in _request_history[key] if now - t < window]

    if len(_request_history[key]) >= limit:
        return True

    _request_history[key].append(now)
    return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default knowledge base
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        logger.info("Checking database seeds...")
        seed_database(db)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
    yield
    # Shutdown logic if needed
    logger.info("MediPredict AI backend service shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "MediPredict AI is an enterprise medical science, AI intelligence, and clinical decision support platform. "
        "Provides grounded medical RAG, laboratory report intelligence, risk estimation, and patient data management."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware: Enterprise Healthcare Security Headers & Rate Limiting
@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "127.0.0.1"
    path = request.url.path

    # Apply rate limiting to sensitive routes (bypass for testclient in test runners and docs/health)
    is_test = settings.ENVIRONMENT == "testing" or client_ip in ("testclient", "testserver")
    if not is_test and not (path.startswith("/docs") or path.startswith("/redoc") or path == "/openapi.json" or path.endswith("/health")):
        if _is_rate_limited(client_ip, path):
            logger.warning(f"Rate limit exceeded for client {client_ip} on path {path}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please wait before retrying."},
                headers={"Retry-After": "60"},
            )

    response = await call_next(request)

    # Enforce strict healthcare-grade security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(self)"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"

    return response

# Centralized Error Handlers
@app.exception_handler(NotFoundException)
async def not_found_handler(request: Request, exc: NotFoundException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(UnauthorizedException)
async def unauthorized_handler(request: Request, exc: UnauthorizedException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

@app.exception_handler(ForbiddenException)
async def forbidden_handler(request: Request, exc: ForbiddenException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(ValidationException)
async def validation_handler(request: Request, exc: ValidationException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(AISafetyException)
async def ai_safety_handler(request: Request, exc: AISafetyException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "emergency": True})

# Register v1 routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(assistant.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(metrics.router, prefix=settings.API_V1_STR)
app.include_router(diseases.router, prefix=settings.API_V1_STR)
app.include_router(genetics.router, prefix=settings.API_V1_STR)
app.include_router(research.router, prefix=settings.API_V1_STR)
app.include_router(records.router, prefix=settings.API_V1_STR)
app.include_router(privacy.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(clinician.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(devices.router, prefix=settings.API_V1_STR)
app.include_router(ingestion.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(voice.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "api_docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
