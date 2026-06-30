from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class CheckDuplicateRequest(BaseModel):
    latitude: float = Field(..., description="Latitude of the reported issue")
    longitude: float = Field(..., description="Longitude of the reported issue")
    category: str = Field(..., description="Category of the issue")
    description: str = Field(..., description="User description of the issue")
    radiusMeters: int = Field(500, description="Radius in meters to search for duplicates")


class SimilarIssue(BaseModel):
    issueId: str = Field(..., description="ID of the nearby issue")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity score (0.0 to 1.0)")
    distance: float = Field(..., description="Distance in meters from the new report")


class CheckDuplicateResponse(BaseModel):
    isDuplicate: bool = Field(..., description="Whether this report is considered a duplicate")
    similarIssues: List[SimilarIssue] = Field(default_factory=list, description="List of similar nearby issues")
    recommendedAction: Literal["MERGE", "NEW", "RELATE"] = Field(..., description="Recommended action for the new report")
