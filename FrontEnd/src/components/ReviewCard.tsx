import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Doc } from '../../convex/_generated/dataModel';

interface ReviewCardProps {
  review: Doc<'reviews'>;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState(review.triage.recommendedPublicReply);
  const markReplied = useMutation(api.reviews.markReviewReplied);

  const handleReply = () => {
    if (replyText.trim()) {
      void markReplied({
        reviewId: review._id,
        replyText: replyText.trim(),
      }).then(() => {
        setShowReplyForm(false);
      });
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'google': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'yelp': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'facebook': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        }`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(review.source)}`}>
            {review.source.toUpperCase()}
          </span>
          <div className="flex items-center gap-1">
            {renderStars(review.rating)}
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(review.date).toLocaleDateString()}
        </div>
      </div>

      {/* Author and Review Text */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {review.author}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {review.text}
        </p>
      </div>

      {/* AI Analysis */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">AI Analysis</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Sentiment:</span>
            <span className={`ml-2 font-medium capitalize ${getSentimentColor(review.triage.sentiment)}`}>
              {review.triage.sentiment}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Severity:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(review.triage.severity)}`}>
              {review.triage.severity.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto-Reply:</span>
            <span className={`ml-2 font-medium ${review.triage.autoReplyOK ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {review.triage.autoReplyOK ? 'OK' : 'Manual'}
            </span>
          </div>
        </div>

        {review.triage.themes.length > 0 && (
          <div className="mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Themes:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {review.triage.themes.map((theme, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {review.triage.escalationReason && (
          <div className="mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Escalation Reason:</span>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {review.triage.escalationReason}
            </p>
          </div>
        )}
      </div>

      {/* Reply Section */}
      {review.replied ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 dark:text-green-400 font-medium">✓ Replied</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {review.replyDate && new Date(review.replyDate).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {review.replyText}
          </p>
        </div>
      ) : (
        <div>
          {!showReplyForm ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowReplyForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Reply
              </button>
              {review.triage.severity === 'high' && (
                <span className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm font-medium">
                  Requires Owner Attention
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Public Reply
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  placeholder="Write your reply..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Send Reply
                </button>
                <button
                  onClick={() => setShowReplyForm(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
