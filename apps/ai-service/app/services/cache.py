import json
import logging
from typing import Any, Optional
import redis.asyncio as redis
from app.config import settings

logger = logging.getLogger(__name__)

# Global redis client
redis_client: Optional[redis.Redis] = None

async def init_redis():
    global redis_client
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.ping()
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Closed Redis connection.")

async def set_cache(key: str, value: Any, ttl_seconds: int = 604800):
    """Stores a value in Redis as JSON with a default 7-day TTL."""
    if not redis_client:
        return
    try:
        json_val = json.dumps(value)
        await redis_client.setex(key, ttl_seconds, json_val)
    except Exception as e:
        logger.error(f"Redis set_cache error for key {key}: {e}")

async def get_cache(key: str) -> Optional[Any]:
    """Retrieves a JSON value from Redis."""
    if not redis_client:
        return None
    try:
        val = await redis_client.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        logger.error(f"Redis get_cache error for key {key}: {e}")
    return None
