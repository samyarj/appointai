import React from "react";

interface TodoStatsProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

export const TodoStats: React.FC<TodoStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
          Total
        </h3>
        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          {stats.total}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">Todos</p>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-green-800 dark:text-green-300 text-sm">
          Completed
        </h3>
        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
          {stats.completed}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400">Done</p>
      </div>
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
          Pending
        </h3>
        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
          {stats.pending}
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-400">To do</p>
      </div>
      <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">
          Overdue
        </h3>
        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
          {stats.overdue}
        </p>
        <p className="text-xs text-red-600 dark:text-red-400">Late</p>
      </div>
    </div>
  );
};
