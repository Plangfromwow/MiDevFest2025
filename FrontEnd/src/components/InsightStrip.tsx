import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { TrendingUp, AlertTriangle, Lightbulb, AlertCircle, BarChart3 } from 'lucide-react';

interface InsightStripProps {
  businessId: Id<"businesses">;
}

export function InsightStrip({ businessId }: InsightStripProps) {
  const insights = useQuery(api.reviews.getWeeklyInsights, { businessId });

  if (!insights) {
    return null;
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getRiskBg = (score: number) => {
    if (score >= 80) return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800';
    return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
  };

  const maxComplaintCount = Math.max(...insights.topComplaintThemes.map(t => t.count), 1);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Weekly Insights
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Based on {insights.totalReviews} reviews from the last 7 days
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Rating</span>
                <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{insights.averageRating.toFixed(1)}</span>
                    <span className="text-yellow-500">★</span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating Risk Score - Redesigned */}
          <div className={`rounded-xl p-6 border ${getRiskBg(insights.ratingRiskScore)} transition-all duration-300`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className={`w-5 h-5 ${getRiskColor(insights.ratingRiskScore)}`} />
                Risk Score
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                insights.ratingRiskScore >= 80 
                  ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800' 
                  : insights.ratingRiskScore >= 60 
                  ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' 
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}>
                {insights.ratingRiskScore >= 80 ? 'High Risk' : insights.ratingRiskScore >= 60 ? 'Medium Risk' : 'Low Risk'}
              </span>
            </div>
            
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                {insights.ratingRiskScore}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium mb-1.5">/ 100</span>
            </div>

            <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  insights.ratingRiskScore >= 80 ? 'bg-red-500' : insights.ratingRiskScore >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${insights.ratingRiskScore}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {insights.ratingRiskScore >= 60 
                ? "Attention needed. Recent reviews indicate potential issues." 
                : "Great job! Your risk score is low."}
            </p>
          </div>

          {/* Top Complaint Themes - Redesigned */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Top Complaints
            </h3>
            <div className="space-y-4">
              {insights.topComplaintThemes.slice(0, 3).map((theme, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">
                      {theme.theme}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {theme.count} mentions
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-orange-400 h-2 rounded-full transition-all duration-500 group-hover:bg-orange-500"
                      style={{ width: `${(theme.count / maxComplaintCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {insights.topComplaintThemes.length === 0 && (
                 <div className="text-center py-4 text-slate-500 text-sm">No complaints found</div>
              )}
            </div>
          </div>

          {/* Actionable Improvement - Redesigned */}
          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-6 border border-indigo-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lightbulb className="w-24 h-24 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2 relative z-10">
              <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Recommended Action
            </h3>
            <div className="relative z-10">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
                {insights.improvementSuggestion}
                </p>
                <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    View details <TrendingUp className="w-3 h-3" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
