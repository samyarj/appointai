// Sample data (in a real app, this would come from a database/API)
const sampleEvents: Record<
  string,
  Array<{
    id: number;
    startTime: string;
    endTime: string;
    title: string;
    duration: string;
  }>
> = {
  "2025-07-26": [
    {
      id: 1,
      startTime: "09:00",
      endTime: "10:00",
      title: "Team Meeting",
      duration: "1 hour",
    },
    {
      id: 2,
      startTime: "14:30",
      endTime: "15:00",
      title: "Doctor Appointment",
      duration: "30 min",
    },
  ],
  "2025-07-27": [
    {
      id: 3,
      startTime: "10:00",
      endTime: "10:45",
      title: "Client Call",
      duration: "45 min",
    },
  ],
  "2025-07-28": [
    {
      id: 4,
      startTime: "16:00",
      endTime: "17:30",
      title: "Gym Session",
      duration: "1.5 hours",
    },
    {
      id: 5,
      startTime: "19:00",
      endTime: "21:00",
      title: "Dinner with Friends",
      duration: "2 hours",
    },
  ],
};

const sampleTodos = [
  {
    id: 1,
    title: "Schedule dentist appointment",
    completed: false,
    priority: "medium",
    dueDate: "2025-08-15",
  },
  {
    id: 2,
    title: "Plan birthday party",
    completed: false,
    priority: "high",
    dueDate: "2025-08-10",
  },
  {
    id: 3,
    title: "Review quarterly reports",
    completed: false,
    priority: "high",
    dueDate: "2025-07-30",
  },
  { id: 4, title: "Buy groceries", completed: true, priority: "low" },
];

const sampleCategories = [
  { id: 1, name: "Work", usageCount: 15 },
  { id: 2, name: "Personal", usageCount: 8 },
  { id: 3, name: "Health", usageCount: 5 },
  { id: 4, name: "Family", usageCount: 12 },
  { id: 5, name: "Education", usageCount: 3 },
];

function App() {
  // Calculate statistics
  const getStatistics = () => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Events statistics
    const allEvents = Object.entries(sampleEvents).flatMap(([date, events]) =>
      events.map(event => ({ ...event, date }))
    );

    const totalEvents = allEvents.length;
    const todayEvents =
      sampleEvents[today.toISOString().split("T")[0]]?.length || 0;

    const weekEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= thisWeekStart && eventDate <= today;
    }).length;

    const monthEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= thisMonthStart && eventDate <= today;
    }).length;

    // Calculate total event hours
    const totalEventHours = allEvents.reduce((total, event) => {
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);
      const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
      return total + duration / 60;
    }, 0);

    // Todo statistics
    const totalTodos = sampleTodos.length;
    const completedTodos = sampleTodos.filter(todo => todo.completed).length;
    const pendingTodos = totalTodos - completedTodos;
    const highPriorityTodos = sampleTodos.filter(
      todo => todo.priority === "high" && !todo.completed
    ).length;

    const overdueTodos = sampleTodos.filter(
      todo => !todo.completed && todo.dueDate && new Date(todo.dueDate) < today
    ).length;

    // Category statistics
    const totalCategories = sampleCategories.length;
    const mostUsedCategory = sampleCategories.reduce(
      (max, cat) => (cat.usageCount > max.usageCount ? cat : max),
      sampleCategories[0]
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

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back! Here's your activity overview.
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">
                    Total Events
                  </p>
                  <p className="text-2xl font-bold text-blue-800">
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

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    Completed Todos
                  </p>
                  <p className="text-2xl font-bold text-green-800">
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

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">
                    Categories
                  </p>
                  <p className="text-2xl font-bold text-purple-800">
                    {stats.categories.total}
                  </p>
                </div>
                <div className="bg-purple-500 rounded-full p-3">
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">
                    Event Hours
                  </p>
                  <p className="text-2xl font-bold text-orange-800">
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
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
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
                  <span className="text-gray-600">Today's Events</span>
                  <span className="font-semibold text-blue-600">
                    {stats.events.today}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Week</span>
                  <span className="font-semibold text-green-600">
                    {stats.events.week}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-semibold text-purple-600">
                    {stats.events.month}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Hours Scheduled</span>
                  <span className="font-semibold text-orange-600">
                    {stats.events.totalHours.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            {/* Todos Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
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
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold text-green-600">
                    {stats.productivity.completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.productivity.completionRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Tasks</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.todos.pending}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">High Priority</span>
                  <span className="font-semibold text-red-600">
                    {stats.todos.highPriority}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overdue</span>
                  <span className="font-semibold text-red-700">
                    {stats.todos.overdue}
                  </span>
                </div>
              </div>
            </div>

            {/* Events Management Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Events Management
                </h3>
                <div className="bg-indigo-500 rounded-full p-2">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Events</span>
                  <span className="font-semibold text-indigo-600">
                    {stats.events.total}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upcoming This Week</span>
                  <span className="font-semibold text-blue-600">
                    {stats.events.week}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Duration</span>
                  <span className="font-semibold text-green-600">
                    {stats.events.total > 0
                      ? (stats.events.totalHours / stats.events.total).toFixed(
                          1
                        ) + "h"
                      : "0h"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Most Active Day</span>
                  <span className="font-semibold text-purple-600">
                    {Object.entries(sampleEvents)
                      .reduce(
                        (max, [date, events]) =>
                          events.length > (sampleEvents[max] || []).length
                            ? date
                            : max,
                        Object.keys(sampleEvents)[0] || "None"
                      )
                      .split("-")
                      .reverse()
                      .join("/")}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
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
                {sampleCategories.slice(0, 4).map(category => (
                  <div
                    key={category.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-600">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${(category.usageCount / 15) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {category.usageCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Most Used:</span>
                  <span className="font-semibold text-purple-600">
                    {stats.categories.mostUsed.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
