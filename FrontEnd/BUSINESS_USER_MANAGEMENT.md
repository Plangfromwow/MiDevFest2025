# Business User Management System

## Overview
The application now has a proper multi-user, multi-business system where users can be added to businesses and access their reviews and insights.

## Key Changes

### 1. Database Schema
- Removed the simple `businessId` string field from users table
- Now using the existing `businessMembers` table for proper user-business associations
- Each user can be a member of multiple businesses
- Each user has a role: `owner` or `member`

### 2. New Backend Functions (`convex/businesses.ts`)

#### Mutations:
- **`createBusiness`** - Create a new business and automatically add the creator as owner
- **`addUserToBusiness`** - Add a user to a business by email (only owners can do this)
- **`removeUserFromBusiness`** - Remove a user from a business (only owners, cannot remove last owner)

#### Queries:
- **`getUserBusinesses`** - Get all businesses the current user is a member of
- **`getBusiness`** - Get details of a specific business (if user has access)
- **`getBusinessMembers`** - Get all members of a business (if user has access)

### 3. Frontend Components

#### `BusinessSetup.tsx`
Replaces the old `BusinessIdSetup.tsx` with full business management:
- Create new businesses with name, description, and industry
- View all businesses the user belongs to
- Add users to businesses by email (for owners)
- Select which business to view in the dashboard

#### Updated Components:
- **`Dashboard`** - Now accepts `businessId` prop
- **`ReviewFeed`** - Filters reviews by businessId
- **`QueuePanel`** - Filters queues by businessId
- **`InsightStrip`** - Shows insights for selected business

### 4. User Flow

1. **New User**:
   - Signs in
   - Sees business setup screen
   - Can create a new business (becomes owner)
   - OR wait to be added to a business by an existing owner

2. **Existing User**:
   - Signs in
   - If member of only one business: automatically shown dashboard
   - If member of multiple businesses: shown business selector
   - Can switch between businesses or create new ones

3. **Business Owner**:
   - Can create businesses
   - Can add other users by their email address
   - Can assign roles (owner or member)
   - Can remove users (except cannot remove last owner)

### 5. How to Add a User to a Business

As a business owner:
1. Go to the Business Setup page
2. Find your business in the list
3. Click "Add User" button
4. Enter the user's email address (they must have an account)
5. Select their role (Owner or Member)
6. Click "Add User"

The new user will see the business in their list the next time they sign in.

## Migration Notes

- The old `businessId` field is temporarily kept in schema for backward compatibility
- A migration runs on first load to clean up any old `businessId` fields
- After migration completes, the field can be fully removed from schema

## API Reference

### Creating a Business
\`\`\`typescript
const businessId = await createBusiness({
  name: "My Restaurant",
  description: "Family-owned Italian restaurant",
  industry: "Restaurant"
});
\`\`\`

### Adding a User
\`\`\`typescript
await addUserToBusiness({
  businessId: "business-id-here",
  userEmail: "user@example.com",
  role: "member" // or "owner"
});
\`\`\`

### Getting User's Businesses
\`\`\`typescript
const businesses = useQuery(api.businesses.getUserBusinesses);
// Returns array of businesses with user's role
\`\`\`

## Security

- All queries verify user has access to the business before returning data
- Only business owners can add/remove members
- Users can only see reviews/insights for businesses they belong to
- Cannot remove the last owner from a business
