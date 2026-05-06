import React from "react";

interface TodoProgressProps {
  stats: {
    productivity: { completionRate: number };
    todos: {
      pending: number;
      highPriority: number;
      overdue: number;
    };
  };
}

export const TodoProgress: React.FC<TodoProgressProps> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Todo Progress</h3>
        <div className="bg-green-500 rounded-full p-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
          <span className="font-semibold text-green-600 dark:text-green-400">{stats.productivity.completionRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.productivity.completionRate}%` }}></div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Pending Tasks</span>
          <span className="font-semibold text-yellow-600 dark:text-yellow-500">{stats.todos.pending}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">High Priority</span>
          <span className="font-semibold text-red-600 dark:text-red-400">{stats.todos.highPriority}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Overdue</span>
          <span className="font-semibold text-red-700 dark:text-red-400">{stats.todos.overdue}</span>
        </div>
      </div>
    </div>
  );
};
