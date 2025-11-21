from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from .schemas import (
    PullReviewsRequest, PullReviewsResponse,
    AnalyzeReviewsRequest, AnalyzeReviewsResponse,
    PostReplyRequest, PostReplyResponse,
    WeeklyInsightsRequest, WeeklyInsightsResponse
)
from .services.reviews_service import ReviewsService
from .services.insights_service import InsightsService
from .config import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Reputation Copilot API")
    yield
    logger.info("Shutting down Reputation Copilot API")


app = FastAPI(
    title="Reputation Copilot API",
    description="Backend API for managing Google Business Profile reviews and AI insights",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
reviews_service = ReviewsService()
insights_service = InsightsService()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "reputation-copilot-api"}


@app.post("/google/pull-reviews", response_model=PullReviewsResponse)
async def pull_reviews(request: PullReviewsRequest):
    """
    Fetch new reviews from Google Business Profile.
    
    Convex Action should call this endpoint like:
    ```typescript
    const response = await fetch(`${process.env.FASTAPI_URL}/google/pull-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ since_iso: "2025-11-01T00:00:00Z" })
    });
    ```
    """
    try:
        logger.info(f"Pulling reviews since: {request.since_iso}")
        reviews = await reviews_service.pull_google_reviews(request.since_iso)
        logger.info(f"Retrieved {len(reviews)} reviews")
        return PullReviewsResponse(reviews=reviews)
    except Exception as e:
        logger.error(f"Error pulling reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to pull reviews: {str(e)}")


@app.post("/ai/analyze-reviews", response_model=AnalyzeReviewsResponse)
async def analyze_reviews(request: AnalyzeReviewsRequest):
    """
    Analyze reviews with watsonx.ai Granite for sentiment, themes, and suggestions.
    
    Convex Action should call this after pulling reviews:
    ```typescript
    const response = await fetch(`${process.env.FASTAPI_URL}/ai/analyze-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviews: normalizedReviews })
    });
    ```
    """
    try:
        logger.info(f"Analyzing {len(request.reviews)} reviews")
        analysis = await insights_service.analyze_reviews(request.reviews)
        logger.info(f"Completed analysis for {len(analysis)} reviews")
        return AnalyzeReviewsResponse(analysis=analysis)
    except Exception as e:
        logger.error(f"Error analyzing reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze reviews: {str(e)}")


@app.post("/google/post-reply", response_model=PostReplyResponse)
async def post_reply(request: PostReplyRequest):
    """
    Post an approved reply to a Google review.
    
    Convex Action should call this when user approves a suggested reply:
    ```typescript
    const response = await fetch(`${process.env.FASTAPI_URL}/google/post-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        reviewId: "review_123", 
        approvedReply: "Thank you for your feedback!" 
      })
    });
    ```
    """
    try:
        logger.info(f"Posting reply to review: {request.reviewId}")
        await reviews_service.post_google_reply(request.reviewId, request.approvedReply)
        logger.info(f"Successfully posted reply to review: {request.reviewId}")
        return PostReplyResponse(status="posted", reviewId=request.reviewId)
    except Exception as e:
        logger.error(f"Error posting reply: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to post reply: {str(e)}")


@app.post("/ai/weekly-insights", response_model=WeeklyInsightsResponse)
async def weekly_insights(request: WeeklyInsightsRequest):
    """
    Generate weekly insights from recent reviews using watsonx.ai.
    
    Convex Action should call this for periodic insights:
    ```typescript
    const response = await fetch(`${process.env.FASTAPI_URL}/ai/weekly-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        businessId: "business_123",
        days: 7
      })
    });
    ```
    """
    try:
        logger.info(f"Generating weekly insights for business: {request.businessId}, days: {request.days}")
        insights = await insights_service.generate_weekly_insights(
            request.businessId, 
            request.days, 
            request.reviews
        )
        logger.info(f"Generated insights for business: {request.businessId}")
        return WeeklyInsightsResponse(businessId=request.businessId, insights=insights)
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)