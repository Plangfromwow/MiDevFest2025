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

    // Create or get Olympic Food Detroit
    const existingBusiness = await ctx.db
      .query("businesses")
      .filter((q) => q.eq(q.field("name"), "Olympic Food"))
      .first();
    
    const businessId = existingBusiness?._id ?? await ctx.db.insert("businesses", {
      name: "Olympic Food",
      description: "Family-owned Mediterranean restaurant serving authentic Greek and Middle Eastern cuisine in the heart of Detroit",
      industry: "Restaurant - Mediterranean",
      address: "15606 W McNichols Rd, Detroit, MI 48235",
      phone: "(313) 272-7711",
      email: "info@olympicfooddetroit.com",
      website: "https://olympicfooddetroit.com",
      googlePlaceId: "ChIJOlympicDetroit",
      yelpBusinessId: "olympic-food-detroit",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Mock reviews data for Olympic Food
    const mockReviews = [
      {
        source: "google",
        author: "Marcus Johnson",
        rating: 5,
        text: "Best gyros in Detroit! The lamb is perfectly seasoned and the tzatziki sauce is incredible. Family-owned place with authentic flavors. Been coming here for years!",
        date: now - oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "positive" as const,
          severity: "low" as const,
          themes: ["excellent food", "authentic cuisine", "gyros", "family-owned"],
          recommendedPublicReply: "Thank you so much Marcus! We're honored to have been serving you for years. Your loyalty means everything to our family!",
          autoReplyOK: true,
        }
      },
      {
        source: "google",
        author: "Jennifer Martinez",
        rating: 2,
        text: "Waited over 45 minutes for our order during lunch rush. Food was cold when we finally got it. Manager didn't seem to care when we complained. Very disappointing.",
        date: now - 2 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "negative" as const,
          severity: "high" as const,
          themes: ["long wait time", "cold food", "poor management response", "lunch service issues"],
          recommendedPublicReply: "We sincerely apologize for the long wait and cold food, Jennifer. This is not the experience we want to provide. Please contact us directly so we can make this right.",
          autoReplyOK: false,
          escalationReason: "Service failure with management response issues during peak hours",
          suggestedOwnerAction: "Review lunch rush staffing levels and kitchen workflow. Address manager's handling of complaints.",
          suggestedPrivateOutreach: "Personal call with apology and complimentary meal offer"
        }
      },
      {
        source: "yelp",
        author: "Ahmed Hassan",
        rating: 5,
        text: "Authentic Middle Eastern food that reminds me of home! The shawarma and hummus are phenomenal. Generous portions and reasonable prices. Highly recommend!",
        date: now - 3 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "positive" as const,
          severity: "low" as const,
          themes: ["authentic food", "shawarma", "hummus", "good value", "generous portions"],
          recommendedPublicReply: "Thank you Ahmed! We're so happy our food brings you memories of home. That's exactly what we strive for with our authentic recipes!",
          autoReplyOK: true,
        }
      },
      {
        source: "google",
        author: "Robert Williams",
        rating: 1,
        text: "Found a hair in my food. When I told the staff, they were defensive and argumentative instead of apologetic. Absolutely unacceptable. Health department should know about this.",
        date: now - 4 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "negative" as const,
          severity: "high" as const,
          themes: ["food safety", "hygiene issues", "defensive staff", "poor complaint handling"],
          recommendedPublicReply: "We are deeply sorry for this unacceptable situation, Robert. Food safety is our top priority and we take this very seriously. Please contact us immediately so we can address this properly.",
          autoReplyOK: false,
          escalationReason: "Food safety complaint with poor staff response - potential health code violation",
          suggestedOwnerAction: "Immediate staff retraining on food safety and customer complaint handling. Review kitchen hygiene protocols.",
          suggestedPrivateOutreach: "Owner should call personally to apologize and explain corrective actions taken"
        }
      },
      {
        source: "facebook",
        author: "Lisa Chen",
        rating: 4,
        text: "Good food and nice atmosphere. The falafel was a bit dry but everything else was delicious. Service could be faster but the staff is friendly.",
        date: now - 5 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "positive" as const,
          severity: "low" as const,
          themes: ["good food", "nice atmosphere", "falafel quality", "slow service", "friendly staff"],
          recommendedPublicReply: "Thank you for the feedback, Lisa! We appreciate your comments about the falafel and service speed - we'll work on improving both. So glad you enjoyed everything else!",
          autoReplyOK: true,
        }
      },
      {
        source: "google",
        author: "Darius Brown",
        rating: 5,
        text: "Hidden gem in Detroit! The grape leaves are the best I've ever had. Owner came by our table and made us feel like family. Great prices too. Will definitely be back!",
        date: now - 6 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "positive" as const,
          severity: "low" as const,
          themes: ["excellent food", "grape leaves", "family atmosphere", "good value", "owner interaction"],
          recommendedPublicReply: "Thank you Darius! We love meeting our guests and making everyone feel like family. Can't wait to see you again soon!",
          autoReplyOK: true,
        }
      },
      {
        source: "yelp",
        author: "Sarah Thompson",
        rating: 3,
        text: "Decent Mediterranean food but nothing extraordinary. Pricing is fair. The place could use some updating - looks a bit dated inside.",
        date: now - 7 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "neutral" as const,
          severity: "medium" as const,
          themes: ["average food", "fair pricing", "dated decor", "needs renovation"],
          recommendedPublicReply: "Thanks for your honest feedback, Sarah! We appreciate your comments about our space and are always looking for ways to improve the dining experience.",
          autoReplyOK: true,
        }
      },
      {
        source: "google",
        author: "Michael O'Brien",
        rating: 4,
        text: "Solid Greek food. The spanakopita was amazing! Only complaint is parking can be tough during busy times.",
        date: now - 8 * oneDay,
        images: [],
        businessId,
        triage: {
          sentiment: "positive" as const,
          severity: "low" as const,
          themes: ["good food", "spanakopita", "parking issues"],
          recommendedPublicReply: "Thanks Michael! So glad you loved the spanakopita - it's one of our specialties. We understand the parking challenge and appreciate your patience!",
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
        { theme: "food safety/hygiene", count: 1 },
        { theme: "long wait time", count: 2 },
        { theme: "service issues", count: 2 },
        { theme: "dated decor", count: 1 }
      ],
      ratingRiskScore: 65,
      improvementSuggestion: "Priority: Address food safety concerns immediately with staff retraining. Improve lunch rush service speed and kitchen workflow. Consider minor interior updates to freshen the space.",
      totalReviews: 8,
      averageRating: 3.6,
    });

    return { success: true, reviewsCreated: mockReviews.length, businessId };
  },
});

export const linkUserToBusiness = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    role: v.optional(v.union(v.literal("owner"), v.literal("member"))),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId?.subject) {
      throw new Error("Not authenticated");
    }

    // Get the user from the users table
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get businessId - use provided one or find Olympic Food
    let businessId = args.businessId;
    if (!businessId) {
      const business = await ctx.db
        .query("businesses")
        .filter((q) => q.eq(q.field("name"), "Olympic Food"))
        .first();
      if (!business) {
        throw new Error("Olympic Food business not found. Run seedMockData first.");
      }
      businessId = business._id;
    }

    // Check if already linked
    const existingLink = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", businessId).eq("userId", user._id)
      )
      .first();

    if (existingLink) {
      return { success: true, message: "User already linked to business", businessMemberId: existingLink._id };
    }

    // Create the link
    const businessMemberId = await ctx.db.insert("businessMembers", {
      businessId,
      userId: user._id,
      role: args.role || "owner",
      joinedAt: Date.now(),
    });

    return { success: true, message: "User linked to business", businessMemberId };
  },
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
