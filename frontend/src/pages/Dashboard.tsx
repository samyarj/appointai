import React, { useEffect, useState } from "react";
import { fetchAPI } from "../api";
import { useAuth } from "../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAPI("/api/events"),
      fetchAPI("/api/todos"),
      fetchAPI("/api/categories"),
    ])
      .then(([eventsData, todosData, categoriesData]) => {
        setEvents(eventsData);
        setTodos(todosData);
        setCategories(categoriesData);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Calculate statistics
  const getStatistics = () => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Events statistics
    const allEvents = events.map(event => ({ ...event, date: event.date }));
    const totalEvents = allEvents.length;
    const todayEvents = allEvents.filter(
      event => event.date === today.toISOString().split("T")[0]
    ).length;
    const weekEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= thisWeekStart && eventDate <= today;
    }).length;
    const monthEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= thisMonthStart && eventDate <= today;
    }).length;
    const totalEventHours = allEvents.reduce((total, event) => {
      if (!event.startTime || !event.endTime) return total;
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);
      const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
      return total + duration / 60;
    }, 0);

    // Todo statistics
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.completed).length;
    const pendingTodos = totalTodos - completedTodos;
    const highPriorityTodos = todos.filter(
      todo => todo.priority === "high" && !todo.completed
    ).length;
    const overdueTodos = todos.filter(
      todo =>
        !todo.completed && todo.due_date && new Date(todo.due_date) < today
    ).length;

    // Category statistics
    const totalCategories = categories.length;
    const mostUsedCategory = categories.reduce(
      (max, cat) => (cat.usage_count > max.usage_count ? cat : max),
      categories[0] || { name: "None", usage_count: 0 }
    );

    // Productivity metrics
    const completionRate =
      totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    const weeklyProductivity = weekEvents > 0 ? "High" : "Low";

    return {
      events: {
        total: totalEvents,
        today: todayEvents,
        week: weekEvents,
        month: monthEvents,
        totalHours: totalEventHours,
      },
      todos: {
        total: totalTodos,
        completed: completedTodos,
        pending: pendingTodos,
        highPriority: highPriorityTodos,
        overdue: overdueTodos,
      },
      categories: { total: totalCategories, mostUsed: mostUsedCategory },
      productivity: { completionRate, weeklyProductivity },
    };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loader"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Welcome back, {user?.name}! Here's your activity overview.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Total Events
                  </p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {stats.events.total}
                  </p>
                </div>
                <div className="bg-blue-500 rounded-full p-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                    Completed Todos
                  </p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {stats.todos.completed}
                  </p>
                </div>
                <div className="bg-green-500 rounded-full p-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                    Categories
                  </p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {stats.categories.total}
                  </p>
                </div>
                <div className="bg-purple-500 rounded-full p-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                    Event Hours
                  </p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                    {stats.events.totalHours.toFixed(1)}h
                  </p>
                </div>
                <div className="bg-orange-500 rounded-full p-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Main Dashboard Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar/Events Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Calendar Overview
                </h3>
                <div className="bg-blue-500 rounded-full p-2">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Today's Events</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {stats.events.today}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">This Week</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {stats.events.week}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">This Month</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {stats.events.month}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Hours Scheduled</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {stats.events.totalHours.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            </div>
            {/* Todos Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Todo Progress
                </h3>
                <div className="bg-green-500 rounded-full p-2">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {stats.productivity.completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.productivity.completionRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Pending Tasks</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-500">
                    {stats.todos.pending}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">High Priority</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {stats.todos.highPriority}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Overdue</span>
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    {stats.todos.overdue}
                  </span>
                </div>
              </div>
            </div>

            {/* Events Management Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Events Management
                </h3>
            {/* ... rest of the card ... */}
                <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Events</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {stats.events.total}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Upcoming This Week</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {stats.events.week}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Duration</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {stats.events.total > 0
                      ? (stats.events.totalHours / stats.events.total).toFixed(
                          1
                        ) + "h"
                      : "0h"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Most Active Day</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {Object.entries(events)
                      .reduce(
                        (max, [date, events]) =>
                          events.length > (events[max] || []).length
                            ? date
                            : max,
                        Object.keys(events)[0] || "None"
                      )
                      .split("-")
                      .reverse()
                      .join("/")}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Category Usage
                </h3>
                <div className="bg-purple-500 rounded-full p-2">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                {categories.slice(0, 4).map(category => (
                  <div
                    key={category.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-600 dark:text-gray-400">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${(category.usage_count / 15) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category.usage_count}
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
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
