import React from "react";
import type { Category } from "../../types";

interface CategoryUsageProps {
  categories: Category[];
  stats: {
    categories: {
      mostUsed: { name: string };
    };
  };
}

export const CategoryUsage: React.FC<CategoryUsageProps> = ({ categories, stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Category Usage</h3>
        <div className="bg-purple-500 rounded-full p-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
      </div>
      <div className="space-y-3">
        {categories.slice(0, 4).map(category => (
          <div key={category.id} className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{category.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${((category.usage_count || 0) / 15) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category.usage_count || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Most Used:</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {stats.categories.mostUsed.name}
          </span>
        </div>
      </div>
    </div>
  );
};
