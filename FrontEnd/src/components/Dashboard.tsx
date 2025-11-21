import { useState } from 'react';
import { ReviewFeed } from './ReviewFeed';
import { QueuePanel } from './QueuePanel';
import { InsightStrip } from './InsightStrip';
import { Id } from '../../convex/_generated/dataModel';
import { pullGoogleReviews } from '../services/api';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

interface DashboardProps {
  businessId: Id<"businesses">;
}

export function Dashboard({ businessId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'auto-reply' | 'escalation'>('auto-reply');
  const [isPulling, setIsPulling] = useState(false);

  const handlePullReviews = async () => {
    setIsPulling(true);
    try {
      toast.info('Fetching and analyzing reviews from Google...');
      
      // Backend will handle: fetch from Google -> analyze with AI -> store in Convex
      // Convex will automatically update our UI when new reviews are added
      const result = await pullGoogleReviews(businessId);
      
      if (result.count === 0) {
        toast.info('No new reviews found');
      } else {
        toast.success(`Successfully imported ${result.count} reviews!`);
      }
      
    } catch (error: any) {
      console.error('Error pulling reviews:', error);
      toast.error(error.message || 'Failed to pull reviews');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Insights Strip */}
      <InsightStrip businessId={businessId} />
      
      {/* Main Dashboard */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        {/* Left Side - Review Feed */}
        <div className="flex-1 lg:w-2/3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Review Feed
            </h2>
            <button
              onClick={() => void handlePullReviews()}
              disabled={isPulling}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
              {isPulling ? 'Pulling Reviews...' : 'Pull Google Reviews'}
            </button>
          </div>
          <ReviewFeed businessId={businessId} />
        </div>

        {/* Right Side - Action Panels */}
        <div className="lg:w-1/3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('auto-reply')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'auto-reply'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Auto-Reply Queue
              </button>
              <button
                onClick={() => setActiveTab('escalation')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'escalation'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Owner Escalations
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              <QueuePanel queueType={activeTab} businessId={businessId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
