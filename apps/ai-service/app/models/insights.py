from typing import List, Optional
from pydantic import BaseModel, Field


class PredictiveInsightsRequest(BaseModel):
    ward: str = Field(..., description="The ward or neighborhood to analyze")
    # For a real implementation, we would pass the historical data as well
    # but the API can fetch it directly to avoid massive payloads.


class InsightHotspot(BaseModel):
    lat: float
    lng: float
    riskScore: float = Field(..., ge=0.0, le=100.0)
    predictedCategory: str


class SeasonalTrend(BaseModel):
    month: str
    likelyIssues: List[str]


class ResolutionBottleneck(BaseModel):
    department: str
    avgDaysToResolve: float
    backlogCount: int


class PredictiveInsightsResponse(BaseModel):
    hotspots: List[InsightHotspot]
    seasonalTrends: List[SeasonalTrend]
    resolutionBottlenecks: List[ResolutionBottleneck]
    recommendedPreventiveActions: List[str]
    citizenEngagementScore: float = Field(..., ge=0.0, le=100.0)
