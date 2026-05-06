import React from "react";

interface CalendarOverviewProps {
  stats: {
    events: {
      today: number;
      week: number;
      month: number;
      totalHours: number;
    };
  };
}

export const CalendarOverview: React.FC<CalendarOverviewProps> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          Calendar Overview
        </h3>
        <div className="bg-blue-500 rounded-full p-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Today's Events</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.events.today}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">This Week</span>
          <span className="font-semibold text-green-600 dark:text-green-400">{stats.events.week}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">This Month</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">{stats.events.month}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Total Hours Scheduled</span>
          <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.events.totalHours.toFixed(1)}h</span>
        </div>
      </div>
    </div>
  );
};
