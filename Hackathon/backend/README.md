# Review Radar - FastAPI Backend

FastAPI backend service for the Review Radar app that integrates Google Business Profile Reviews, IBM watsonx.ai, and Convex database.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your actual credentials (see Configuration section)
```

### 3. Run the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python directly
python -m app.main
```

The API will be available at: `http://localhost:8000`
API documentation at: `http://localhost:8000/docs`

## Configuration

### Required Environment Variables

#### Convex
- `CONVEX_URL`: Your Convex deployment URL (e.g., `https://your-app.convex.cloud`)
- `CONVEX_ADMIN_KEY`: Convex admin key for server-side operations

#### Google Business Profile
- `GOOGLE_CLIENT_ID`: OAuth 2.0 client ID
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 client secret  
- `GOOGLE_REFRESH_TOKEN`: OAuth 2.0 refresh token
- `GOOGLE_LOCATION_ID`: Google Business location ID (format: `accounts/{accountId}/locations/{locationId}`)
- `GOOGLE_ACCOUNT_ID`: Google Business account ID (optional)

#### IBM watsonx.ai
- `WATSONX_API_KEY`: IBM Cloud API key
- `WATSONX_PROJECT_ID`: watsonx.ai project ID
- `WATSONX_URL`: watsonx.ai service URL (default: `https://us-south.ml.cloud.ibm.com`)
- `WATSONX_MODEL_ID`: Model ID (default: `ibm/granite-13b-chat-v2`)
- `WATSONX_DEPLOYMENT_ID`: Optional deployment ID if using deployed model

## API Endpoints

### 1. Pull Reviews from Google
```http
POST /google/pull-reviews
Content-Type: application/json

{
  "since_iso": "2025-11-01T00:00:00Z"  // optional
}
```

### 2. Analyze Reviews with AI
```http
POST /ai/analyze-reviews
Content-Type: application/json

{
  "reviews": [
    {
      "reviewId": "review_123",
      "rating": 4,
      "text": "Great service!",
      "reviewerName": "John Doe",
      "createdAt": "2025-11-21T10:00:00Z"
    }
  ]
}
```

### 3. Post Reply to Review
```http
POST /google/post-reply
Content-Type: application/json

{
  "reviewId": "review_123",
  "approvedReply": "Thank you for your feedback!"
}
```

### 4. Generate Weekly Insights
```http
POST /ai/weekly-insights
Content-Type: application/json

{
  "businessId": "business_123",
  "days": 7
}
```

## Convex Integration

### How Convex Actions Should Call This API

Your Convex Actions should call these endpoints over HTTP:

```typescript
// Example Convex Action
export const pullAndAnalyzeReviews = action({
  args: { businessId: v.string() },
  handler: async (ctx, args) => {
    const FASTAPI_URL = process.env.FASTAPI_URL; // "http://localhost:8000"
    
    // 1. Pull reviews from Google
    const pullResponse = await fetch(`${FASTAPI_URL}/google/pull-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ since_iso: "2025-11-01T00:00:00Z" })
    });
    const { reviews } = await pullResponse.json();
    
    // 2. Analyze reviews
    const analyzeResponse = await fetch(`${FASTAPI_URL}/ai/analyze-reviews`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviews })
    });
    const { analysis } = await analyzeResponse.json();
    
    // 3. Store in Convex
    for (const review of reviews) {
      await ctx.runMutation(internal.reviews.store, review);
    }
    for (const result of analysis) {
      await ctx.runMutation(internal.analysis.store, result);
    }
    
    return { reviewCount: reviews.length, analysisCount: analysis.length };
  },
});
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application and endpoints
│   ├── config.py            # Configuration management
│   ├── schemas.py           # Pydantic models
│   ├── google_client.py     # Google Business Profile API client
│   ├── watsonx_client.py    # IBM watsonx.ai client
│   ├── convex_client.py     # Convex database client
│   └── services/
│       ├── reviews_service.py   # Review operations
│       └── insights_service.py  # AI insights generation
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md              # This file
```

## Development

### Code Quality
```bash
# Format code
black app/
isort app/

# Type checking
mypy app/

# Run tests
pytest
```

### Health Check
```bash
curl http://localhost:8000/health
```

## Troubleshooting

### Common Issues

1. **Google API Authentication**: Ensure your OAuth tokens are valid and have the necessary scopes
2. **watsonx.ai Connection**: Verify your API key and project ID are correct
3. **Convex Connection**: Check your Convex URL and admin key
4. **Missing Dependencies**: Run `pip install -r requirements.txt`

### Logs
The API uses structured logging. Check console output for detailed error messages.

### API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation with Swagger UI.

## Deployment Notes

- For production, use a proper ASGI server like Gunicorn with Uvicorn workers
- Set appropriate CORS origins in `main.py` 
- Use environment variables for all secrets
- Consider rate limiting for external API calls
- Monitor API quotas for Google and IBM services