import React from "react";
import type { Event } from "../../types";

interface EventsManagementProps {
  stats: {
    events: {
      total: number;
      week: number;
      totalHours: number;
    };
  };
  events: Event[];
}

export const EventsManagement: React.FC<EventsManagementProps> = ({ stats, events }) => {
  // Group events by date to find most active day
  const eventsByDate = events.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const mostActiveDay = Object.keys(eventsByDate).length > 0
    ? Object.entries(eventsByDate)
        .reduce(
          (max, [date, dayEvents]) => dayEvents.length > (eventsByDate[max] || []).length ? date : max,
          Object.keys(eventsByDate)[0]
        )
        .split("-")
        .reverse()
        .join("/")
    : "None";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Events Management</h3>
        <div className="bg-indigo-500 rounded-full p-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Total Events</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats.events.total}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Upcoming This Week</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.events.week}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Average Duration</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {stats.events.total > 0 ? (stats.events.totalHours / stats.events.total).toFixed(1) + "h" : "0h"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Most Active Day</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">{mostActiveDay}</span>
        </div>
      </div>
    </div>
  );
};
