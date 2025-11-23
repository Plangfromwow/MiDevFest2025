import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..google_client import get_google_client
from ..convex_client import get_convex_client
from ..schemas import ReviewBase, ReviewAnalysis

logger = logging.getLogger(__name__)


class ReviewsService:
    """Service for handling review operations"""
    
    def __init__(self):
        self.google_client = get_google_client()
        self.convex_client = get_convex_client()
    
    async def pull_google_reviews(self, since_iso: Optional[str] = None) -> List[ReviewBase]:
        """
        Pull reviews from Google Business Profile
        
        Args:
            since_iso: Optional ISO timestamp to fetch reviews since
            
        Returns:
            List of normalized ReviewBase objects
        """
        try:
            logger.info(f"Pulling Google reviews since: {since_iso}")
            
            # Fetch reviews from Google
            raw_reviews = await self.google_client.fetch_reviews(since_iso)
            
            # Convert to ReviewBase objects
            reviews = []
            for raw_review in raw_reviews:
                try:
                    review = ReviewBase(**raw_review)
                    reviews.append(review)
                except Exception as e:
                    logger.warning(f"Failed to parse review {raw_review.get('reviewId', 'unknown')}: {e}")
                    continue
            
            logger.info(f"Successfully processed {len(reviews)} reviews from Google")
            return reviews
            
        except Exception as e:
            logger.error(f"Error pulling Google reviews: {e}")
            raise Exception(f"Failed to pull Google reviews: {e}")
    
    async def post_google_reply(self, review_id: str, reply_text: str) -> bool:
        """
        Post a reply to a Google review
        
        Args:
            review_id: The review identifier
            reply_text: The reply text to post
            
        Returns:
            True if successful
        """
        try:
            logger.info(f"Posting reply to Google review: {review_id}")
            
            # Validate inputs
            if not review_id or not review_id.strip():
                raise ValueError("Review ID cannot be empty")
            
            if not reply_text or not reply_text.strip():
                raise ValueError("Reply text cannot be empty")
            
            # Clean the reply text
            clean_reply = reply_text.strip()
            if len(clean_reply) > 4096:  # Google's limit
                logger.warning(f"Reply text too long ({len(clean_reply)} chars), truncating to 4096")
                clean_reply = clean_reply[:4093] + "..."
            
            # Post the reply
            success = await self.google_client.post_review_reply(review_id, clean_reply)
            
            if success:
                logger.info(f"Successfully posted reply to review: {review_id}")
            else:
                logger.error(f"Failed to post reply to review: {review_id}")
                
            return success
            
        except Exception as e:
            logger.error(f"Error posting reply to review {review_id}: {e}")
            raise Exception(f"Failed to post reply: {e}")
    
    def validate_review_data(self, review_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and clean review data
        
        Args:
            review_data: Raw review data dictionary
            
        Returns:
            Validated and cleaned review data
        """
        validated_data = review_data.copy()
        
        # Ensure required fields exist with defaults
        if 'source' not in validated_data:
            validated_data['source'] = 'google'
        
        if 'rating' not in validated_data:
            validated_data['rating'] = 3
        elif not isinstance(validated_data['rating'], int):
            try:
                validated_data['rating'] = int(validated_data['rating'])
            except:
                validated_data['rating'] = 3
        
        # Clamp rating to 1-5 range
        validated_data['rating'] = max(1, min(5, validated_data['rating']))
        
        if 'text' not in validated_data:
            validated_data['text'] = ""
        
        if 'reviewerName' not in validated_data:
            validated_data['reviewerName'] = "Anonymous"
        
        if 'createdAt' not in validated_data:
            validated_data['createdAt'] = datetime.now().isoformat()
        
        # Clean text fields
        text_fields = ['text', 'reviewerName']
        for field in text_fields:
            if field in validated_data and isinstance(validated_data[field], str):
                validated_data[field] = validated_data[field].strip()
        
        return validated_data
    
    def normalize_review_id(self, review_id: str, source: str = "google") -> str:
        """
        Normalize review ID format
        
        Args:
            review_id: Raw review ID
            source: Review source (default: "google")
            
        Returns:
            Normalized review ID
        """
        if not review_id:
            return ""
        
        # For Google reviews, extract the actual ID from the full name
        if source == "google" and "/" in review_id:
            # Format: "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
            parts = review_id.split("/")
            if len(parts) >= 6 and parts[-2] == "reviews":
                return parts[-1]
        
        return review_id.strip()
    
    async def get_review_stats(self, reviews: List[ReviewBase]) -> Dict[str, Any]:
        """
        Get basic statistics for a list of reviews
        
        Args:
            reviews: List of reviews
            
        Returns:
            Statistics dictionary
        """
        if not reviews:
            return {
                "total_reviews": 0,
                "average_rating": 0,
                "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                "latest_review": None,
                "oldest_review": None
            }
        
        # Calculate basic stats
        total_reviews = len(reviews)
        total_rating = sum(review.rating for review in reviews)
        average_rating = total_rating / total_reviews
        
        # Rating distribution
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            rating_distribution[review.rating] += 1
        
        # Find latest and oldest reviews
        sorted_reviews = sorted(reviews, key=lambda x: x.createdAt)
        oldest_review = sorted_reviews[0].createdAt if sorted_reviews else None
        latest_review = sorted_reviews[-1].createdAt if sorted_reviews else None
        
        return {
            "total_reviews": total_reviews,
            "average_rating": round(average_rating, 2),
            "rating_distribution": rating_distribution,
            "latest_review": latest_review,
            "oldest_review": oldest_review
        }
    
    def filter_reviews_by_rating(self, reviews: List[ReviewBase], min_rating: int = 1, max_rating: int = 5) -> List[ReviewBase]:
        """
        Filter reviews by rating range
        
        Args:
            reviews: List of reviews to filter
            min_rating: Minimum rating (inclusive)
            max_rating: Maximum rating (inclusive)
            
        Returns:
            Filtered list of reviews
        """
        return [
            review for review in reviews 
            if min_rating <= review.rating <= max_rating
        ]
    
    def filter_reviews_by_text(self, reviews: List[ReviewBase], keywords: List[str]) -> List[ReviewBase]:
        """
        Filter reviews containing specific keywords
        
        Args:
            reviews: List of reviews to filter
            keywords: List of keywords to search for
            
        Returns:
            Filtered list of reviews containing any of the keywords
        """
        if not keywords:
            return reviews
        
        filtered_reviews = []
        keywords_lower = [kw.lower() for kw in keywords]
        
        for review in reviews:
            review_text_lower = review.text.lower()
            if any(keyword in review_text_lower for keyword in keywords_lower):
                filtered_reviews.append(review)
        
        return filtered_reviews
    
    async def store_reviews_in_convex(
        self, 
        business_id: str, 
        reviews: List[ReviewBase], 
        analyses: List[ReviewAnalysis]
    ) -> int:
        """
        Store reviews and their analyses in Convex database
        
        Args:
            business_id: The business identifier
            reviews: List of reviews to store
            analyses: List of corresponding analyses
            
        Returns:
            Number of reviews successfully stored
        """
        stored_count = 0
        
        for i, review in enumerate(reviews):
            try:
                # Get corresponding analysis (if available)
                analysis = analyses[i] if i < len(analyses) else None
                
                if not analysis:
                    logger.warning(f"No analysis found for review {review.reviewId}, skipping")
                    continue
                
                # Convert review date to timestamp
                try:
                    review_date = datetime.fromisoformat(review.createdAt.replace('Z', '+00:00'))
                    date_timestamp = int(review_date.timestamp() * 1000)
                except:
                    date_timestamp = int(datetime.now().timestamp() * 1000)
                
                # Build triage object, excluding None/null values for optional fields
                triage = {
                    "sentiment": analysis.sentiment,
                    "severity": analysis.severity,
                    "themes": analysis.themes,
                    "recommendedPublicReply": analysis.suggestedReply,
                    "autoReplyOK": analysis.autoReplyOk,
                }
                
                # Add optional fields only if they have values
                if analysis.severity == "high":
                    triage["escalationReason"] = "High severity review requires attention"
                    triage["suggestedOwnerAction"] = "Review and respond personally"
                
                if analysis.privateOutreachDraft:
                    triage["suggestedPrivateOutreach"] = analysis.privateOutreachDraft
                
                # Store in Convex
                review_id = await self.convex_client.store_review(
                    business_id=business_id,
                    source=review.source,
                    author=review.reviewerName,
                    rating=review.rating,
                    text=review.text,
                    date=date_timestamp,
                    triage=triage,
                    images=[]
                )
                
                if review_id:
                    stored_count += 1
                    logger.info(f"Stored review {review.reviewId} in Convex with ID {review_id}")
                else:
                    logger.warning(f"Failed to store review {review.reviewId}")
                    
            except Exception as e:
                logger.error(f"Error storing review {review.reviewId}: {e}")
                continue
        
        return stored_count