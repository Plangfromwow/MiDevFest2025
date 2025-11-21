import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ReviewCard } from './ReviewCard';
import { Id } from '../../convex/_generated/dataModel';

interface QueuePanelProps {
  queueType: 'auto-reply' | 'escalation';
  businessId: Id<"businesses">;
}

export function QueuePanel({ queueType, businessId }: QueuePanelProps) {
  const reviews = useQuery(api.reviews.getReviewsByQueue, { queueType, businessId });

  if (!reviews) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const title = queueType === 'auto-reply' ? 'Auto-Reply Queue' : 'Owner Escalations';
  const description = queueType === 'auto-reply' 
    ? 'Reviews ready for automated responses'
    : 'High-severity reviews requiring owner attention';

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {title} ({reviews.length})
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {queueType === 'auto-reply' ? 'No reviews ready for auto-reply' : 'No escalations pending'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {reviews.map((review) => (
            <div key={review._id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
