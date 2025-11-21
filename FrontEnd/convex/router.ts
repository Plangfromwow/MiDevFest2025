import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// HTTP endpoints for Python backend to interact with Convex

// Store a single review from Python backend
http.route({
  path: "/store-review",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const reviewId = await ctx.runMutation(api.reviews.storeReview, {
        businessId: body.businessId as Id<"businesses">,
        source: body.source,
        author: body.author,
        rating: body.rating,
        text: body.text,
        date: body.date,
        images: body.images,
        triage: body.triage,
      });
      
      return new Response(JSON.stringify({ success: true, reviewId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Store weekly insights from Python backend
http.route({
  path: "/store-insights",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const insightId = await ctx.runMutation(api.reviews.storeWeeklyInsights, {
        businessId: body.businessId as Id<"businesses">,
        topComplaintThemes: body.topComplaintThemes,
        ratingRiskScore: body.ratingRiskScore,
        improvementSuggestion: body.improvementSuggestion,
        totalReviews: body.totalReviews,
        averageRating: body.averageRating,
      });
      
      return new Response(JSON.stringify({ success: true, insightId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Mark review as replied from Python backend
http.route({
  path: "/mark-review-replied",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      await ctx.runMutation(api.reviews.markReviewReplied, {
        reviewId: body.reviewId as Id<"reviews">,
        replyText: body.replyText,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Get reviews for a business (for Python backend)
http.route({
  path: "/get-reviews",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const reviews = await ctx.runQuery(api.reviews.getReviews, {
        businessId: body.businessId as Id<"businesses">,
        limit: body.limit,
      });
      
      return new Response(JSON.stringify({ success: true, reviews }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Get unreplied reviews by queue type
http.route({
  path: "/get-reviews-by-queue",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const reviews = await ctx.runQuery(api.reviews.getReviewsByQueue, {
        businessId: body.businessId as Id<"businesses">,
        queueType: body.queueType,
      });
      
      return new Response(JSON.stringify({ success: true, reviews }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Create or get business
http.route({
  path: "/create-business",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const businessId = await ctx.runMutation(api.businesses.createBusiness, {
        name: body.name,
        description: body.description,
        industry: body.industry,
        googlePlaceId: body.googlePlaceId,
        yelpBusinessId: body.yelpBusinessId,
        userId: body.userId as Id<"users"> | undefined,
      });
      
      return new Response(JSON.stringify({ success: true, businessId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Update business information
http.route({
  path: "/update-business",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      await ctx.runMutation(api.businesses.updateBusiness, {
        businessId: body.businessId as Id<"businesses">,
        name: body.name,
        description: body.description,
        industry: body.industry,
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        googlePlaceId: body.googlePlaceId,
        yelpBusinessId: body.yelpBusinessId,
        facebookPageId: body.facebookPageId,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Get business details
http.route({
  path: "/get-business",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const business = await ctx.runQuery(api.businesses.getBusiness, {
        businessId: body.businessId as Id<"businesses">,
      });
      
      return new Response(JSON.stringify({ success: true, business }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Get business members
http.route({
  path: "/get-business-members",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const members = await ctx.runQuery(api.businesses.getBusinessMembers, {
        businessId: body.businessId as Id<"businesses">,
      });
      
      return new Response(JSON.stringify({ success: true, members }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Get weekly insights
http.route({
  path: "/get-weekly-insights",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const insights = await ctx.runQuery(api.reviews.getWeeklyInsights, {
        businessId: body.businessId as Id<"businesses">,
      });
      
      return new Response(JSON.stringify({ success: true, insights }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Approve all auto-replies for a business
http.route({
  path: "/approve-all-auto-replies",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    try {
      const result = await ctx.runMutation(api.reviews.approveAllAutoReplies, {
        businessId: body.businessId as Id<"businesses">,
      });
      
      return new Response(JSON.stringify({ success: true, count: result.count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
