import { useState } from 'react';
import { ReviewFeed } from './ReviewFeed';
import { QueuePanel } from './QueuePanel';
import { InsightStrip } from './InsightStrip';
import { ThemeToggle } from './ThemeToggle';
import { Id } from '../../convex/_generated/dataModel';

interface DashboardProps {
  businessId: Id<"businesses">;
}

export function Dashboard({ businessId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'auto-reply' | 'escalation'>('auto-reply');

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
            <ThemeToggle />
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
