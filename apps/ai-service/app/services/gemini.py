import json
import logging
from typing import List, Optional
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.analysis import IssueAnalysis

logger = logging.getLogger(__name__)

# Configure the Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Generation config for JSON output
_generation_config = genai.GenerationConfig(
    response_mime_type="application/json",
    response_schema=IssueAnalysis
)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def analyze_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[IssueAnalysis]:
    """
    Sends an image to Gemini Vision to extract a structured IssueAnalysis.
    Retries up to 3 times on failure.
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = (
            "Analyze this image of a civic issue. "
            "Identify the category, severity, specific detected issues, suggest a title, "
            "suggest the responsible department, and provide relevant tags."
        )

        content = [
            {"mime_type": mime_type, "data": image_bytes},
            prompt
        ]

        response = await model.generate_content_async(
            contents=content,
            generation_config=_generation_config
        )
        
        raw_json = response.text
        return IssueAnalysis.model_validate_json(raw_json)

    except Exception as e:
        logger.error(f"Error analyzing image with Gemini: {str(e)}")
        raise  # Trigger tenacity retry


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def cross_validate(image_analyses: List[IssueAnalysis], user_description: str) -> IssueAnalysis:
    """
    Cross-validates the vision-based analyses with the user's description.
    Returns the merged, highest-confidence analysis.
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Prepare the context
        analyses_json = [a.model_dump_json() for a in image_analyses]
        
        prompt = f"""
        You are an AI assistant for a civic issue reporting platform. 
        We have analyzed some images of the issue and obtained the following initial analyses:
        {analyses_json}
        
        The user who reported the issue provided this description:
        "{user_description}"
        
        Task: Cross-validate the image analyses with the user's description.
        If there are discrepancies, use the user's description and the visual evidence to determine the truth.
        Merge the findings into a single, comprehensive, high-confidence analysis.
        Return the structured JSON conforming exactly to the requested schema.
        """

        response = await model.generate_content_async(
            contents=[prompt],
            generation_config=_generation_config
        )
        
        raw_json = response.text
        return IssueAnalysis.model_validate_json(raw_json)

    except Exception as e:
        logger.error(f"Error during cross-validation with Gemini: {str(e)}")
        raise  # Trigger tenacity retry


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def check_duplicate_similarity(new_description: str, nearby_issues: List[dict]) -> dict:
    """
    Compares a new issue description against a list of nearby issues to detect duplicates.
    Returns a dictionary matching CheckDuplicateResponse.
    """
    try:
        from app.models.duplicate import CheckDuplicateResponse
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        config = genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=CheckDuplicateResponse
        )

        prompt = f"""
        You are a civic issue duplicate detection system.
        A user has reported a new issue with the following description:
        "{new_description}"

        Here are the currently OPEN issues nearby:
        {json.dumps(nearby_issues, indent=2)}

        Determine if the new issue is a duplicate of any existing nearby issues.
        Calculate a semantic similarity score (0.0 to 1.0) for each nearby issue.
        Return a structured JSON with 'isDuplicate', a list of 'similarIssues' with their scores,
        and a 'recommendedAction' (MERGE, NEW, RELATE).
        """

        response = await model.generate_content_async(
            contents=[prompt],
            generation_config=config
        )
        
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Error checking duplicates with Gemini: {str(e)}")
        raise


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_predictive_insights(ward: str, historical_issues: List[dict]) -> dict:
    """
    Analyzes historical issues to generate predictive insights for a given ward.
    Returns a dictionary matching PredictiveInsightsResponse.
    """
    try:
        from app.models.insights import PredictiveInsightsResponse
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        config = genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=PredictiveInsightsResponse
        )

        prompt = f"""
        You are a data scientist analyzing civic issue data for the ward: {ward}.
        Here is a sample of the historical issues data (up to 1000 records):
        {json.dumps(historical_issues[:1000], indent=2)}

        Analyze this data and return structured predictive insights including:
        - hotspots (lat, lng, riskScore, predictedCategory)
        - seasonalTrends (by month, likelyIssues)
        - resolutionBottlenecks (department, avgDaysToResolve, backlogCount)
        - recommendedPreventiveActions (list of strategies)
        - citizenEngagementScore (0-100)
        """

        response = await model.generate_content_async(
            contents=[prompt],
            generation_config=config
        )
        
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Error generating predictive insights with Gemini: {str(e)}")
        raise

