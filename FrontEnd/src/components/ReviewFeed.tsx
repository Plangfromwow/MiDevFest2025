import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ReviewCard } from './ReviewCard';
import { Id } from '../../convex/_generated/dataModel';
import { Filter, X, ChevronDown } from 'lucide-react';

interface ReviewFeedProps {
  businessId: Id<"businesses">;
}

export function ReviewFeed({ businessId }: ReviewFeedProps) {
  const reviews = useQuery(api.reviews.getReviews, { businessId });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [showReplied, setShowReplied] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    
    return reviews.filter(review => {
      if (!showReplied && review.replied) {
        return false;
      }
      if (selectedSentiments.length > 0 && !selectedSentiments.includes(review.triage.sentiment)) {
        return false;
      }
      if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(review.source.toLowerCase())) {
        return false;
      }
      if (selectedStars.length > 0 && !selectedStars.includes(review.rating)) {
        return false;
      }
      return true;
    });
  }, [reviews, selectedSentiments, selectedPlatforms, selectedStars, showReplied]);

  const toggleFilter = <T extends string | number>(
    filterArray: T[], 
    value: T, 
    setter: (value: T[]) => void
  ) => {
    if (filterArray.includes(value)) {
      setter(filterArray.filter(v => v !== value));
    } else {
      setter([...filterArray, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedSentiments([]);
    setSelectedPlatforms([]);
    setSelectedStars([]);
  };

  const activeFilterCount = selectedSentiments.length + selectedPlatforms.length + selectedStars.length;

  if (!reviews) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Toggle and Summary - Only visible on mobile */}
      <div className="lg:hidden flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-4">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Clear all
            </button>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredReviews.length} of {reviews.length} reviews
          </span>
        </div>
      </div>

      {/* Desktop Summary Bar - Always visible on desktop */}
      <div className="hidden lg:flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Clear all
            </button>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredReviews.length} of {reviews.length} reviews
          </span>
        </div>
      </div>

      {/* Filter Panel */}
      <div ref={dropdownRef} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${showFilters ? 'block lg:block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Sentiment Filter */}
            <div className="relative">
              <label className="block font-medium text-gray-900 dark:text-white mb-2">
                Sentiment
              </label>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'sentiment' ? null : 'sentiment')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedSentiments.length === 0 
                    ? 'Select sentiment...' 
                    : `${selectedSentiments.length} selected`}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === 'sentiment' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'sentiment' && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  {['positive', 'negative', 'neutral'].map(sentiment => (
                    <label
                      key={sentiment}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSentiments.includes(sentiment)}
                        onChange={() => toggleFilter(selectedSentiments, sentiment, setSelectedSentiments)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{sentiment}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Filter */}
            <div className="relative">
              <label className="block font-medium text-gray-900 dark:text-white mb-2">
                Platform
              </label>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'platform' ? null : 'platform')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedPlatforms.length === 0 
                    ? 'Select platform...' 
                    : `${selectedPlatforms.length} selected`}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === 'platform' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'platform' && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  {['google', 'yelp', 'facebook'].map(platform => (
                    <label
                      key={platform}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform)}
                        onChange={() => toggleFilter(selectedPlatforms, platform, setSelectedPlatforms)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Star Rating Filter */}
            <div className="relative">
              <label className="block font-medium text-gray-900 dark:text-white mb-2">
                Star Rating
              </label>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'stars' ? null : 'stars')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedStars.length === 0 
                    ? 'Select rating...' 
                    : `${selectedStars.length} selected`}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === 'stars' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'stars' && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  {[5, 4, 3, 2, 1].map(stars => (
                    <label
                      key={stars}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStars.includes(stars)}
                        onChange={() => toggleFilter(selectedStars, stars, setSelectedStars)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        {stars} <span className="text-yellow-400">★</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Show Replied Reviews Checkbox */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showReplied}
                onChange={(e) => setShowReplied(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show replied reviews
              </span>
            </label>
          </div>
        </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSentiments.map(sentiment => (
            <button
              key={sentiment}
              onClick={() => toggleFilter(selectedSentiments, sentiment, setSelectedSentiments)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              <span className="capitalize">{sentiment}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
          {selectedPlatforms.map(platform => (
            <button
              key={platform}
              onClick={() => toggleFilter(selectedPlatforms, platform, setSelectedPlatforms)}
              className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
            >
              <span className="capitalize">{platform}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
          {selectedStars.map(stars => (
            <button
              key={stars}
              onClick={() => toggleFilter(selectedStars, stars, setSelectedStars)}
              className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm"
            >
              <span>{stars}★</span>
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {activeFilterCount > 0 ? 'No reviews match your filters' : 'No reviews found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
