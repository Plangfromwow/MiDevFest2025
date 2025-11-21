import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getReviews = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Auth check removed for POC - allow Python backend to query
    // Still check if businessId is required
    if (!args.businessId) {
      // For POC, just return empty if no businessId provided
      return [];
    }

    const limit = args.limit || 50;

    return await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(limit);
  },
});

export const getReviewsByQueue = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    queueType: v.union(v.literal("auto-reply"), v.literal("escalation")),
  },
  handler: async (ctx, args) => {
    // Auth check removed for POC - allow Python backend to query
    if (!args.businessId) {
      return [];
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.eq(q.field("replied"), undefined))
      .collect();

    if (args.queueType === "auto-reply") {
      return reviews.filter(r => 
        r.triage.autoReplyOK && 
        (r.triage.severity === "low" || r.triage.severity === "medium")
      );
    } else {
      return reviews.filter(r => r.triage.severity === "high");
    }
  },
});

export const markReviewReplied = mutation({
  args: {
    reviewId: v.id("reviews"),
    replyText: v.string(),
  },
  handler: async (ctx, args) => {
    // Auth check removed for POC - Python backend doesn't have auth
    await ctx.db.patch(args.reviewId, {
      replied: true,
      replyText: args.replyText,
      replyDate: Date.now(),
    });
  },
});

export const approveAllAutoReplies = mutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Auth check removed for POC - Python backend doesn't have auth
    // Get all unreplied reviews that are ready for auto-reply
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("replied"), undefined))
      .collect();

    const autoReplyReviews = reviews.filter(r => 
      r.triage.autoReplyOK && 
      (r.triage.severity === "low" || r.triage.severity === "medium")
    );

    // Mark all as replied with their recommended replies
    for (const review of autoReplyReviews) {
      await ctx.db.patch(review._id, {
        replied: true,
        replyText: review.triage.recommendedPublicReply,
        replyDate: Date.now(),
      });
    }

    return { count: autoReplyReviews.length };
  },
});

export const getWeeklyInsights = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    // Auth check removed for POC - allow Python backend to query
    if (!args.businessId) {
      return null;
    }

    const weekStart = getWeekStart(new Date());

    return await ctx.db
      .query("insights")
      .withIndex("by_business_week", (q) => 
        q.eq("businessId", args.businessId!).eq("weekStart", weekStart.getTime())
      )
      .first();
  },
});

// Mutation for Python backend to store reviews
export const storeReview = mutation({
  args: {
    businessId: v.id("businesses"),
    source: v.string(),
    author: v.string(),
    rating: v.number(),
    text: v.string(),
    date: v.number(),
    images: v.optional(v.array(v.string())),
    triage: v.object({
      sentiment: v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative")),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      themes: v.array(v.string()),
      recommendedPublicReply: v.string(),
      autoReplyOK: v.boolean(),
      escalationReason: v.optional(v.string()),
      suggestedOwnerAction: v.optional(v.string()),
      suggestedPrivateOutreach: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Auth check removed for POC - Python backend doesn't have auth
    const reviewId = await ctx.db.insert("reviews", {
      businessId: args.businessId,
      source: args.source,
      author: args.author,
      rating: args.rating,
      text: args.text,
      date: args.date,
      images: args.images || [],
      triage: args.triage,
    });
    return reviewId;
  },
});

// Mutation for Python backend to store weekly insights
export const storeWeeklyInsights = mutation({
  args: {
    businessId: v.id("businesses"),
    topComplaintThemes: v.array(v.object({
      theme: v.string(),
      count: v.number(),
    })),
    ratingRiskScore: v.number(),
    improvementSuggestion: v.string(),
    totalReviews: v.number(),
    averageRating: v.number(),
  },
  handler: async (ctx, args) => {
    // Auth check removed for POC - Python backend doesn't have auth
    const weekStart = getWeekStart(new Date());
    
    // Check if insights already exist for this week
    const existing = await ctx.db
      .query("insights")
      .withIndex("by_business_week", (q) => 
        q.eq("businessId", args.businessId).eq("weekStart", weekStart.getTime())
      )
      .first();
    
    if (existing) {
      // Update existing insights
      await ctx.db.patch(existing._id, {
        topComplaintThemes: args.topComplaintThemes,
        ratingRiskScore: args.ratingRiskScore,
        improvementSuggestion: args.improvementSuggestion,
        totalReviews: args.totalReviews,
        averageRating: args.averageRating,
      });
      return existing._id;
    } else {
      // Create new insights
      const insightId = await ctx.db.insert("insights", {
        businessId: args.businessId,
        weekStart: weekStart.getTime(),
        topComplaintThemes: args.topComplaintThemes,
        ratingRiskScore: args.ratingRiskScore,
        improvementSuggestion: args.improvementSuggestion,
        totalReviews: args.totalReviews,
        averageRating: args.averageRating,
      });
      return insightId;
    }
  },
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  return d;
}
