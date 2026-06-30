import asyncio
import os
import json
from app.services.gemini import cross_validate
from app.models.analysis import IssueAnalysis, IssueCategory, IssueSeverity

async def test_cross_validate():
    if not os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") == "changeme":
        print("Set GEMINI_API_KEY to test cross-validate.")
        return

    dummy_analysis = IssueAnalysis(
        category=IssueCategory.POTHOLE,
        confidence=0.9,
        severity=IssueSeverity.HIGH,
        detectedIssues=["Deep pothole on the road"],
        suggestedTitle="Large Pothole",
        suggestedDepartment="Public Works",
        tags=["road", "pothole"]
    )
    
    print("Sending cross validate request...")
    result = await cross_validate([dummy_analysis], "There is a huge pothole causing traffic issues.")
    print(json.dumps(result.model_dump(), indent=2))

if __name__ == "__main__":
    asyncio.run(test_cross_validate())
