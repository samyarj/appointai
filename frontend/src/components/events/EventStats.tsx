import React from "react";

interface EventStatsProps {
  stats: {
    total: number;
    upcoming: number;
    past: number;
    thisMonth: number;
  };
}

export const EventStats: React.FC<EventStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
          Total
        </h3>
        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          {stats.total}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">Events</p>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-green-800 dark:text-green-300 text-sm">
          Upcoming
        </h3>
        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
          {stats.upcoming}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400">
          Scheduled
        </p>
      </div>
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-purple-800 dark:text-purple-300 text-sm">
          Past
        </h3>
        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
          {stats.past}
        </p>
        <p className="text-xs text-purple-600 dark:text-purple-400">
          Completed
        </p>
      </div>
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-orange-800 dark:text-orange-300 text-sm">
          This Month
        </h3>
        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
          {stats.thisMonth}
        </p>
        <p className="text-xs text-orange-600 dark:text-orange-400">
          Events
        </p>
      </div>
    </div>
  );
};
