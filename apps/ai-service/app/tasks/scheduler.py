import logging
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.config import settings
from app.services.gemini import generate_predictive_insights
from app.services.cache import set_cache

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def generate_insights_for_all_wards():
    """
    Scheduled task to fetch historical data for all wards and generate insights using Gemini.
    Runs every Sunday at midnight.
    """
    logger.info("Starting weekly predictive insights generation task...")
    
    # Normally we'd fetch a list of all distinct wards from the DB via the Main API.
    # For now, we'll hardcode a few common wards or mock it.
    wards = ["Downtown", "Northside", "WestEnd"]
    
    async with httpx.AsyncClient() as client:
        for ward in wards:
            try:
                logger.info(f"Generating insights for ward: {ward}")
                res = await client.get(f"{settings.MAIN_API_URL}/issues/historical/{ward}")
                if res.status_code != 200:
                    logger.warning(f"Failed to fetch data for ward {ward}: {res.text}")
                    continue
                
                historical_issues = res.json().get("data", [])
                if not historical_issues:
                    logger.info(f"No historical data for ward {ward}. Skipping.")
                    continue

                insights_dict = await generate_predictive_insights(ward, historical_issues)
                
                # Cache for 7 days
                cache_key = f"insights:{ward}"
                await set_cache(cache_key, insights_dict, 604800)
                logger.info(f"Successfully generated and cached insights for ward: {ward}")
                
            except Exception as e:
                logger.error(f"Error in scheduled task for ward {ward}: {e}")

def start_scheduler():
    """Configures and starts the APScheduler."""
    # Run every Sunday at midnight
    scheduler.add_job(
        generate_insights_for_all_wards,
        trigger=CronTrigger(day_of_week='sun', hour=0, minute=0),
        id="weekly_insights_generation",
        replace_existing=True
    )
    scheduler.start()
    logger.info("APScheduler started successfully.")

def shutdown_scheduler():
    """Shuts down the scheduler."""
    scheduler.shutdown()
    logger.info("APScheduler shut down.")
