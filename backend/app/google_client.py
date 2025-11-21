import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
import httpx
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from .config import get_settings

logger = logging.getLogger(__name__)


class GoogleBusinessClient:
    """Client for Google Business Profile API operations"""
    
    def __init__(self):
        self.settings = get_settings()
        self._service = None
        self._credentials = None
    
    def _get_credentials(self) -> Credentials:
        """Get or refresh Google OAuth credentials"""
        if self._credentials and self._credentials.valid:
            return self._credentials
        
        # Create credentials from refresh token
        self._credentials = Credentials(
            token=None,  # Will be refreshed
            refresh_token=self.settings.google_refresh_token,
            client_id=self.settings.google_client_id,
            client_secret=self.settings.google_client_secret,
            token_uri="https://oauth2.googleapis.com/token"
        )
        
        # Refresh the token
        request = Request()
        self._credentials.refresh(request)
        
        logger.info("Google credentials refreshed successfully")
        return self._credentials
    
    def _get_service(self):
        """Get or create Google Business Profile API service"""
        if self._service is None:
            credentials = self._get_credentials()
            self._service = build('mybusiness', 'v4', credentials=credentials)
        return self._service
    
    async def fetch_reviews(self, since_iso: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch reviews from Google Business Profile
        
        Args:
            since_iso: ISO timestamp to fetch reviews since (optional)
            
        Returns:
            List of normalized review dictionaries
        """
        try:
            service = self._get_service()
            location_id = self.settings.google_location_id
            
            logger.info(f"Fetching reviews for location: {location_id}")
            
            # Build the request
            request_params = {}
            if since_iso:
                # Convert to the format Google expects
                request_params['filter'] = f'createTime >= "{since_iso}"'
            
            # Call the API
            request = service.accounts().locations().reviews().list(
                parent=location_id,
                pageSize=50,  # Max per request
                **request_params
            )
            
            response = request.execute()
            reviews = response.get('reviews', [])
            
            # Normalize the reviews
            normalized_reviews = []
            for review in reviews:
                normalized_review = self._normalize_google_review(review)
                normalized_reviews.append(normalized_review)
            
            logger.info(f"Fetched {len(normalized_reviews)} reviews from Google")
            return normalized_reviews
            
        except HttpError as e:
            logger.error(f"Google API error: {e}")
            raise Exception(f"Google API error: {e}")
        except Exception as e:
            logger.error(f"Error fetching Google reviews: {e}")
            raise Exception(f"Failed to fetch reviews: {e}")
    
    async def post_review_reply(self, review_id: str, reply_text: str) -> bool:
        """
        Post a reply to a Google review
        
        Args:
            review_id: The Google review identifier
            reply_text: The reply text to post
            
        Returns:
            True if successful
        """
        try:
            service = self._get_service()
            location_id = self.settings.google_location_id
            
            # The review name format for Google API
            review_name = f"{location_id}/reviews/{review_id}"
            
            logger.info(f"Posting reply to review: {review_name}")
            
            # Prepare the reply body
            reply_body = {
                'comment': reply_text
            }
            
            # Post the reply
            request = service.accounts().locations().reviews().reply(
                name=review_name,
                body=reply_body
            )
            
            response = request.execute()
            
            logger.info(f"Successfully posted reply to review: {review_id}")
            return True
            
        except HttpError as e:
            logger.error(f"Google API error posting reply: {e}")
            raise Exception(f"Google API error posting reply: {e}")
        except Exception as e:
            logger.error(f"Error posting reply: {e}")
            raise Exception(f"Failed to post reply: {e}")
    
    def _normalize_google_review(self, google_review: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a Google review to our standard format
        
        Args:
            google_review: Raw Google review data
            
        Returns:
            Normalized review dictionary
        """
        # Extract review ID from name (format: "accounts/.../locations/.../reviews/REVIEW_ID")
        review_name = google_review.get('name', '')
        review_id = review_name.split('/')[-1] if '/' in review_name else review_name
        
        # Extract star rating
        star_rating = google_review.get('starRating', 'UNSPECIFIED')
        rating_map = {
            'ONE': 1,
            'TWO': 2,
            'THREE': 3,
            'FOUR': 4,
            'FIVE': 5,
            'UNSPECIFIED': 3  # Default to 3 if unspecified
        }
        rating = rating_map.get(star_rating, 3)
        
        # Extract review text
        review_text = google_review.get('comment', '')
        
        # Extract reviewer info
        reviewer = google_review.get('reviewer', {})
        reviewer_name = reviewer.get('displayName', 'Anonymous')
        
        # Extract creation time
        create_time = google_review.get('createTime', '')
        if create_time:
            # Google returns RFC3339 format, convert to ISO
            try:
                dt = datetime.fromisoformat(create_time.replace('Z', '+00:00'))
                created_at = dt.isoformat()
            except:
                created_at = create_time
        else:
            created_at = datetime.now().isoformat()
        
        return {
            "source": "google",
            "reviewId": review_id,
            "rating": rating,
            "text": review_text,
            "reviewerName": reviewer_name,
            "createdAt": created_at
        }


# Global client instance
_google_client: Optional[GoogleBusinessClient] = None


def get_google_client() -> GoogleBusinessClient:
    """Get Google Business client singleton"""
    global _google_client
    if _google_client is None:
        _google_client = GoogleBusinessClient()
    return _google_client