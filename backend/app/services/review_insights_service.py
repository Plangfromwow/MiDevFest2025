import logging
from typing import Optional

from ..nlu_client import get_nlu_client
from ..watsonx_client import get_watsonx_client
from ..schemas import ReviewInsightsResponse

logger = logging.getLogger(__name__)


class ReviewInsightsService:
    """Service for analyzing individual reviews and generating insights"""
    
    def __init__(self):
        self.nlu_client = get_nlu_client()
        self.watsonx_client = get_watsonx_client()
    
    async def analyze_review_insights(
        self,
        comment: str,
        rating: int,
        business_context: Optional[str] = None
    ) -> ReviewInsightsResponse:
        """
        Analyze a single review and generate complete insights
        
        Args:
            comment: Review text content
            rating: Star rating (1-5)
            business_context: Optional business context
            
        Returns:
            ReviewInsightsResponse with complete analysis
        """
        try:
            logger.info(f"Analyzing review insights for {rating}-star review")
            
            # Step 1: Get sentiment analysis from Watson NLU
            sentiment_label, raw_score = await self.nlu_client.analyze_sentiment(comment)
            
            # Step 2: Convert raw score to 1-10 scale
            sentiment_score_1to10 = round(((raw_score + 1) / 2) * 9 + 1, 1)
            
            logger.info(f"Sentiment: {sentiment_label}, Score: {sentiment_score_1to10}/10")
            
            # Step 3: Get themes and reply from watsonx Granite
            granite_result = await self.watsonx_client.generate_themes_and_reply(
                comment=comment,
                rating=rating,
                business_context=business_context,
                sentiment_label=sentiment_label,
                sentiment_score_1to10=sentiment_score_1to10
            )
            
            # Step 4: Apply deterministic business rules
            severity = self._calculate_severity(rating, sentiment_label, sentiment_score_1to10)
            auto_reply_ok = self._calculate_auto_reply_ok(severity)
            
            # Step 5: Construct response
            response = ReviewInsightsResponse(
                autoReplyOK=auto_reply_ok,
                recommendedPublicReply=granite_result["recommendedPublicReply"],
                sentiment=sentiment_label,
                severity=severity,
                themes=granite_result["themes"]
            )
            
            logger.info(f"Analysis complete: {severity} severity, autoReply={auto_reply_ok}")
            return response
            
        except Exception as e:
            logger.error(f"Error analyzing review insights: {e}")
            raise
    
    def _calculate_severity(self, rating: int, sentiment_label: str, sentiment_score_1to10: float) -> str:
        """
        Calculate severity using deterministic business rules
        
        Args:
            rating: Star rating (1-5)
            sentiment_label: NLU sentiment label
            sentiment_score_1to10: Converted sentiment score
            
        Returns:
            Severity level: "low", "medium", or "high"
        """
        # High severity conditions
        if rating <= 2 or sentiment_label == "negative" or sentiment_score_1to10 <= 3.5:
            return "high"
        
        # Medium severity conditions  
        elif rating == 3 or sentiment_label == "neutral" or sentiment_score_1to10 <= 6.5:
            return "medium"
        
        # Low severity (everything else)
        else:
            return "low"
    
    def _calculate_auto_reply_ok(self, severity: str) -> bool:
        """
        Calculate auto-reply recommendation using deterministic rules
        
        Args:
            severity: Calculated severity level
            
        Returns:
            True if auto-reply is recommended, False otherwise
        """
        return severity == "low"
    
