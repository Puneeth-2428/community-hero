from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class IssueCategory(str, Enum):
    POTHOLE = "POTHOLE"
    WATERLEAKAGE = "WATERLEAKAGE"
    STREETLIGHT = "STREETLIGHT"
    WASTE = "WASTE"
    GRAFFITI = "GRAFFITI"
    FLOODING = "FLOODING"
    TREEHAZARD = "TREEHAZARD"
    OTHER = "OTHER"


class IssueSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AnalyzeIssueRequest(BaseModel):
    imageUrls: List[str] = Field(default_factory=list, description="List of S3 or public URLs for images")
    videoUrl: Optional[str] = Field(None, description="Optional S3 or public URL for a video")
    userDescription: str = Field(..., description="The description provided by the user reporting the issue")


class IssueAnalysis(BaseModel):
    category: IssueCategory = Field(..., description="The predicted category of the issue")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the analysis (0.0 to 1.0)")
    severity: IssueSeverity = Field(..., description="The estimated severity of the issue")
    detectedIssues: List[str] = Field(..., description="Specific issues detected in the media/text")
    suggestedTitle: str = Field(..., description="A concise, suggested title for the report")
    suggestedDepartment: str = Field(..., description="The recommended government department to handle this")
    tags: List[str] = Field(default_factory=list, description="Relevant keywords or tags for searchability")


class AnalyzeIssueResponse(BaseModel):
    success: bool = True
    analysis: IssueAnalysis
