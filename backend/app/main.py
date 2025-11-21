from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from .schemas import (
    PullReviewsRequest, PullReviewsResponse,
    AnalyzeReviewsRequest, AnalyzeReviewsResponse,
    PostReplyRequest, PostReplyResponse,
    WeeklyInsightsRequest, WeeklyInsightsResponse,
    ReviewInsightsRequest, ReviewInsightsResponse,
    ReviewBase, ReviewWithAnalysis, MockReviewsWithAnalysisResponse
)
from .services.reviews_service import ReviewsService
from .services.insights_service import InsightsService
from .services.review_insights_service import ReviewInsightsService
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
review_insights_service = ReviewInsightsService()


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


@app.post("/ai/review-insights", response_model=ReviewInsightsResponse)
async def review_insights(request: ReviewInsightsRequest):
    """
    Analyze a single review and generate complete insights using IBM Watson NLU and watsonx.ai.
    
    This endpoint:
    1. Analyzes sentiment using IBM Watson NLU
    2. Converts sentiment score to 1-10 scale  
    3. Generates themes and reply using watsonx.ai Granite
    4. Applies deterministic business rules for severity and auto-reply
    
    Example usage:
    ```typescript
    const response = await fetch(`${process.env.FASTAPI_URL}/ai/review-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        comment: "Great service, very friendly staff!",
        rating: 5,
        businessContext: "Family restaurant in downtown area"
      })
    });
    ```
    """
    try:
        logger.info(f"Generating insights for {request.rating}-star review")
        
        insights = await review_insights_service.analyze_review_insights(
            comment=request.comment,
            rating=request.rating,
            business_context=request.businessContext
        )
        
        logger.info(f"Generated insights: {insights.sentiment} sentiment, {insights.severity} severity")
        return insights
        
    except Exception as e:
        logger.error(f"Error generating review insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@app.get("/mockReviews", response_model=list[ReviewBase])
async def mock_reviews():
    """
    Returns 10 mock coffee shop reviews for testing purposes.
    5 positive, 2 neutral, 3 negative with realistic content and employee names.
    """
    mock_data = [
        # 5 POSITIVE REVIEWS (4-5 stars)
        ReviewBase(
            source="google",
            reviewId="review_001",
            rating=5,
            text="Absolutely fantastic coffee! Sarah at the counter was incredibly friendly and made the perfect latte art. The atmosphere is cozy and perfect for working. I've become a regular and the quality is consistently excellent. Highly recommend their signature blend!",
            reviewerName="Michael Rodriguez",
            createdAt="2025-11-20T09:15:00Z"
        ),
        ReviewBase(
            source="google", 
            reviewId="review_002",
            rating=5,
            text="This place is a hidden gem! The barista Jake knows his craft - best cappuccino in town. Great selection of pastries and the wifi is fast. I love how they remember my usual order. Perfect spot for morning meetings or quiet study sessions.",
            reviewerName="Emma Thompson",
            createdAt="2025-11-19T08:30:00Z"
        ),
        ReviewBase(
            source="google",
            reviewId="review_003", 
            rating=4,
            text="Really enjoy coming here for my afternoon break. The coffee is always fresh and hot, and the staff is welcoming. Good variety of drinks and reasonable prices. The seating area could be bigger but overall a great local coffee shop.",
            reviewerName="David Chen",
            createdAt="2025-11-18T14:45:00Z"
        ),
        ReviewBase(
            source="google",
            reviewId="review_004",
            rating=5,
            text="Wow! Lisa made me the most amazing cold brew I've ever had. The beans are clearly high quality and you can taste the difference. Clean environment, friendly staff, and they even have oat milk options. Will definitely be back tomorrow!",
            reviewerName="Sophie Williams",
            createdAt="2025-11-17T16:20:00Z"
        ),
        ReviewBase(
            source="google", 
            reviewId="review_005",
            rating=4,
            text="Solid coffee shop with great vibes. The morning crew is efficient and the coffee is consistently good. I appreciate that they support local suppliers. The muffins are fresh baked daily. Only wish they had more outdoor seating.",
            reviewerName="James Parker",
            createdAt="2025-11-16T07:45:00Z"
        ),
        
        # 2 NEUTRAL REVIEWS (3 stars)
        ReviewBase(
            source="google",
            reviewId="review_006", 
            rating=3,
            text="It's okay. Coffee is decent but nothing special. The service was friendly enough but seemed understaffed during my visit. Prices are fair for the area. Might come back if I'm in the neighborhood but wouldn't go out of my way.",
            reviewerName="Rachel Green",
            createdAt="2025-11-15T11:30:00Z"
        ),
        ReviewBase(
            source="google",
            reviewId="review_007",
            rating=3, 
            text="Average coffee shop experience. The latte was a bit weak for my taste and the pastry selection was limited. Staff was polite and the place was clean. Not bad but not memorable either. There are better options nearby.",
            reviewerName="Thomas Anderson",
            createdAt="2025-11-14T13:15:00Z"
        ),
        
        # 3 NEGATIVE REVIEWS (1-2 stars) with repetitive pattern: slow service
        ReviewBase(
            source="google", 
            reviewId="review_008",
            rating=2,
            text="Really disappointed with the slow service today. Waited 15 minutes for a simple coffee while Mark seemed completely overwhelmed behind the counter. The drink was lukewarm when I finally got it and they got my order wrong. For $6, I expect much better.",
            reviewerName="Jennifer Lopez",
            createdAt="2025-11-13T12:00:00Z"
        ),
        ReviewBase(
            source="google",
            reviewId="review_009",
            rating=1, 
            text="Terrible experience. Extremely slow service - took over 20 minutes to get my order. The staff looked disorganized and my coffee was cold by the time I received it. Multiple customers were complaining about wait times. Won't be returning.",
            reviewerName="Robert Johnson",
            createdAt="2025-11-12T10:20:00Z"
        ),
        ReviewBase(
            source="google",
            reviewId="review_010",
            rating=2,
            text="Painfully slow service ruins what could be a nice coffee shop. Stood in line for 25 minutes during lunch rush with only 2 people ahead of me. The barista seemed new and kept making mistakes. Coffee was mediocre and overpriced. Very frustrating experience.",
            reviewerName="Amanda Davis",
            createdAt="2025-11-11T12:45:00Z"
        )
    ]
    
    logger.info("Returning 10 mock coffee shop reviews")
    return mock_data


@app.get("/mockReviewsWithAnalysis", response_model=MockReviewsWithAnalysisResponse)
async def mock_reviews_with_analysis():
    """
    Gets mock reviews and analyzes each one using the review insights endpoint.
    Returns combined data with reviews + their AI analysis + summary statistics.
    
    This endpoint demonstrates the full workflow by:
    1. Calling the /mockReviews endpoint internally
    2. Analyzing each review with the /ai/review-insights logic
    3. Combining results with summary statistics
    """
    try:
        logger.info("Starting mock reviews analysis workflow")
        
        # Step 1: Get mock reviews data (calling our own endpoint internally)
        mock_reviews_data = await mock_reviews()
        logger.info(f"Retrieved {len(mock_reviews_data)} mock reviews")
        
        # Step 2: Analyze each review using the review insights service
        reviews_with_analysis = []
        
        for review in mock_reviews_data:
            try:
                logger.info(f"Analyzing review {review.reviewId}")
                
                # Call the review insights service directly (same logic as /ai/review-insights endpoint)
                analysis = await review_insights_service.analyze_review_insights(
                    comment=review.text,
                    rating=review.rating,
                    business_context="Coffee shop with baristas and various coffee beverages"
                )
                
                # Combine review with its analysis
                review_with_analysis = ReviewWithAnalysis(
                    review=review,
                    analysis=analysis
                )
                reviews_with_analysis.append(review_with_analysis)
                
                logger.info(f"Completed analysis for review {review.reviewId}: {analysis.sentiment} sentiment")
                
            except Exception as e:
                logger.error(f"Failed to analyze review {review.reviewId}: {e}")
                # Skip failed analyses but continue with others
                continue
        
        # Step 3: Generate summary statistics
        total_reviews = len(reviews_with_analysis)
        if total_reviews == 0:
            raise Exception("No reviews were successfully analyzed")
        
        # Count sentiments
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        severity_counts = {"low": 0, "medium": 0, "high": 0}
        auto_reply_count = 0
        all_themes = []
        
        for item in reviews_with_analysis:
            sentiment_counts[item.analysis.sentiment] += 1
            severity_counts[item.analysis.severity] += 1
            if item.analysis.autoReplyOK:
                auto_reply_count += 1
            all_themes.extend(item.analysis.themes)
        
        # Count theme frequencies
        theme_counts = {}
        for theme in all_themes:
            theme_counts[theme] = theme_counts.get(theme, 0) + 1
        
        # Get top 5 themes
        top_themes = sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        summary = {
            "total_reviews": total_reviews,
            "sentiment_distribution": sentiment_counts,
            "severity_distribution": severity_counts,
            "auto_reply_eligible": auto_reply_count,
            "auto_reply_percentage": round((auto_reply_count / total_reviews) * 100, 1),
            "top_themes": [{"theme": theme, "count": count} for theme, count in top_themes],
            "average_rating": round(sum(item.review.rating for item in reviews_with_analysis) / total_reviews, 1)
        }
        
        response = MockReviewsWithAnalysisResponse(
            reviews_with_analysis=reviews_with_analysis,
            summary=summary
        )
        
        logger.info(f"Successfully analyzed {total_reviews} reviews with summary stats")
        return response
        
    except Exception as e:
        logger.error(f"Error in mock reviews analysis workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze mock reviews: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)