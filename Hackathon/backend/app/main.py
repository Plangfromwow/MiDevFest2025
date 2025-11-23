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
    ReviewBase, ReviewAnalysis, ReviewWithAnalysis, MockReviewsWithAnalysisResponse
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
    logger.info("Starting Review Radar API")
    yield
    logger.info("Shutting down Review Radar API")


app = FastAPI(
    title="Review Radar API",
    description="Backend API for managing Google Business Profile reviews and AI insights",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
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
    Fetch new reviews from Google Business Profile, analyze them, and store in Convex.
    
    Frontend should call this endpoint like:
    ```typescript
    const response = await fetch(`${BACKEND_URL}/google/pull-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        business_id: "businessId123",
        since_iso: "2025-11-01T00:00:00Z" 
      })
    });
    ```
    """
    try:
        logger.info(f"Pulling reviews for business {request.business_id} since: {request.since_iso}")
        
        # Pull reviews from Google
        reviews = await reviews_service.pull_google_reviews(request.since_iso)
        logger.info(f"Retrieved {len(reviews)} reviews from Google")
        
        if not reviews:
            return PullReviewsResponse(message="No new reviews found", count=0)
        
        # Analyze reviews with AI
        logger.info(f"Analyzing {len(reviews)} reviews with AI")
        analyses = await insights_service.analyze_reviews(reviews)
        
        # Store reviews in Convex
        logger.info(f"Storing {len(reviews)} reviews in Convex")
        stored_count = await reviews_service.store_reviews_in_convex(
            request.business_id, 
            reviews, 
            analyses
        )
        
        logger.info(f"Successfully processed and stored {stored_count} reviews")
        return PullReviewsResponse(
            message=f"Successfully imported {stored_count} reviews",
            count=stored_count
        )
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


@app.post("/google/mock-reviews", response_model=PullReviewsResponse)
async def mock_google_reviews(request: PullReviewsRequest):
    """
    Generate mock Google reviews for Olympic Food and store them in Convex.
    This replaces the actual Google API call for testing purposes.
    
    Frontend should call this endpoint like:
    ```typescript
    const response = await fetch(`${BACKEND_URL}/google/mock-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        business_id: "businessId123"
      })
    });
    ```
    """
    try:
        logger.info(f"Generating mock reviews for business {request.business_id}")
        
        # Generate mock reviews for Olympic Food
        mock_data = [
            # POSITIVE REVIEWS
            ReviewBase(
                source="google",
                reviewId="mock_review_001",
                rating=5,
                text="Best gyros in Detroit! The lamb is perfectly seasoned and the tzatziki sauce is incredible. Family-owned place with authentic flavors. Been coming here for years!",
                reviewerName="Marcus Johnson",
                createdAt="2025-11-20T09:15:00Z"
            ),
            ReviewBase(
                source="google",
                reviewId="mock_review_002",
                rating=5,
                text="Authentic Middle Eastern food that reminds me of home! The shawarma and hummus are phenomenal. Generous portions and reasonable prices. Highly recommend!",
                reviewerName="Ahmed Hassan",
                createdAt="2025-11-19T08:30:00Z"
            ),
            ReviewBase(
                source="google",
                reviewId="mock_review_003",
                rating=5,
                text="Hidden gem in Detroit! The grape leaves are the best I've ever had. Owner came by our table and made us feel like family. Great prices too. Will definitely be back!",
                reviewerName="Darius Brown",
                createdAt="2025-11-18T14:45:00Z"
            ),
            ReviewBase(
                source="google",
                reviewId="mock_review_004",
                rating=4,
                text="Solid Greek food. The spanakopita was amazing! Only complaint is parking can be tough during busy times.",
                reviewerName="Michael O'Brien",
                createdAt="2025-11-17T16:20:00Z"
            ),
            ReviewBase(
                source="google",
                reviewId="mock_review_005",
                rating=4,
                text="Good food and nice atmosphere. The falafel was a bit dry but everything else was delicious. Service could be faster but the staff is friendly.",
                reviewerName="Lisa Chen",
                createdAt="2025-11-16T07:45:00Z"
            ),
            # NEUTRAL REVIEWS
            ReviewBase(
                source="google",
                reviewId="mock_review_006",
                rating=3,
                text="Decent Mediterranean food but nothing extraordinary. Pricing is fair. The place could use some updating - looks a bit dated inside.",
                reviewerName="Sarah Thompson",
                createdAt="2025-11-15T11:30:00Z"
            ),
            # NEGATIVE REVIEWS
            ReviewBase(
                source="google",
                reviewId="mock_review_007",
                rating=2,
                text="Waited over 45 minutes for our order during lunch rush. Food was cold when we finally got it. Manager didn't seem to care when we complained. Very disappointing.",
                reviewerName="Jennifer Martinez",
                createdAt="2025-11-13T12:00:00Z"
            ),
            ReviewBase(
                source="google",
                reviewId="mock_review_008",
                rating=1,
                text="Found a hair in my food. When I told the staff, they were defensive and argumentative instead of apologetic. Absolutely unacceptable. Health department should know about this.",
                reviewerName="Robert Williams",
                createdAt="2025-11-12T10:20:00Z"
            )
        ]
        
        logger.info(f"Generated {len(mock_data)} mock reviews for Olympic Food")
        
        # Analyze each review individually using the review insights service
        logger.info(f"Analyzing {len(mock_data)} reviews with AI")
        analyses = []
        for review in mock_data:
            try:
                insights = await review_insights_service.analyze_review_insights(
                    comment=review.text,
                    rating=review.rating,
                    business_context="Family-owned Mediterranean restaurant serving authentic Greek and Middle Eastern cuisine"
                )
                
                # Convert ReviewInsightsResponse to ReviewAnalysis format
                analysis = ReviewAnalysis(
                    reviewId=review.reviewId,
                    sentiment=insights.sentiment,
                    severity=insights.severity,
                    themes=insights.themes,
                    suggestedReply=insights.recommendedPublicReply,
                    autoReplyOk=insights.autoReplyOK,
                    privateOutreachDraft=None
                )
                analyses.append(analysis)
                
            except Exception as e:
                logger.error(f"Failed to analyze review {review.reviewId}: {e}")
                continue
        
        # Store reviews in Convex
        logger.info(f"Storing {len(mock_data)} reviews in Convex")
        stored_count = await reviews_service.store_reviews_in_convex(
            request.business_id,
            mock_data,
            analyses
        )
        
        logger.info(f"Successfully processed and stored {stored_count} mock reviews")
        return PullReviewsResponse(
            message=f"Successfully imported {stored_count} mock reviews for Olympic Food",
            count=stored_count
        )
    except Exception as e:
        logger.error(f"Error generating mock reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate mock reviews: {str(e)}")
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