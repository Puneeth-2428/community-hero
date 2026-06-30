from fastapi import APIRouter

from app.api.endpoints import analysis, insights

api_router = APIRouter()

@api_router.get("/ping", tags=["System"])
async def ping():
    """Simple ping endpoint."""
    return {"message": "pong"}

api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(insights.router, prefix="/insights", tags=["Insights"])
