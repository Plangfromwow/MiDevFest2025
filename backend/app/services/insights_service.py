import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..convex_client import get_convex_client
from ..schemas import ReviewBase, ReviewAnalysis, WeeklyInsights

logger = logging.getLogger(__name__)


class InsightsService:
    """Service for generating AI insights from reviews"""
    
    def __init__(self):
        self.convex_client = get_convex_client()
    
    async def analyze_reviews(self, reviews: List[ReviewBase]) -> List[ReviewAnalysis]:
        """
        Analyze multiple reviews with watsonx.ai
        
        Args:
            reviews: List of reviews to analyze
            
        Returns:
            List of ReviewAnalysis objects
        """
        try:
            return []
            
        except Exception as e:
            logger.error(f"Error in analyze_reviews: {e}")
            # Return default analyses for all reviews
            return [self._create_default_analysis(review) for review in reviews]
    
    async def generate_weekly_insights(
        self, 
        business_id: str, 
        days: int = 7, 
        reviews: Optional[List[ReviewBase]] = None
    ) -> WeeklyInsights:
        """
        Generate weekly insights from recent reviews
        
        Args:
            business_id: Business identifier
            days: Number of days to analyze
            reviews: Optional list of reviews (if not provided, will fetch from Convex)
            
        Returns:
            WeeklyInsights object
        """
        try:
            return self._create_default_insights()
            
        except Exception as e:
            logger.error(f"Error generating weekly insights: {e}")
            # Return default insights on error
            return self._create_default_insights()
    
    async def _fetch_reviews_for_insights(self, business_id: str, days: int) -> List[ReviewBase]:
        """
        Fetch recent reviews for insights generation
        
        Args:
            business_id: Business identifier
            days: Number of days to look back
            
        Returns:
            List of ReviewBase objects
        """
        try:
            # Try to get reviews from Convex
            reviews_data = await self.convex_client.get_recent_reviews(business_id, days)
            
            # If no results, try HTTP client as fallback
            if not reviews_data:
                logger.info("Falling back to HTTP client for Convex")
                reviews_data = await self.convex_http_client.get_recent_reviews_http(business_id, days)
            
            # Convert to ReviewBase objects
            reviews = []
            for review_data in reviews_data:
                try:
                    review = ReviewBase(**review_data)
                    reviews.append(review)
                except Exception as e:
                    logger.warning(f"Failed to parse review from Convex: {e}")
                    continue
            
            return reviews
            
        except Exception as e:
            logger.error(f"Error fetching reviews from Convex: {e}")
            return []
    
    def _create_default_analysis(self, review: ReviewBase) -> ReviewAnalysis:
        """
        Create a default analysis for a review when AI analysis fails
        
        Args:
            review: The review to create analysis for
            
        Returns:
            Default ReviewAnalysis object
        """
        # Determine sentiment and severity based on rating
        if review.rating >= 4:
            sentiment = "positive"
            severity = "low"
        elif review.rating == 3:
            sentiment = "neutral"
            severity = "medium"
        else:
            sentiment = "negative"
            severity = "high"
        
        # Generate basic reply
        if review.rating >= 4:
            suggested_reply = "Thank you for your positive feedback! We appreciate your business."
        elif review.rating == 3:
            suggested_reply = "Thank you for your feedback. We're always looking to improve our service."
        else:
            suggested_reply = "Thank you for your feedback. We take all concerns seriously and would like to make this right."
        
        analysis_data = {
            "reviewId": review.reviewId,
            "sentiment": sentiment,
            "severity": severity,
            "themes": ["service", "experience"],
            "suggestedReply": suggested_reply,
            "autoReplyOk": review.rating >= 3
        }
        
        # Add private outreach for high severity
        if severity == "high":
            analysis_data["privateOutreachDraft"] = "We sincerely apologize for your experience. Please contact us directly so we can address your concerns."
        
        return ReviewAnalysis(**analysis_data)
    
    def _create_default_insights(self) -> WeeklyInsights:
        """
        Create default weekly insights when generation fails
        
        Returns:
            Default WeeklyInsights object
        """
        return WeeklyInsights(
            topThemes=["service", "experience", "quality"],
            riskScore=50,
            quickFix="Focus on improving service consistency and customer communication."
        )
    
    def _estimate_sentiment(self, rating: int) -> str:
        """
        Estimate sentiment from rating
        
        Args:
            rating: Star rating (1-5)
            
        Returns:
            Sentiment string
        """
        if rating >= 4:
            return "positive"
        elif rating == 3:
            return "neutral"
        else:
            return "negative"
    
    async def get_sentiment_distribution(self, analyses: List[ReviewAnalysis]) -> Dict[str, Any]:
        """
        Get sentiment distribution from analyses
        
        Args:
            analyses: List of review analyses
            
        Returns:
            Sentiment distribution statistics
        """
        if not analyses:
            return {
                "total_reviews": 0,
                "positive": 0,
                "neutral": 0,
                "negative": 0,
                "positive_percentage": 0,
                "negative_percentage": 0
            }
        
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        
        for analysis in analyses:
            sentiment_counts[analysis.sentiment] += 1
        
        total = len(analyses)
        positive_pct = (sentiment_counts["positive"] / total) * 100
        negative_pct = (sentiment_counts["negative"] / total) * 100
        
        return {
            "total_reviews": total,
            "positive": sentiment_counts["positive"],
            "neutral": sentiment_counts["neutral"],
            "negative": sentiment_counts["negative"],
            "positive_percentage": round(positive_pct, 1),
            "negative_percentage": round(negative_pct, 1)
        }
    
    async def get_theme_analysis(self, analyses: List[ReviewAnalysis]) -> Dict[str, int]:
        """
        Get theme frequency analysis
        
        Args:
            analyses: List of review analyses
            
        Returns:
            Dictionary with theme frequencies
        """
        theme_counts = {}
        
        for analysis in analyses:
            for theme in analysis.themes:
                theme_lower = theme.lower().strip()
                theme_counts[theme_lower] = theme_counts.get(theme_lower, 0) + 1
        
        # Sort by frequency
        sorted_themes = dict(sorted(theme_counts.items(), key=lambda x: x[1], reverse=True))
        
        return sorted_themes
    
    async def get_auto_reply_candidates(self, analyses: List[ReviewAnalysis]) -> List[Dict[str, Any]]:
        """
        Get reviews that are candidates for auto-reply
        
        Args:
            analyses: List of review analyses
            
        Returns:
            List of auto-reply candidates
        """
        candidates = []
        
        for analysis in analyses:
            if analysis.autoReplyOk:
                candidates.append({
                    "reviewId": analysis.reviewId,
                    "sentiment": analysis.sentiment,
                    "suggestedReply": analysis.suggestedReply,
                    "themes": analysis.themes
                })
        
        return candidates