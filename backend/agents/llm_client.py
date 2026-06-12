import os
import asyncio
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

async def call_gemini(system_prompt: str, user_message: str, max_tokens: int = 1000, response_mime_type: str = None) -> str:
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    retries = [1, 2, 4]
    
    for attempt, wait_time in enumerate(retries, 1):
        try:
            # We are using generate_content async fallback pattern if needed,
            # but standard SDK is synchronous. However, this is an async def, 
            # so we'll wrap the sync call in to_thread if needed, but for simplicity we'll just await if it supports it,
            # actually the SDK `generate_content` is sync. Let's just call it directly.
            response = client.models.generate_content(
                model='gemini-flash-lite-latest',
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1,
                    response_mime_type=response_mime_type
                )
            )
            
            usage = response.usage_metadata
            if usage:
                logger.debug(f"Gemini call succeeded. Tokens used: {usage.total_token_count}")
                
            return response.text
            
        except Exception as e:
            logger.warning(f"Gemini API attempt {attempt} failed with {type(e).__name__}: {e}")
            if attempt == len(retries):
                raise Exception(f"PipelineError: Gemini API failed after {len(retries)} attempts: {e}")
            await asyncio.sleep(wait_time)
            
    return ""
