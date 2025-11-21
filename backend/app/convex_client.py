import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx
from .config import get_settings

logger = logging.getLogger(__name__)


class ConvexHTTPClient:
    """HTTP-based Convex client for Python backend integration"""

    def __init__(self):
        self.settings = get_settings()
        # Remove /api suffix if present, we'll add it for specific endpoints
        self.base_url = self.settings.convex_url.rstrip('/')
        if self.base_url.endswith('/api'):
            self.base_url = self.base_url[:-4]
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def _make_request(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make HTTP request to Convex endpoint
        
        Args:
            endpoint: The endpoint path (e.g., 'store-review')
            data: Request payload
            
        Returns:
            Response data
        """
        url = f"{self.base_url}/{endpoint}"
        try:
            response = await self.http_client.post(url, json=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling {endpoint}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error calling {endpoint}: {e}")
            raise
    
    async def store_review(
        self,
        business_id: str,
        source: str,
        author: str,
        rating: int,
        text: str,
        date: int,
        triage: Dict[str, Any],
        images: Optional[List[str]] = None
    ) -> Optional[str]:
        """
        Store a review in Convex
        
        Args:
            business_id: The business identifier
            source: Review source (e.g., 'google', 'yelp')
            author: Review author name
            rating: Star rating (1-5)
            text: Review text
            date: Review date as timestamp (milliseconds)
            triage: Triage analysis results
            images: Optional list of image URLs
            
        Returns:
            Review ID if successful, None otherwise
        """
        try:
            data = {
                "businessId": business_id,
                "source": source,
                "author": author,
                "rating": rating,
                "text": text,
                "date": date,
                "triage": triage,
                "images": images or []
            }
            
            result = await self._make_request("store-review", data)
            if result.get("success"):
                logger.info(f"Successfully stored review in Convex: {result.get('reviewId')}")
                return result.get("reviewId")
            else:
                logger.error(f"Failed to store review: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error storing review in Convex: {e}")
            return None
    
    async def store_insights(
        self,
        business_id: str,
        top_complaint_themes: List[Dict[str, Any]],
        rating_risk_score: float,
        improvement_suggestion: str,
        total_reviews: int,
        average_rating: float
    ) -> Optional[str]:
        """
        Store weekly insights in Convex
        
        Args:
            business_id: The business identifier
            top_complaint_themes: List of themes with counts
            rating_risk_score: Risk score (0-100)
            improvement_suggestion: AI-generated suggestion
            total_reviews: Total number of reviews analyzed
            average_rating: Average rating
            
        Returns:
            Insight ID if successful, None otherwise
        """
        try:
            data = {
                "businessId": business_id,
                "topComplaintThemes": top_complaint_themes,
                "ratingRiskScore": rating_risk_score,
                "improvementSuggestion": improvement_suggestion,
                "totalReviews": total_reviews,
                "averageRating": average_rating
            }
            
            result = await self._make_request("store-insights", data)
            if result.get("success"):
                logger.info(f"Successfully stored insights in Convex: {result.get('insightId')}")
                return result.get("insightId")
            else:
                logger.error(f"Failed to store insights: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error storing insights in Convex: {e}")
            return None
    
    async def mark_review_replied(self, review_id: str, reply_text: str) -> bool:
        """
        Mark a review as replied in Convex
        
        Args:
            review_id: The review identifier
            reply_text: The reply text that was posted
            
        Returns:
            True if successful
        """
        try:
            data = {
                "reviewId": review_id,
                "replyText": reply_text
            }
            
            result = await self._make_request("mark-review-replied", data)
            success = result.get("success", False)
            
            if success:
                logger.info(f"Successfully marked review as replied: {review_id}")
            else:
                logger.error(f"Failed to mark review as replied: {result.get('error')}")
                
            return success
            
        except Exception as e:
            logger.error(f"Error marking review as replied: {e}")
            return False
    
    async def get_reviews(
        self,
        business_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get reviews for a business from Convex
        
        Args:
            business_id: The business identifier
            limit: Optional limit on number of reviews
            
        Returns:
            List of review dictionaries
        """
        try:
            data = {
                "businessId": business_id,
                "limit": limit
            }
            
            result = await self._make_request("get-reviews", data)
            if result.get("success"):
                reviews = result.get("reviews", [])
                logger.info(f"Retrieved {len(reviews)} reviews from Convex")
                return reviews
            else:
                logger.error(f"Failed to get reviews: {result.get('error')}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting reviews from Convex: {e}")
            return []
    
    async def get_reviews_by_queue(
        self,
        business_id: str,
        queue_type: str
    ) -> List[Dict[str, Any]]:
        """
        Get unreplied reviews by queue type
        
        Args:
            business_id: The business identifier
            queue_type: Either 'auto-reply' or 'escalation'
            
        Returns:
            List of review dictionaries
        """
        try:
            data = {
                "businessId": business_id,
                "queueType": queue_type
            }
            
            result = await self._make_request("get-reviews-by-queue", data)
            if result.get("success"):
                reviews = result.get("reviews", [])
                logger.info(f"Retrieved {len(reviews)} {queue_type} reviews from Convex")
                return reviews
            else:
                logger.error(f"Failed to get reviews by queue: {result.get('error')}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting reviews by queue from Convex: {e}")
            return []
    
    async def create_business(
        self,
        name: str,
        description: Optional[str] = None,
        industry: Optional[str] = None,
        google_place_id: Optional[str] = None,
        yelp_business_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Create a new business in Convex
        
        Args:
            name: Business name
            description: Optional description
            industry: Optional industry
            google_place_id: Optional Google Place ID
            yelp_business_id: Optional Yelp Business ID
            user_id: Optional user ID to associate as owner
            
        Returns:
            Business ID if successful, None otherwise
        """
        try:
            data = {
                "name": name,
                "description": description,
                "industry": industry,
                "googlePlaceId": google_place_id,
                "yelpBusinessId": yelp_business_id,
                "userId": user_id
            }
            
            result = await self._make_request("create-business", data)
            if result.get("success"):
                business_id = result.get("businessId")
                logger.info(f"Successfully created business in Convex: {business_id}")
                return business_id
            else:
                logger.error(f"Failed to create business: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating business in Convex: {e}")
            return None
    
    async def update_business(
        self,
        business_id: str,
        name: str,
        description: Optional[str] = None,
        industry: Optional[str] = None,
        address: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        website: Optional[str] = None,
        google_place_id: Optional[str] = None,
        yelp_business_id: Optional[str] = None,
        facebook_page_id: Optional[str] = None
    ) -> bool:
        """
        Update a business in Convex
        
        Args:
            business_id: The business identifier
            name: Business name
            description: Optional description
            industry: Optional industry
            address: Optional address
            phone: Optional phone number
            email: Optional email
            website: Optional website URL
            google_place_id: Optional Google Place ID
            yelp_business_id: Optional Yelp Business ID
            facebook_page_id: Optional Facebook Page ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            data = {
                "businessId": business_id,
                "name": name,
                "description": description,
                "industry": industry,
                "address": address,
                "phone": phone,
                "email": email,
                "website": website,
                "googlePlaceId": google_place_id,
                "yelpBusinessId": yelp_business_id,
                "facebookPageId": facebook_page_id
            }
            
            result = await self._make_request("update-business", data)
            success = result.get("success", False)
            
            if success:
                logger.info(f"Successfully updated business in Convex: {business_id}")
            else:
                logger.error(f"Failed to update business: {result.get('error')}")
                
            return success
            
        except Exception as e:
            logger.error(f"Error updating business in Convex: {e}")
            return False
    
    async def get_business(self, business_id: str) -> Optional[Dict[str, Any]]:
        """
        Get business details from Convex
        
        Args:
            business_id: The business identifier
            
        Returns:
            Business data dictionary if successful, None otherwise
        """
        try:
            data = {"businessId": business_id}
            
            result = await self._make_request("get-business", data)
            if result.get("success"):
                business = result.get("business")
                logger.info(f"Retrieved business from Convex: {business_id}")
                return business
            else:
                logger.error(f"Failed to get business: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting business from Convex: {e}")
            return None
    
    async def get_business_members(self, business_id: str) -> List[Dict[str, Any]]:
        """
        Get members of a business from Convex
        
        Args:
            business_id: The business identifier
            
        Returns:
            List of member dictionaries
        """
        try:
            data = {"businessId": business_id}
            
            result = await self._make_request("get-business-members", data)
            if result.get("success"):
                members = result.get("members", [])
                logger.info(f"Retrieved {len(members)} members for business: {business_id}")
                return members
            else:
                logger.error(f"Failed to get business members: {result.get('error')}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting business members from Convex: {e}")
            return []
    
    async def get_weekly_insights(self, business_id: str) -> Optional[Dict[str, Any]]:
        """
        Get weekly insights for a business from Convex
        
        Args:
            business_id: The business identifier
            
        Returns:
            Insights data dictionary if successful, None otherwise
        """
        try:
            data = {"businessId": business_id}
            
            result = await self._make_request("get-weekly-insights", data)
            if result.get("success"):
                insights = result.get("insights")
                logger.info(f"Retrieved weekly insights for business: {business_id}")
                return insights
            else:
                logger.error(f"Failed to get weekly insights: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting weekly insights from Convex: {e}")
            return None
    
    async def approve_all_auto_replies(self, business_id: str) -> Optional[int]:
        """
        Approve all auto-reply eligible reviews for a business
        
        Args:
            business_id: The business identifier
            
        Returns:
            Number of reviews approved if successful, None otherwise
        """
        try:
            data = {"businessId": business_id}
            
            result = await self._make_request("approve-all-auto-replies", data)
            if result.get("success"):
                count = result.get("count", 0)
                logger.info(f"Approved {count} auto-replies for business: {business_id}")
                return count
            else:
                logger.error(f"Failed to approve auto-replies: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error approving auto-replies in Convex: {e}")
            return None


# Global client instance
_convex_http_client: Optional[ConvexHTTPClient] = None


def get_convex_client() -> ConvexHTTPClient:
    """Get Convex HTTP client singleton"""
    global _convex_http_client
    if _convex_http_client is None:
        _convex_http_client = ConvexHTTPClient()
    return _convex_http_client