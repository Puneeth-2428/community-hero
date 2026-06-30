import asyncio
import logging
from fastapi import APIRouter, HTTPException

from app.models.analysis import AnalyzeIssueRequest, AnalyzeIssueResponse, IssueAnalysis
from app.services.downloader import download_media
from app.services.gemini import analyze_image, cross_validate

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze-issue", response_model=AnalyzeIssueResponse)
async def analyze_issue_endpoint(request: AnalyzeIssueRequest):
    """
    Endpoint to analyze civic issues from images and a user description.
    """
    logger.info(f"Received request to analyze issue with {len(request.imageUrls)} images.")

    try:
        # 1. Download media from URLs concurrently
        download_tasks = [download_media(url) for url in request.imageUrls]
        image_bytes_list = await asyncio.gather(*download_tasks)
        
        # Filter out failed downloads
        valid_images = [img for img in image_bytes_list if img is not None]

        if not valid_images and not request.userDescription:
            raise HTTPException(status_code=400, detail="No valid images downloaded and no description provided.")

        image_analyses: list[IssueAnalysis] = []

        # 2. Analyze each valid image using Gemini Vision concurrently
        if valid_images:
            analyze_tasks = [analyze_image(img) for img in valid_images]
            # Some might fail even after retries, so we use return_exceptions=True
            analysis_results = await asyncio.gather(*analyze_tasks, return_exceptions=True)
            
            for res in analysis_results:
                if isinstance(res, Exception):
                    logger.warning(f"Failed to analyze an image: {res}")
                elif res is not None:
                    image_analyses.append(res)

        # 3. Cross-validate with the user description to get the final merged result
        final_analysis = await cross_validate(
            image_analyses=image_analyses,
            user_description=request.userDescription
        )

        # 4. Return the response
        return AnalyzeIssueResponse(
            success=True,
            analysis=final_analysis
        )

    except Exception as e:
        logger.error(f"Error processing analyze-issue request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error during analysis: {str(e)}")


@router.post("/check-duplicate", response_model=None)
async def check_duplicate_endpoint(request: __import__('app.models.duplicate').models.duplicate.CheckDuplicateRequest):
    """
    Endpoint to check if a newly reported issue is a duplicate of an existing one.
    Fetches nearby OPEN issues from the Fastify backend and uses Gemini to compare semantics.
    """
    logger.info(f"Checking duplicates for category: {request.category} at lat/lng: {request.latitude},{request.longitude}")

    try:
        from app.config import settings
        import httpx
        from app.models.duplicate import CheckDuplicateResponse

        # 1. Fetch nearby issues from the main API
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{settings.MAIN_API_URL}/issues/nearby",
                params={
                    "lat": request.latitude,
                    "lng": request.longitude,
                    "radius": request.radiusMeters
                }
            )
            res.raise_for_status()
            data = res.json()
            nearby_issues = data.get("data", [])

        # If no nearby issues, it's definitely NEW
        if not nearby_issues:
            return CheckDuplicateResponse(
                isDuplicate=False,
                similarIssues=[],
                recommendedAction="NEW"
            )

        # 2. Use Gemini to compute semantic similarity
        from app.services.gemini import check_duplicate_similarity
        result_dict = await check_duplicate_similarity(
            new_description=request.description,
            nearby_issues=nearby_issues
        )

        return CheckDuplicateResponse(**result_dict)

    except Exception as e:
        logger.error(f"Error checking duplicates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check duplicates: {str(e)}")

