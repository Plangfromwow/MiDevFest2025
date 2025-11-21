import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// This migration removes the old businessId field from users
// Run this once to clean up the database
export const cleanupUserBusinessIds = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const users = await ctx.db.query("users").collect();
    let cleanedCount = 0;
    
    for (const user of users) {
      // Check if the user has the old businessId field
      if ("businessId" in user && user.businessId !== undefined) {
        // Remove the businessId field by patching with undefined
        await ctx.db.patch(user._id, {
          businessId: undefined,
        });
        cleanedCount++;
      }
    }
    
    return { success: true, cleanedCount };
  },
});
