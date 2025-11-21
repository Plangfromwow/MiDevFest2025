import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function InsightStrip() {
  const insights = useQuery(api.reviews.getWeeklyInsights, {});

  if (!insights) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-1/4"></div>
          <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-1/4"></div>
          <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Weekly Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Complaint Themes */}
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Top Complaint Themes
            </h3>
            <div className="space-y-1">
              {insights.topComplaintThemes.slice(0, 3).map((theme, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {index + 1}. {theme.theme}
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {theme.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Risk Score */}
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Rating Risk Score
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getRiskColor(insights.ratingRiskScore)}`}>
                {insights.ratingRiskScore}
              </span>
              <span className="text-blue-700 dark:text-blue-300">/100</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  insights.ratingRiskScore >= 80 
                    ? 'bg-red-500' 
                    : insights.ratingRiskScore >= 60 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${insights.ratingRiskScore}%` }}
              ></div>
            </div>
          </div>

          {/* Improvement Suggestion */}
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Actionable Improvement
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              {insights.improvementSuggestion}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
          <div className="text-sm">
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {insights.totalReviews}
            </span>
            <span className="text-blue-700 dark:text-blue-300 ml-1">reviews this week</span>
          </div>
          <div className="text-sm">
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {insights.averageRating.toFixed(1)}★
            </span>
            <span className="text-blue-700 dark:text-blue-300 ml-1">average rating</span>
          </div>
        </div>
      </div>
    </div>
  );
}
