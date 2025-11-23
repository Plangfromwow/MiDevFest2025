import logging
import json
from typing import Dict, Any, Optional
from ibm_watsonx_ai.foundation_models import Model
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
from ibm_watsonx_ai import Credentials

from .config import get_settings

logger = logging.getLogger(__name__)


class WatsonxClient:
    """Client for IBM watsonx.ai Granite model operations using SDK"""

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
                GenParams.MAX_NEW_TOKENS: 500,
                GenParams.TEMPERATURE: 0.1,
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

    async def generate_themes_and_reply(
        self,
        comment: str,
        rating: int,
        business_context: Optional[str],
        sentiment_label: str,
        sentiment_score_1to10: float
    ) -> Dict[str, Any]:
        """
        Generate themes and recommended reply using Granite Instruct model via SDK

        Args:
            comment: The review text
            rating: Star rating (1-5)
            business_context: Optional business context
            sentiment_label: NLU sentiment label
            sentiment_score_1to10: Converted sentiment score (1-10)

        Returns:
            Dictionary with "themes" and "recommendedPublicReply"
        """
        try:
            model = self._get_model()

            # Create the prompt
            prompt = self._create_granite_prompt(
                comment, rating, business_context, sentiment_label, sentiment_score_1to10
            )

            logger.info("Generating themes and reply with watsonx Granite SDK")

            # Generate response using SDK
            response = model.generate_text(prompt=prompt)

            # Parse JSON response
            try:
                parsed_result = json.loads(response.strip())

                # Validate required fields
                if "themes" not in parsed_result or "recommendedPublicReply" not in parsed_result:
                    logger.warning("Missing required fields in Granite response, using defaults")
                    return self._get_default_granite_response(rating, sentiment_label)

                # Ensure themes is a list
                if not isinstance(parsed_result["themes"], list):
                    parsed_result["themes"] = [str(parsed_result["themes"])]

                # Limit themes to 2-5 items
                parsed_result["themes"] = parsed_result["themes"][:5]
                if len(parsed_result["themes"]) < 2:
                    parsed_result["themes"].extend(["service", "experience"])

                return parsed_result

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from Granite: {e}")
                logger.error(f"Raw response: {response}")
                return self._get_default_granite_response(rating, sentiment_label)

        except Exception as e:
            logger.error(f"Error generating themes and reply: {e}")
            return self._get_default_granite_response(rating, sentiment_label)
    
    def _create_granite_prompt(
        self,
        comment: str,
        rating: int,
        business_context: Optional[str],
        sentiment_label: str,
        sentiment_score_1to10: float
    ) -> str:
        """Create prompt for Granite Instruct model"""

        context = business_context or "a local business focused on customer satisfaction"

        return f"""You are an AI assistant analyzing customer reviews for {context}.

Review Details:
- Rating: {rating}/5 stars
- Comment: "{comment}"
- Sentiment: {sentiment_label} (score: {sentiment_score_1to10}/10)

Analyze this review and respond with ONLY a valid JSON object with exactly these fields:

{{
  "themes": ["theme1", "theme2", "theme3"],
  "recommendedPublicReply": "professional response text"
}}

Guidelines:
- themes: Extract 2-5 key themes (e.g., "service quality", "staff attitude", "cleanliness", "pricing", "wait time")
- recommendedPublicReply: Write a professional, empathetic 2-4 sentence public response appropriate for this rating and sentiment

Requirements:
- Output ONLY valid JSON, no markdown, no extra text
- No additional fields beyond "themes" and "recommendedPublicReply"
- Keep reply professional and brand-appropriate"""

    def _get_default_granite_response(self, rating: int, sentiment_label: str) -> Dict[str, Any]:
        """Get default response when Granite fails"""
        if rating >= 4:
            reply = "Thank you for your positive feedback! We're delighted to hear about your great experience and appreciate you taking the time to share it."
            themes = ["service", "experience"]
        elif rating == 3:
            reply = "Thank you for your feedback. We appreciate you sharing your experience and are always looking for ways to improve our service."
            themes = ["service", "experience"]
        else:
            reply = "Thank you for bringing this to our attention. We take all feedback seriously and would welcome the opportunity to make this right. Please reach out to us directly."
            themes = ["service issues", "customer experience"]

        return {
            "themes": themes,
            "recommendedPublicReply": reply
        }


# Global client instance
_watsonx_client: Optional[WatsonxClient] = None


def get_watsonx_client() -> WatsonxClient:
    """Get watsonx client singleton"""
    global _watsonx_client
    if _watsonx_client is None:
        _watsonx_client = WatsonxClient()
    return _watsonx_client