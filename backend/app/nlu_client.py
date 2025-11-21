import logging
from typing import Tuple, Optional
from ibm_watson import NaturalLanguageUnderstandingV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watson.natural_language_understanding_v1 import Features, SentimentOptions

from .config import get_settings

logger = logging.getLogger(__name__)


class NLUClient:
    """Client for IBM Watson Natural Language Understanding using SDK"""

    def __init__(self):
        self.settings = get_settings()
        self._nlu = None

    def _get_nlu_service(self) -> NaturalLanguageUnderstandingV1:
        """Get or create Watson NLU service instance"""
        if self._nlu is None:
            authenticator = IAMAuthenticator(self.settings.watson_nlu_api_key)
            self._nlu = NaturalLanguageUnderstandingV1(
                version='2022-04-07',
                authenticator=authenticator
            )
            self._nlu.set_service_url(self.settings.watson_nlu_url)
        return self._nlu

    async def analyze_sentiment(self, comment: str) -> Tuple[str, float]:
        """
        Analyze sentiment of review comment using IBM Watson NLU SDK

        Args:
            comment: The review text to analyze

        Returns:
            Tuple of (sentiment_label, raw_score)
            - sentiment_label: "positive", "neutral", or "negative"
            - raw_score: float between -1 and 1
        """
        try:
            nlu = self._get_nlu_service()

            logger.info("Analyzing sentiment with Watson NLU SDK")

            # Analyze sentiment
            response = nlu.analyze(
                text=comment,
                features=Features(sentiment=SentimentOptions()),
                language='en'
            ).get_result()

            # Extract sentiment data
            sentiment_data = response['sentiment']['document']
            label = sentiment_data['label']  # positive, neutral, negative
            score = sentiment_data['score']  # float between -1 and 1

            logger.info(f"NLU sentiment analysis: {label} ({score})")
            
            return label, score

        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            raise


# Global client instance
_nlu_client: Optional[NLUClient] = None


def get_nlu_client() -> NLUClient:
    """Get NLU client singleton"""
    global _nlu_client
    if _nlu_client is None:
        _nlu_client = NLUClient()
    return _nlu_client