import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

async def download_media(url: str) -> Optional[bytes]:
    """
    Downloads media from a given URL asynchronously using httpx.
    Returns the raw bytes if successful, None otherwise.
    """
    if not url:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            logger.info(f"Downloading media from: {url}")
            response = await client.get(url)
            response.raise_for_status()
            return response.content
    except Exception as e:
        logger.error(f"Failed to download media from {url}: {str(e)}")
        return None
