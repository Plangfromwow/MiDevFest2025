import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getReviews = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get businessId from args or user's first business
    let businessId = args.businessId;
    if (!businessId) {
      const userBusiness = await ctx.db
        .query("businessMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (!userBusiness) {
        return [];
      }
      businessId = userBusiness.businessId;
    }

    const limit = args.limit || 50;

    return await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get businessId from args or user's first business
    let businessId = args.businessId;
    if (!businessId) {
      const userBusiness = await ctx.db
        .query("businessMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (!userBusiness) {
        return [];
      }
      businessId = userBusiness.businessId;
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get businessId from args or user's first business
    let businessId = args.businessId;
    if (!businessId) {
      const userBusiness = await ctx.db
        .query("businessMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (!userBusiness) {
        return null;
      }
      businessId = userBusiness.businessId;
    }

    const weekStart = getWeekStart(new Date());

    return await ctx.db
      .query("insights")
      .withIndex("by_business_week", (q) => 
        q.eq("businessId", businessId).eq("weekStart", weekStart.getTime())
      )
      .first();
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
