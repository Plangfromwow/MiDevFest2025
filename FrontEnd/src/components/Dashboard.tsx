import { useState } from 'react';
import { ReviewFeed } from './ReviewFeed';
import { QueuePanel } from './QueuePanel';
import { InsightStrip } from './InsightStrip';
import { ThemeToggle } from './ThemeToggle';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'auto-reply' | 'escalation'>('auto-reply');

  return (
    <div className="h-full flex flex-col">
      {/* Insights Strip */}
      <InsightStrip />
      
      {/* Main Dashboard */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        {/* Left Side - Review Feed */}
        <div className="flex-1 lg:w-2/3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Review Feed
            </h2>
            <ThemeToggle />
          </div>
          <ReviewFeed />
        </div>

        {/* Right Side - Action Panels */}
        <div className="lg:w-1/3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('auto-reply')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'auto-reply'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Auto-Reply Queue
              </button>
              <button
                onClick={() => setActiveTab('escalation')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'escalation'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Owner Escalations
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              <QueuePanel queueType={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
