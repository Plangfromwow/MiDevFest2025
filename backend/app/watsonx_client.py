import logging
import json
from typing import Dict, List, Any, Optional
import httpx
from ibm_watsonx_ai.foundation_models import Model
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
from ibm_watsonx_ai import Credentials
from pydantic import ValidationError

from .config import get_settings

logger = logging.getLogger(__name__)


class WatsonxClient:
    """Client for IBM watsonx.ai Granite model operations"""
    
    def __init__(self):
        self.settings = get_settings()
        self._model = None
        self._credentials = None
    
    def _get_credentials(self) -> Credentials:
        """Get watsonx credentials"""
        if self._credentials is None:
            self._credentials = Credentials(
                url=self.settings.watsonx_url,
                api_key=self.settings.watsonx_api_key
            )
        return self._credentials
    
    def _get_model(self) -> Model:
        """Get or create watsonx model instance"""
        if self._model is None:
            credentials = self._get_credentials()
            
            model_params = {
                GenParams.DECODING_METHOD: "greedy",
                GenParams.MAX_NEW_TOKENS: 1000,
                GenParams.TEMPERATURE: 0.1,  # Low temperature for consistent JSON output
                GenParams.TOP_P: 0.9,
                GenParams.REPETITION_PENALTY: 1.1
            }
            
            self._model = Model(
                model_id=self.settings.watsonx_model_id,
                params=model_params,
                credentials=credentials,
                project_id=self.settings.watsonx_project_id
            )
        
        return self._model
    
    async def analyze_single_review(self, review_text: str, rating: int) -> Dict[str, Any]:
        """
        Analyze a single review with Granite model
        
        Args:
            review_text: The review text to analyze
            rating: The star rating (1-5)
            
        Returns:
            Analysis dictionary with sentiment, themes, etc.
        """
        try:
            model = self._get_model()
            
            # Create the prompt for review analysis
            prompt = self._create_review_triage_prompt(review_text, rating)
            
            logger.info(f"Analyzing review with rating {rating}")
            
            # Generate response
            response = model.generate_text(prompt=prompt)
            
            # Parse JSON response
            try:
                analysis = json.loads(response.strip())
                
                # Validate required fields
                required_fields = ['sentiment', 'severity', 'themes', 'suggestedReply', 'autoReplyOk']
                for field in required_fields:
                    if field not in analysis:
                        logger.warning(f"Missing field {field} in analysis, adding default")
                        analysis[field] = self._get_default_value(field)
                
                return analysis
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.error(f"Raw response: {response}")
                # Return default analysis
                return self._get_default_analysis(review_text, rating)
                
        except Exception as e:
            logger.error(f"Error analyzing review: {e}")
            # Return default analysis on error
            return self._get_default_analysis(review_text, rating)
    
    async def generate_weekly_insights(self, reviews_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate weekly insights from a list of reviews
        
        Args:
            reviews_data: List of review dictionaries
            
        Returns:
            Weekly insights with themes, risk score, and quick fix
        """
        try:
            model = self._get_model()
            
            # Create the prompt for weekly insights
            prompt = self._create_weekly_insights_prompt(reviews_data)
            
            logger.info(f"Generating insights for {len(reviews_data)} reviews")
            
            # Generate response
            response = model.generate_text(prompt=prompt)
            
            # Parse JSON response
            try:
                insights = json.loads(response.strip())
                
                # Validate required fields
                required_fields = ['topThemes', 'riskScore', 'quickFix']
                for field in required_fields:
                    if field not in insights:
                        logger.warning(f"Missing field {field} in insights, adding default")
                        insights[field] = self._get_default_insight_value(field)
                
                return insights
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse insights JSON response: {e}")
                logger.error(f"Raw response: {response}")
                # Return default insights
                return self._get_default_insights(reviews_data)
                
        except Exception as e:
            logger.error(f"Error generating weekly insights: {e}")
            # Return default insights on error
            return self._get_default_insights(reviews_data)
    
    def _create_review_triage_prompt(self, review_text: str, rating: int) -> str:
        """Create prompt for individual review analysis"""
        return f"""You are an AI assistant that analyzes customer reviews for businesses. Your task is to analyze the given review and provide structured output in JSON format only.

Review Text: "{review_text}"
Star Rating: {rating}/5

Analyze this review and respond with ONLY a valid JSON object with these exact fields:

{{
  "sentiment": "positive|neutral|negative",
  "severity": "low|medium|high", 
  "themes": ["theme1", "theme2", "theme3"],
  "suggestedReply": "Professional response to the customer",
  "autoReplyOk": true|false,
  "privateOutreachDraft": "Draft for private outreach (only if severity is high)"
}}

Guidelines:
- sentiment: positive (4-5 stars generally), neutral (3 stars), negative (1-2 stars)
- severity: low (minor issues/praise), medium (moderate concerns), high (serious complaints/major issues)
- themes: Extract 2-4 key themes like "service quality", "staff behavior", "cleanliness", "pricing", etc.
- suggestedReply: Professional, empathetic response appropriate for public viewing
- autoReplyOk: true for positive/neutral reviews, false for negative/complex issues
- privateOutreachDraft: Only include if severity is "high", otherwise omit this field

Response must be valid JSON only, no additional text or markdown."""
    
    def _create_weekly_insights_prompt(self, reviews_data: List[Dict[str, Any]]) -> str:
        """Create prompt for weekly insights generation"""
        # Summarize the reviews for the prompt
        reviews_summary = []
        for review in reviews_data[:20]:  # Limit to prevent token overflow
            reviews_summary.append(f"Rating: {review.get('rating', 'N/A')}, Text: {review.get('text', '')[:200]}...")
        
        reviews_text = "\n".join(reviews_summary)
        
        return f"""You are an AI assistant that analyzes customer review trends for businesses. Analyze the following reviews from the past week and provide insights in JSON format only.

Reviews Data:
{reviews_text}

Analyze these reviews and respond with ONLY a valid JSON object with these exact fields:

{{
  "topThemes": ["theme1", "theme2", "theme3"],
  "riskScore": 0-100,
  "quickFix": "1-2 sentence actionable recommendation"
}}

Guidelines:
- topThemes: The 3 most frequently mentioned topics/issues (e.g., "service speed", "staff attitude", "cleanliness")
- riskScore: 0-100 where 0=excellent reputation, 100=major reputation risk. Consider negative sentiment ratio, severity of complaints
- quickFix: Specific, actionable advice to address the most critical issue (max 2 sentences)

Response must be valid JSON only, no additional text or markdown."""
    
    def _get_default_analysis(self, review_text: str, rating: int) -> Dict[str, Any]:
        """Return default analysis when AI fails"""
        sentiment = "positive" if rating >= 4 else ("neutral" if rating == 3 else "negative")
        severity = "low" if rating >= 4 else ("medium" if rating == 3 else "high")
        
        analysis = {
            "sentiment": sentiment,
            "severity": severity,
            "themes": ["service", "experience"],
            "suggestedReply": "Thank you for your feedback. We appreciate you taking the time to share your experience.",
            "autoReplyOk": rating >= 3
        }
        
        if severity == "high":
            analysis["privateOutreachDraft"] = "We sincerely apologize for your experience. Please contact us directly so we can make this right."
        
        return analysis
    
    def _get_default_insights(self, reviews_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Return default insights when AI fails"""
        avg_rating = sum(r.get('rating', 3) for r in reviews_data) / len(reviews_data) if reviews_data else 3
        risk_score = max(0, int((5 - avg_rating) * 20))  # Simple risk calculation
        
        return {
            "topThemes": ["service", "experience", "quality"],
            "riskScore": risk_score,
            "quickFix": "Focus on improving service consistency and customer communication."
        }
    
    def _get_default_value(self, field: str) -> Any:
        """Get default value for missing fields in analysis"""
        defaults = {
            'sentiment': 'neutral',
            'severity': 'medium',
            'themes': ['service'],
            'suggestedReply': 'Thank you for your feedback.',
            'autoReplyOk': False
        }
        return defaults.get(field, None)
    
    def _get_default_insight_value(self, field: str) -> Any:
        """Get default value for missing fields in insights"""
        defaults = {
            'topThemes': ['service', 'experience'],
            'riskScore': 50,
            'quickFix': 'Focus on improving customer service consistency.'
        }
        return defaults.get(field, None)


# Global client instance
_watsonx_client: Optional[WatsonxClient] = None


def get_watsonx_client() -> WatsonxClient:
    """Get watsonx client singleton"""
    global _watsonx_client
    if _watsonx_client is None:
        _watsonx_client = WatsonxClient()
    return _watsonx_client