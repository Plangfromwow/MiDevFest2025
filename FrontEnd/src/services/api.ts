/**
 * API service for calling Python backend endpoints
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Pull reviews from Google Business Profile via Python backend
 * Backend will handle fetching, analyzing, and storing in Convex
 * Convex will automatically update the UI when new reviews are added
 */
export async function pullGoogleReviews(businessId: string, sinceIso?: string): Promise<{ message: string; count: number }> {
  const response = await fetch(`${API_BASE_URL}/google/pull-reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_id: businessId,
      since_iso: sinceIso,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to pull reviews' }));
    throw new Error(error.detail || 'Failed to pull reviews');
  }

  return response.json();
}

/**
 * Post a reply to a Google review via Python backend
 */
export async function postReply(reviewId: string, approvedReply: string): Promise<{ status: string; reviewId: string }> {
  const response = await fetch(`${API_BASE_URL}/google/post-reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reviewId,
      approvedReply,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to post reply' }));
    throw new Error(error.detail || 'Failed to post reply');
  }

  return response.json();
}
