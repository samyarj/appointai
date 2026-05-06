import React, { useEffect, useState } from "react";
import { fetchAPI } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useRefresh } from "../contexts/RefreshContext";
import type { Event, Todo, Category } from "../types";
import { QuickStats } from "../components/dashboard/QuickStats";
import { CalendarOverview } from "../components/dashboard/CalendarOverview";
import { TodoProgress } from "../components/dashboard/TodoProgress";
import { EventsManagement } from "../components/dashboard/EventsManagement";
import { CategoryUsage } from "../components/dashboard/CategoryUsage";
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey } = useRefresh();

  const [events, setEvents] = useState<Event[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  }, [refreshKey]);

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
      (max, cat) => ((cat.usage_count || 0) > (max.usage_count || 0) ? cat : max),
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <QuickStats stats={stats} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CalendarOverview stats={stats} />
          <TodoProgress stats={stats} />
          <EventsManagement stats={stats} events={events} />
          <CategoryUsage categories={categories} stats={stats} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
