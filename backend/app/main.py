from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.v1 import auth, suppliers, audits, reports, alerts

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(suppliers.router, prefix="/api/v1/suppliers", tags=["Suppliers"])
app.include_router(audits.router, prefix="/api/v1/audits", tags=["Audits"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Compliance Alerts"])


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
