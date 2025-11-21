import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedMockData = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data
    const existingReviews = await ctx.db.query("reviews").collect();
    for (const review of existingReviews) {
      await ctx.db.delete(review._id);
    }

    const existingInsights = await ctx.db.query("insights").collect();
    for (const insight of existingInsights) {
      await ctx.db.delete(insight._id);
    }

    const businessId = "default-business";
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Mock reviews data
    const mockReviews = [
      {
        source: "google",
        author: "Sarah Johnson",
        rating: 5,
        text: "Absolutely fantastic service! The team went above and beyond to help me. Highly recommend!",
        date: now - oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "positive" as const,
          severity: "low" as const,
          themes: ["excellent service", "helpful staff"],
          recommendedPublicReply: "Thank you so much for your wonderful review, Sarah! We're thrilled to hear about your positive experience with our team.",
          autoReplyOK: true,
        }
      },
      {
        source: "google",
        author: "Mike Chen",
        rating: 2,
        text: "Very disappointed with the late delivery. Ordered 3 days ago and still waiting. Customer service was unhelpful when I called.",
        date: now - 2 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "negative" as const,
          severity: "high" as const,
          themes: ["late delivery", "poor customer service"],
          recommendedPublicReply: "We sincerely apologize for the delay and poor service experience, Mike. Please contact us directly so we can resolve this immediately.",
          autoReplyOK: false,
          escalationReason: "Service failure with delivery delay",
          suggestedOwnerAction: "Review delivery process and customer service training",
          suggestedPrivateOutreach: "Call customer directly to resolve and offer compensation"
        }
      },
      {
        source: "yelp",
        author: "Emma Rodriguez",
        rating: 4,
        text: "Good overall experience. The product quality is great but the packaging could be improved. Would order again.",
        date: now - 3 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "positive" as const,
          severity: "low" as const,
          themes: ["good quality", "packaging issues"],
          recommendedPublicReply: "Thank you for the feedback, Emma! We're glad you enjoyed the product quality and we'll definitely look into improving our packaging.",
          autoReplyOK: true,
        }
      },
      {
        source: "google",
        author: "David Park",
        rating: 1,
        text: "Terrible experience. Staff was rude and dismissive. The manager didn't seem to care about my concerns. Will not be returning.",
        date: now - 4 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "negative" as const,
          severity: "high" as const,
          themes: ["rude staff", "poor management", "customer service"],
          recommendedPublicReply: "We are deeply sorry for this unacceptable experience, David. This does not reflect our values and we would like to make this right.",
          autoReplyOK: false,
          escalationReason: "Staff behavior complaint requiring immediate attention",
          suggestedOwnerAction: "Investigate staff behavior and provide additional training",
          suggestedPrivateOutreach: "Personal apology call and service recovery"
        }
      },
      {
        source: "facebook",
        author: "Lisa Thompson",
        rating: 3,
        text: "Average service. Nothing special but nothing terrible either. The wait time was a bit long.",
        date: now - 5 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "neutral" as const,
          severity: "medium" as const,
          themes: ["wait time", "average service"],
          recommendedPublicReply: "Thank you for your honest feedback, Lisa. We're working on reducing wait times to improve the experience for all our customers.",
          autoReplyOK: true,
        }
      },
      {
        source: "google",
        author: "James Wilson",
        rating: 5,
        text: "Outstanding! Best customer service I've experienced in years. The team really knows their stuff and made great recommendations.",
        date: now - 6 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "positive" as const,
          severity: "low" as const,
          themes: ["excellent service", "knowledgeable staff", "great recommendations"],
          recommendedPublicReply: "Wow, thank you James! We're so happy to hear about your outstanding experience. Our team will be thrilled to read this!",
          autoReplyOK: true,
        }
      }
    ];

    // Insert mock reviews
    for (const review of mockReviews) {
      await ctx.db.insert("reviews", review);
    }

    // Insert weekly insights
    const weekStart = getWeekStart(new Date()).getTime();
    await ctx.db.insert("insights", {
      businessId,
      weekStart,
      topComplaintThemes: [
        { theme: "late delivery", count: 3 },
        { theme: "customer service", count: 2 },
        { theme: "wait time", count: 2 }
      ],
      ratingRiskScore: 72,
      improvementSuggestion: "Focus on delivery reliability and customer service training to reduce negative feedback",
      totalReviews: 6,
      averageRating: 3.3,
    });

    return { success: true, reviewsCreated: mockReviews.length };
  },
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
