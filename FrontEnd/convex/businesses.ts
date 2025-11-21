import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const createBusiness = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    googlePlaceId: v.optional(v.string()),
    yelpBusinessId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const businessId = await ctx.db.insert("businesses", {
      name: args.name,
      description: args.description,
      industry: args.industry,
      googlePlaceId: args.googlePlaceId,
      yelpBusinessId: args.yelpBusinessId,
      createdAt: now,
      updatedAt: now,
    });

    // Add the creator as an owner
    await ctx.db.insert("businessMembers", {
      businessId,
      userId,
      role: "owner",
      joinedAt: now,
    });

    return businessId;
  },
});

export const addUserToBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    userEmail: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the current user is an owner of this business
    const membership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", args.businessId).eq("userId", userId)
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only business owners can add members");
    }

    // Find the user to add by email
    const userToAdd = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .first();

    if (!userToAdd) {
      throw new Error("User not found with that email");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", args.businessId).eq("userId", userToAdd._id)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this business");
    }

    // Add the user to the business
    await ctx.db.insert("businessMembers", {
      businessId: args.businessId,
      userId: userToAdd._id,
      role: args.role,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

// Admin/testing mutation - no authentication required
// Use this from Convex dashboard to connect users to businesses
export const connectUserToBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", args.businessId).eq("userId", args.userId)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this business");
    }

    // Add the user to the business
    const membershipId = await ctx.db.insert("businessMembers", {
      businessId: args.businessId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });

    return { 
      success: true, 
      membershipId,
      message: `User ${args.userId} added to business ${args.businessId} as ${args.role}`
    };
  },
});

export const getUserBusinesses = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("businessMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const businesses = await Promise.all(
      memberships.map(async (membership) => {
        const business = await ctx.db.get(membership.businessId);
        if (!business) return null;
        return {
          ...business,
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      })
    );

    return businesses.filter((b): b is NonNullable<typeof b> => b !== null);
  },
});

export const getBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Verify user has access to this business
    const membership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", args.businessId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      return null;
    }

    return await ctx.db.get(args.businessId);
  },
});

export const getBusinessMembers = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Verify user has access to this business
    const membership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", args.businessId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("You don't have access to this business");
    }

    const memberships = await ctx.db
      .query("businessMembers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const membersWithUserData = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          membershipId: m._id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          email: user?.email,
          name: user?.name,
        };
      })
    );

    return membersWithUserData;
  },
});

export const removeUserFromBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    userIdToRemove: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the current user is an owner of this business
    const membership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", args.businessId).eq("userId", userId)
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only business owners can remove members");
    }

    // Find the membership to remove
    const membershipToRemove = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", args.businessId).eq("userId", args.userIdToRemove)
      )
      .first();

    if (!membershipToRemove) {
      throw new Error("User is not a member of this business");
    }

    // Don't allow removing the last owner
    if (membershipToRemove.role === "owner") {
      const owners = await ctx.db
        .query("businessMembers")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .filter((q) => q.eq(q.field("role"), "owner"))
        .collect();

      if (owners.length <= 1) {
        throw new Error("Cannot remove the last owner of the business");
      }
    }

    await ctx.db.delete(membershipToRemove._id);
    return { success: true };
  },
});

export const updateBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    googlePlaceId: v.optional(v.string()),
    yelpBusinessId: v.optional(v.string()),
    facebookPageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the current user is an owner of this business
    const membership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_user", (q) => 
        q.eq("businessId", args.businessId).eq("userId", userId)
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only business owners can update business information");
    }

    const { businessId, ...updateData } = args;
    
    await ctx.db.patch(businessId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
