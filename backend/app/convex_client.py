import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx
from convex import ConvexClient
from .config import get_settings

logger = logging.getLogger(__name__)

class ConvexClientWrapper:
    """Client for Convex database operations"""
    
    def __init__(self):
        self.settings = get_settings()
        self._client = None
    
    def _get_client(self) -> ConvexClient:
        """Get or create Convex client instance"""
        if self._client is None:
            self._client = ConvexClient(self.settings.convex_url)
        return self._client
    
    async def get_recent_reviews(self, business_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get recent reviews from Convex for a specific business
        
        Args:
            business_id: The business identifier
            days: Number of days to look back (default 7)
            
        Returns:
            List of review dictionaries
        """
        try:
            client = self._get_client()
            
            # Calculate the date threshold
            threshold_date = datetime.now() - timedelta(days=days)
            threshold_iso = threshold_date.isoformat()
            
            logger.info(f"Fetching reviews for business {business_id} since {threshold_iso}")
            
            # Query Convex for recent reviews
            # Note: This assumes you have a "getRecentReviews" query function in your Convex schema
            reviews = await client.query(
                "reviews:getRecentReviews",
                {
                    "businessId": business_id,
                    "sinceDate": threshold_iso
                }
            )
            
            logger.info(f"Retrieved {len(reviews)} reviews from Convex")
            return reviews
            
        except Exception as e:
            logger.error(f"Error fetching reviews from Convex: {e}")
            # Return empty list on error - caller can handle fallback
            return []
    
    async def store_review_analysis(self, review_id: str, analysis: Dict[str, Any]) -> bool:
        """
        Store review analysis results in Convex
        
        Args:
            review_id: The review identifier
            analysis: The analysis results from watsonx
            
        Returns:
            True if successful
        """
        try:
            client = self._get_client()
            
            # Prepare the analysis data
            analysis_data = {
                "reviewId": review_id,
                "analysis": analysis,
                "analyzedAt": datetime.now().isoformat()
            }
            
            logger.info(f"Storing analysis for review: {review_id}")
            
            # Store in Convex
            # Note: This assumes you have a "storeAnalysis" mutation function in your Convex schema
            result = await client.mutation(
                "reviews:storeAnalysis",
                analysis_data
            )
            
            logger.info(f"Stored analysis for review: {review_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing analysis in Convex: {e}")
            return False
    
    async def store_weekly_insights(self, business_id: str, insights: Dict[str, Any]) -> bool:
        """
        Store weekly insights in Convex
        
        Args:
            business_id: The business identifier
            insights: The insights from watsonx
            
        Returns:
            True if successful
        """
        try:
            client = self._get_client()
            
            # Prepare the insights data
            insights_data = {
                "businessId": business_id,
                "insights": insights,
                "generatedAt": datetime.now().isoformat(),
                "weekOf": (datetime.now() - timedelta(days=7)).isoformat()
            }
            
            logger.info(f"Storing weekly insights for business: {business_id}")
            
            # Store in Convex
            # Note: This assumes you have a "storeWeeklyInsights" mutation function in your Convex schema
            result = await client.mutation(
                "insights:storeWeeklyInsights",
                insights_data
            )
            
            logger.info(f"Stored weekly insights for business: {business_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing insights in Convex: {e}")
            return False
    
    async def get_business_config(self, business_id: str) -> Optional[Dict[str, Any]]:
        """
        Get business configuration from Convex
        
        Args:
            business_id: The business identifier
            
        Returns:
            Business configuration dictionary or None
        """
        try:
            client = self._get_client()
            
            logger.info(f"Fetching config for business: {business_id}")
            
            # Query Convex for business config
            # Note: This assumes you have a "getBusinessConfig" query function in your Convex schema
            config = await client.query(
                "business:getConfig",
                {"businessId": business_id}
            )
            
            return config
            
        except Exception as e:
            logger.error(f"Error fetching business config from Convex: {e}")
            return None


class ConvexHTTPClient:
    """Alternative HTTP-based Convex client for simpler integration"""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.convex_url
        self.admin_key = self.settings.convex_admin_key
    
    async def get_recent_reviews_http(self, business_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get recent reviews via HTTP API
        
        Args:
            business_id: The business identifier
            days: Number of days to look back
            
        Returns:
            List of review dictionaries
        """
        try:
            # Calculate the date threshold
            threshold_date = datetime.now() - timedelta(days=days)
            threshold_iso = threshold_date.isoformat()
            
            async with httpx.AsyncClient() as client:
                # Construct the query URL
                # Note: Adjust this based on your actual Convex HTTP API setup
                url = f"{self.base_url}/api/query"
                
                payload = {
                    "query": "reviews:getRecentReviews",
                    "args": {
                        "businessId": business_id,
                        "sinceDate": threshold_iso
                    }
                }
                
                headers = {
                    "Authorization": f"Bearer {self.admin_key}",
                    "Content-Type": "application/json"
                }
                
                logger.info(f"Making HTTP request to Convex for business {business_id}")
                
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                reviews = data.get("result", [])
                
                logger.info(f"Retrieved {len(reviews)} reviews via HTTP")
                return reviews
                
        except Exception as e:
            logger.error(f"Error fetching reviews via HTTP: {e}")
            return []


# Global client instances
_convex_client: Optional[ConvexClientWrapper] = None
_convex_http_client: Optional[ConvexHTTPClient] = None


def get_convex_client() -> ConvexClientWrapper:
    """Get Convex client singleton"""
    global _convex_client
    if _convex_client is None:
        _convex_client = ConvexClientWrapper()
    return _convex_client


def get_convex_http_client() -> ConvexHTTPClient:
    """Get Convex HTTP client singleton"""
    global _convex_http_client
    if _convex_http_client is None:
        _convex_http_client = ConvexHTTPClient()
    return _convex_http_client