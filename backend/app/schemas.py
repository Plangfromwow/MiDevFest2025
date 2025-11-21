from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime


# Review Models
class ReviewBase(BaseModel):
    """Base review model"""
    source: str = Field(..., description="Review source (e.g., 'google')")
    reviewId: str = Field(..., description="Unique review identifier")
    rating: int = Field(..., ge=1, le=5, description="Star rating 1-5")
    text: str = Field(..., description="Review text content")
    reviewerName: str = Field(..., description="Name of the reviewer")
    createdAt: str = Field(..., description="ISO timestamp of review creation")


class ReviewAnalysis(BaseModel):
    """AI analysis results for a review"""
    reviewId: str = Field(..., description="Review identifier")
    sentiment: str = Field(..., pattern="^(positive|neutral|negative)$", description="Overall sentiment")
    severity: str = Field(..., pattern="^(low|medium|high)$", description="Severity level")
    themes: List[str] = Field(..., min_items=1, description="Key themes identified")
    suggestedReply: str = Field(..., description="Suggested public reply")
    autoReplyOk: bool = Field(..., description="Whether auto-reply is recommended")
    privateOutreachDraft: Optional[str] = Field(None, description="Draft for private outreach if severity is high")


class WeeklyInsights(BaseModel):
    """Weekly insights generated from review analysis"""
    topThemes: List[str] = Field(..., min_items=1, max_items=5, description="Top themes from reviews")
    riskScore: int = Field(..., ge=0, le=100, description="Reputation risk score 0-100")
    quickFix: str = Field(..., description="Actionable recommendation 1-2 sentences")


# Request Models
class PullReviewsRequest(BaseModel):
    """Request to pull reviews from Google"""
    since_iso: Optional[str] = Field(None, description="ISO timestamp to fetch reviews since")


class AnalyzeReviewsRequest(BaseModel):
    """Request to analyze reviews with AI"""
    reviews: List[ReviewBase] = Field(..., min_items=1, description="List of reviews to analyze")


class PostReplyRequest(BaseModel):
    """Request to post a reply to a review"""
    reviewId: str = Field(..., description="Review identifier")
    approvedReply: str = Field(..., min_length=1, description="Approved reply text to post")


class WeeklyInsightsRequest(BaseModel):
    """Request to generate weekly insights"""
    businessId: str = Field(..., description="Business identifier")
    days: int = Field(7, ge=1, le=30, description="Number of days to analyze")
    reviews: Optional[List[ReviewBase]] = Field(None, description="Optional reviews data if not fetching from Convex")


class ReviewInsightsRequest(BaseModel):
    """Request to analyze a single review and generate insights"""
    comment: str = Field(..., description="Review text content")
    rating: int = Field(..., ge=1, le=5, description="Star rating 1-5")
    businessContext: Optional[str] = Field(None, description="Optional business context for better analysis")


# Response Models
class PullReviewsResponse(BaseModel):
    """Response from pulling reviews"""
    reviews: List[ReviewBase] = Field(..., description="List of normalized reviews")


class AnalyzeReviewsResponse(BaseModel):
    """Response from analyzing reviews"""
    analysis: List[ReviewAnalysis] = Field(..., description="List of review analyses")


class PostReplyResponse(BaseModel):
    """Response from posting a reply"""
    status: str = Field(..., description="Status of the reply posting")
    reviewId: str = Field(..., description="Review identifier")


class WeeklyInsightsResponse(BaseModel):
    """Response with weekly insights"""
    businessId: str = Field(..., description="Business identifier")
    insights: WeeklyInsights = Field(..., description="Generated insights")


class ReviewInsightsResponse(BaseModel):
    """Response with review insights analysis"""
    autoReplyOK: bool = Field(..., description="Whether auto-reply is recommended")
    recommendedPublicReply: str = Field(..., description="Suggested public reply text")
    sentiment: str = Field(..., pattern="^(positive|neutral|negative)$", description="Sentiment analysis result")
    severity: str = Field(..., pattern="^(low|medium|high)$", description="Issue severity level")
    themes: List[str] = Field(..., description="Key themes identified from the review")


# Error Models
class ErrorDetail(BaseModel):
    """Error detail model"""
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
    details: Optional[dict] = Field(None, description="Additional error details")


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: ErrorDetail = Field(..., description="Error information")


# Internal Models (used by services)
class GoogleReviewRaw(BaseModel):
    """Raw Google review data structure"""
    name: str
    starRating: str
    comment: Optional[str] = ""
    createTime: str
    reviewer: dict


class WatsonxPromptRequest(BaseModel):
    """Request structure for watsonx prompts"""
    prompt: str = Field(..., description="The prompt text")
    max_tokens: int = Field(1000, description="Maximum tokens to generate")
    temperature: float = Field(0.1, description="Temperature for generation")


class ConvexQueryRequest(BaseModel):
    """Request structure for Convex queries"""
    query: str = Field(..., description="Query function name")
    args: dict = Field(..., description="Query arguments")


# Configuration Models
class BusinessConfig(BaseModel):
    """Business configuration model"""
    businessId: str
    name: str
    googleLocationId: str
    autoReplyEnabled: bool = False
    replyTemplates: Optional[List[str]] = None
    notificationEmails: Optional[List[str]] = None


# Health Check Models
class HealthCheck(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    version: Optional[str] = Field(None, description="API version")


# Validation Models
class ReviewValidation(BaseModel):
    """Model for validating review data"""
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class AnalysisValidation(BaseModel):
    """Model for validating analysis data"""
    is_valid: bool
    missing_fields: List[str] = Field(default_factory=list)
    invalid_values: List[str] = Field(default_factory=list)