import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ReviewCard } from './ReviewCard';

export function ReviewFeed() {
  const reviews = useQuery(api.reviews.getReviews, {});

  if (!reviews) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No reviews found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review._id} review={review} />
      ))}
    </div>
  );
}
