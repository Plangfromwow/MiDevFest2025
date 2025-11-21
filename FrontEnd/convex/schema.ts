import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  reviews: defineTable({
    source: v.string(), // "google", "yelp", "facebook", etc.
    author: v.string(),
    rating: v.number(), // 1-5 stars
    text: v.string(),
    date: v.number(), // timestamp
    images: v.array(v.string()), // image URLs
    businessId: v.string(), // to support multiple businesses
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
    replied: v.optional(v.boolean()),
    replyText: v.optional(v.string()),
    replyDate: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_date", ["date"])
    .index("by_severity", ["triage.severity"])
    .searchIndex("search_content", {
      searchField: "text",
      filterFields: ["businessId", "source"],
    }),

  insights: defineTable({
    businessId: v.string(),
    weekStart: v.number(), // timestamp for start of week
    topComplaintThemes: v.array(v.object({
      theme: v.string(),
      count: v.number(),
    })),
    ratingRiskScore: v.number(), // 0-100
    improvementSuggestion: v.string(),
    totalReviews: v.number(),
    averageRating: v.number(),
  }).index("by_business_week", ["businessId", "weekStart"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
