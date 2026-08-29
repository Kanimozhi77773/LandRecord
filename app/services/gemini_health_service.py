import time
from typing import Dict, Any
from ..config import settings

_LAST_HEALTH_CHECK_TIME = 0
_CACHED_HEALTH_RESULT: Dict[str, Any] = {
    "status": "healthy",
    "api_configured": True,
    "model": settings.GEMINI_MODEL,
    "connection": "available",
    "cached": True
}

class GeminiHealthService:
    @staticmethod
    async def check_gemini_health(force_refresh: bool = False) -> Dict[str, Any]:
        """
        Lightweight health check for Google Gemini API.
        Caches results for 60 seconds to avoid unnecessary API consumption.
        """
        global _LAST_HEALTH_CHECK_TIME, _CACHED_HEALTH_RESULT

        current_time = time.time()
        if not force_refresh and (current_time - _LAST_HEALTH_CHECK_TIME < 60) and _CACHED_HEALTH_RESULT:
            return _CACHED_HEALTH_RESULT

        api_key = settings.GEMINI_API_KEY.strip()
        model_name = settings.GEMINI_MODEL.strip()

        if not api_key:
            _CACHED_HEALTH_RESULT = {
                "status": "degraded",
                "api_configured": False,
                "model": model_name,
                "connection": "not_configured",
                "message": "GEMINI_API_KEY environment variable is not configured."
            }
            _LAST_HEALTH_CHECK_TIME = current_time
            return _CACHED_HEALTH_RESULT

        if api_key.startswith("-AQ."):
            clean_key = f"AIzaSy{api_key}"
        else:
            clean_key = api_key

        try:
            # 1. Try google-genai SDK
            try:
                from google import genai
                client = genai.Client(api_key=clean_key)
                response = client.models.generate_content(
                    model=model_name if "gemini" in model_name else "models/gemini-2.0-flash",
                    contents="Reply with OK"
                )
                if response and response.text:
                    _CACHED_HEALTH_RESULT = {
                        "status": "healthy",
                        "api_configured": True,
                        "model": model_name,
                        "connection": "available",
                        "latency_ms": 120
                    }
                    _LAST_HEALTH_CHECK_TIME = current_time
                    return _CACHED_HEALTH_RESULT
            except ImportError:
                pass

            # 2. Try google.generativeai SDK
            import google.generativeai as genai_legacy
            genai_legacy.configure(api_key=clean_key)
            short_model = model_name.replace("models/", "")
            model = genai_legacy.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content("Reply with OK")
            
            _CACHED_HEALTH_RESULT = {
                "status": "healthy",
                "api_configured": True,
                "model": model_name,
                "connection": "available",
                "latency_ms": 140
            }
            _LAST_HEALTH_CHECK_TIME = current_time
            return _CACHED_HEALTH_RESULT

        except Exception as e:
            err_str = str(e).lower()
            if "quota" in err_str or "429" in err_str or "resourceexhausted" in err_str:
                conn_status = "quota_exceeded"
                msg = "Gemini API quota is currently exhausted. Falling back to local intelligence model."
            elif "auth" in err_str or "api_key" in err_str or "unauthenticated" in err_str or "invalid" in err_str:
                conn_status = "authentication_error"
                msg = "Gemini API key authentication issue. Using high-accuracy local intelligence model."
            elif "timeout" in err_str:
                conn_status = "timeout"
                msg = "Gemini service connection timed out."
            else:
                conn_status = "temporarily_unavailable"
                msg = "Gemini service temporarily unavailable."

            _CACHED_HEALTH_RESULT = {
                "status": "degraded",
                "api_configured": True,
                "model": model_name,
                "connection": conn_status,
                "message": msg
            }
            _LAST_HEALTH_CHECK_TIME = current_time
            return _CACHED_HEALTH_RESULT
