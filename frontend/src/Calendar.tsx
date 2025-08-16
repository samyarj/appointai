import React, { useState, useEffect } from "react";
import { eventAPI, todoAPI, categoryAPI } from "./api";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ViewMode = "month" | "week" | "year" | "day";

export type Event = {
  id: number;
  user_id?: number;
  category_id?: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: string;
  createdAt?: string;
};

export type TodoItem = {
  id: number;
  user_id?: number;
  category_id?: number;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  estimated_duration?: string;
  due_date?: string;
  completed: boolean;
  created_at?: string;
};

interface Category {
  id: number;
  name: string;
  color: string;
  description: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const Calendar: React.FC = () => {
  const today = new Date();
  const [view, setView] = useState<ViewMode>("month");
  const [current, setCurrent] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [showTodoSelector, setShowTodoSelector] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, todosData, categoriesData] = await Promise.all([
        eventAPI.getEvents(),
        todoAPI.getTodos(),
        categoryAPI.getCategories(),
      ]);
      setEvents(eventsData);
      setTodos(todosData);
      setCategories(categoriesData);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get events for a date
  const getEventsForDate = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    return events.filter(e => e.date === dateKey);
  };

  // Helper function to get todos for a date
  const getTodosForDate = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    return todos.filter(t => t.due_date === dateKey);
  };

  // Helper function to check if a date has events or todos
  const hasItemsForDate = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    return (
      events.some(e => e.date === dateKey) ||
      todos.some(t => t.due_date === dateKey)
    );
  };

  // Helper function to get count of items for a date
  const getItemCountForDate = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    const eventCount = events.filter(e => e.date === dateKey).length;
    const todoCount = todos.filter(t => t.due_date === dateKey).length;
    return {
      events: eventCount,
      todos: todoCount,
      total: eventCount + todoCount,
    };
  };

  // Progress calculation functions
  const getProgressForView = () => {
    const now = new Date();

    if (view === "year") {
      const yearStart = new Date(current.year, 0, 1);
      const yearEnd = new Date(current.year + 1, 0, 1);
      const totalDays =
        (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
      const passedDays = Math.max(
        0,
        (now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.min(100, (passedDays / totalDays) * 100);
    } else if (view === "month") {
      const monthStart = new Date(current.year, current.month, 1);
      const monthEnd = new Date(current.year, current.month + 1, 1);
      const totalDays =
        (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);
      const passedDays = Math.max(
        0,
        (now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.min(100, (passedDays / totalDays) * 100);
    } else if (view === "week") {
      const weekDate = new Date(current.year, current.month, current.day);
      const weekStart = new Date(weekDate);
      weekStart.setDate(weekDate.getDate() - weekDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const totalMinutes =
        (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60);
      const passedMinutes = Math.max(
        0,
        (now.getTime() - weekStart.getTime()) / (1000 * 60)
      );
      return Math.min(100, (passedMinutes / totalMinutes) * 100);
    } else if (view === "day") {
      const dayStart = new Date(current.year, current.month, current.day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const totalMinutes =
        (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60);
      const passedMinutes = Math.max(
        0,
        (now.getTime() - dayStart.getTime()) / (1000 * 60)
      );
      return Math.min(100, (passedMinutes / totalMinutes) * 100);
    }
    return 0;
  };

  // Event density calculation
  const getEventDensityForView = () => {
    const getAllEventsInRange = (startDate: Date, endDate: Date) => {
      const eventsArr: Array<{ startTime: string; endTime: string }> = [];
      const currentDate = new Date(startDate);

      while (currentDate < endDate) {
        const dateKey = currentDate.toISOString().split("T")[0];
        const dayEvents = events.filter((e: Event) => e.date === dateKey);
        if (dayEvents.length > 0) {
          eventsArr.push(
            ...dayEvents.map((e: Event) => ({
              startTime: e.startTime,
              endTime: e.endTime,
            }))
          );
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return eventsArr;
    };

    const calculateEventHours = (
      events: Array<{ startTime: string; endTime: string }>
    ) => {
      return events.reduce((total, event) => {
        const [startHour, startMin] = event.startTime.split(":").map(Number);
        const [endHour, endMin] = event.endTime.split(":").map(Number);
        const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
        return total + duration / 60;
      }, 0);
    };

    if (view === "year") {
      const yearStart = new Date(current.year, 0, 1);
      const yearEnd = new Date(current.year + 1, 0, 1);
      const events = getAllEventsInRange(yearStart, yearEnd);
      const eventHours = calculateEventHours(events);
      const totalHours =
        (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60);
      return (eventHours / totalHours) * 100;
    } else if (view === "month") {
      const monthStart = new Date(current.year, current.month, 1);
      const monthEnd = new Date(current.year, current.month + 1, 1);
      const events = getAllEventsInRange(monthStart, monthEnd);
      const eventHours = calculateEventHours(events);
      const totalHours =
        (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60);
      return (eventHours / totalHours) * 100;
    } else if (view === "week") {
      const weekDate = new Date(current.year, current.month, current.day);
      const weekStart = new Date(weekDate);
      weekStart.setDate(weekDate.getDate() - weekDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const events = getAllEventsInRange(weekStart, weekEnd);
      const eventHours = calculateEventHours(events);
      const totalHours =
        (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60);
      return (eventHours / totalHours) * 100;
    } else if (view === "day") {
      const dayStart = new Date(current.year, current.month, current.day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const events = getAllEventsInRange(dayStart, dayEnd);
      const eventHours = calculateEventHours(events);
      return (eventHours / 24) * 100; // 24 hours in a day
    }
    return 0;
  };

  const getProgressLabel = () => {
    const progress = getProgressForView();
    if (view === "year") {
      return `${progress.toFixed(1)}% of ${current.year} completed`;
    } else if (view === "month") {
      return `${progress.toFixed(1)}% of ${months[current.month]} completed`;
    } else if (view === "week") {
      const weekDate = new Date(current.year, current.month, current.day);
      const weekStart = new Date(weekDate);
      weekStart.setDate(weekDate.getDate() - weekDate.getDay());
      return `${progress.toFixed(
        1
      )}% of week (${weekStart.toLocaleDateString()}) completed`;
    } else if (view === "day") {
      return `${progress.toFixed(1)}% of ${new Date(
        current.year,
        current.month,
        current.day
      ).toLocaleDateString()} completed`;
    }
    return "";
  };

  // Day selection handler
  const selectDay = (day: number, month?: number, year?: number) => {
    const selectedDate = new Date(
      year || current.year,
      month !== undefined ? month : current.month,
      day
    );
    setSelectedDate(selectedDate);
    setCurrent({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
      day: selectedDate.getDate(),
    });

    // Always switch to day view when a day is clicked
    setView("day");
  };

  // Navigation handlers
  const goPrev = () => {
    if (view === "month") {
      setCurrent(c => {
        let month = c.month - 1;
        let year = c.year;
        if (month < 0) {
          month = 11;
          year--;
        }
        return { ...c, month, year };
      });
    } else if (view === "year") {
      setCurrent(c => ({ ...c, year: c.year - 1 }));
    } else if (view === "week") {
      setCurrent(c => {
        const d = new Date(c.year, c.month, c.day - 7);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    } else if (view === "day") {
      setCurrent(c => {
        const d = new Date(c.year, c.month, c.day - 1);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    }
  };
  const goNext = () => {
    if (view === "month") {
      setCurrent(c => {
        let month = c.month + 1;
        let year = c.year;
        if (month > 11) {
          month = 0;
          year++;
        }
        return { ...c, month, year };
      });
    } else if (view === "year") {
      setCurrent(c => ({ ...c, year: c.year + 1 }));
    } else if (view === "week") {
      setCurrent(c => {
        const d = new Date(c.year, c.month, c.day + 7);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    } else if (view === "day") {
      setCurrent(c => {
        const d = new Date(c.year, c.month, c.day + 1);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    }
  };

  const goToday = () => {
    setCurrent({
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate(),
    });
  };

  // CRUD handlers for events
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await eventAPI.deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveEvent = async (eventData: Omit<Event, "id">) => {
    try {
      if (editingEvent) {
        const updatedEvent = await eventAPI.updateEvent(
          editingEvent.id,
          eventData
        );
        setEvents(
          events.map(e => (e.id === editingEvent.id ? updatedEvent : e))
        );
        setEditingEvent(null);
      } else {
        const newEvent = await eventAPI.createEvent(eventData);
        setEvents([...events, newEvent]);
      }
      setShowEventForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CRUD handlers for todos
  const handleDeleteTodo = async (todoId: number) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      await todoAPI.deleteTodo(todoId);
      setTodos(todos.filter(t => t.id !== todoId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleTodo = async (todoId: number, completed: boolean) => {
    try {
      const updatedTodo = await todoAPI.updateTodo(todoId, { completed });
      setTodos(todos.map(t => (t.id === todoId ? updatedTodo : t)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveTodo = async (todoData: Omit<TodoItem, "id">) => {
    try {
      if (editingTodo) {
        const updatedTodo = await todoAPI.updateTodo(editingTodo.id, todoData);
        setTodos(todos.map(t => (t.id === editingTodo.id ? updatedTodo : t)));
        setEditingTodo(null);
      } else {
        const newTodo = await todoAPI.createTodo(todoData);
        setTodos([...todos, newTodo]);
      }
      setShowTodoForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle rescheduling existing todo to selected date
  const handleRescheduleTodo = async (todoId: number) => {
    try {
      const selectedDateStr = formatDateForAPI(
        new Date(current.year, current.month, current.day)
      );
      const updatedTodo = await todoAPI.updateTodo(todoId, {
        due_date: selectedDateStr,
      });
      setTodos(todos.map(t => (t.id === todoId ? updatedTodo : t)));
      setShowTodoSelector(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Format date for API (consistent with other pages)
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Parse date from string (consistent with other pages)
  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr + "T00:00:00");
  };

  // Renderers for each view
  function renderMonth() {
    const daysInMonth = getDaysInMonth(current.year, current.month);
    const firstDay = getFirstDayOfMonth(current.year, current.month);
    const days: (number | null)[] = Array(firstDay)
      .fill(null)
      .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    while (days.length % 7 !== 0) days.push(null);

    return (
      <>
        <div className="grid grid-cols-7 gap-3 mb-6">
          {daysOfWeek.map(d => (
            <div
              key={d}
              className="font-semibold text-center text-gray-600 py-4"
            >
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const date = day
              ? new Date(current.year, current.month, day)
              : null;
            const isToday =
              day === today.getDate() &&
              current.month === today.getMonth() &&
              current.year === today.getFullYear();
            const isPastDay = date ? date < today && !isToday : false;
            const hasItemsForDay = date ? hasItemsForDate(date) : false;
            const itemCount = date
              ? getItemCountForDate(date)
              : { events: 0, todos: 0, total: 0 };

            return (
              <div
                key={i}
                onClick={() => day && selectDay(day)}
                className={`
                  h-24 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200
                  ${day ? "hover:bg-blue-50 hover:shadow-md" : ""}
                  ${
                    isToday
                      ? "bg-blue-500 text-white font-bold shadow-lg"
                      : isPastDay
                        ? "bg-gray-100 text-gray-400 border border-gray-150"
                        : day
                          ? "bg-white border border-gray-200 text-gray-800 hover:border-blue-300"
                          : "text-gray-300"
                  }
                  ${
                    hasItemsForDay && !isToday && !isPastDay
                      ? "border-l-4 border-l-green-400"
                      : ""
                  }
                  ${
                    hasItemsForDay && isPastDay
                      ? "border-l-4 border-l-gray-300"
                      : ""
                  }
                `}
              >
                <div className="text-center">
                  <div
                    className={`text-xl ${
                      hasItemsForDay && !isToday ? "font-semibold" : ""
                    }`}
                  >
                    {day || ""}
                  </div>
                  {hasItemsForDay && (
                    <div className="flex justify-center items-center mt-2 space-x-1">
                      {itemCount.events > 0 && (
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isPastDay ? "bg-gray-300" : "bg-blue-400"
                          }`}
                          title={`${itemCount.events} event${itemCount.events !== 1 ? "s" : ""}`}
                        ></div>
                      )}
                      {itemCount.todos > 0 && (
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isPastDay ? "bg-gray-300" : "bg-green-400"
                          }`}
                          title={`${itemCount.todos} todo${itemCount.todos !== 1 ? "s" : ""}`}
                        ></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderWeek() {
    const d = new Date(current.year, current.month, current.day);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });

    return (
      <div className="grid grid-cols-7 gap-3 mb-6">
        {daysOfWeek.map(d => (
          <div key={d} className="font-semibold text-center text-gray-600 py-4">
            {d}
          </div>
        ))}
        {days.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const isPastDay = date < today && !isToday;
          const hasItemsForDay = hasItemsForDate(date);
          const itemCount = getItemCountForDate(date);

          return (
            <div
              key={i}
              onClick={() =>
                selectDay(date.getDate(), date.getMonth(), date.getFullYear())
              }
              className={`
                h-32 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200
                hover:bg-blue-50 hover:shadow-md
                ${
                  isToday
                    ? "bg-blue-500 text-white font-bold shadow-lg"
                    : isPastDay
                      ? "bg-gray-100 text-gray-400 border border-gray-150"
                      : "bg-white border border-gray-200 text-gray-800 hover:border-blue-300"
                }
                ${
                  hasItemsForDay && !isToday && !isPastDay
                    ? "border-l-4 border-l-green-400"
                    : ""
                }
                ${
                  hasItemsForDay && isPastDay
                    ? "border-l-4 border-l-gray-300"
                    : ""
                }
              `}
            >
              <div
                className={`text-xl ${
                  hasItemsForDay && !isToday ? "font-semibold" : ""
                }`}
              >
                {date.getDate()}
              </div>
              {hasItemsForDay && (
                <div
                  className={`text-sm mt-2 ${
                    isPastDay ? "text-gray-400" : "text-green-600"
                  }`}
                >
                  {itemCount.total} item{itemCount.total !== 1 ? "s" : ""}
                  {itemCount.events > 0 && itemCount.todos > 0 && (
                    <div className="text-xs">
                      {itemCount.events}e, {itemCount.todos}t
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderYear() {
    return (
      <div className="grid grid-cols-3 gap-8">
        {months.map((m, idx) => (
          <div
            key={m}
            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
          >
            <div className="font-bold text-center mb-6 text-gray-700 text-xl">
              {m}
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-sm">
              {daysOfWeek.map(d => (
                <div
                  key={d}
                  className="font-semibold text-center text-gray-500 py-2"
                >
                  {d[0]}
                </div>
              ))}
              {(() => {
                const daysInMonth = getDaysInMonth(current.year, idx);
                const firstDay = getFirstDayOfMonth(current.year, idx);
                const days: (number | null)[] = Array(firstDay)
                  .fill(null)
                  .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
                while (days.length % 7 !== 0) days.push(null);
                return days.map((day, i) => {
                  const isToday =
                    day === today.getDate() &&
                    idx === today.getMonth() &&
                    current.year === today.getFullYear();
                  const date = day ? new Date(current.year, idx, day) : null;
                  const isPastDay = date ? date < today && !isToday : false;
                  const hasItemsForDay = date ? hasItemsForDate(date) : false;

                  return (
                    <div
                      key={i}
                      onClick={() => day && selectDay(day, idx)}
                      className={`
                        h-10 flex items-center justify-center rounded cursor-pointer text-sm
                        ${day ? "hover:bg-blue-100" : ""}
                        ${
                          isToday
                            ? "bg-blue-500 text-white font-bold"
                            : isPastDay
                              ? "bg-gray-100 text-gray-400"
                              : day
                                ? "bg-gray-50 text-gray-700 hover:bg-blue-50"
                                : "text-gray-300"
                        }
                        ${
                          hasItemsForDay && !isToday && !isPastDay
                            ? "bg-green-50 font-semibold"
                            : ""
                        }
                        ${
                          hasItemsForDay && isPastDay
                            ? "bg-gray-150 font-medium"
                            : ""
                        }
                      `}
                    >
                      {day || ""}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderDay() {
    const currentDate = new Date(current.year, current.month, current.day);
    const dayEvents = getEventsForDate(currentDate);
    const dayTodos = getTodosForDate(currentDate);

    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowEventForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Event
            </button>
            <button
              onClick={() => setShowTodoSelector(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Add Todo
            </button>
            <button
              onClick={() => setShowTodoForm(true)}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              New Todo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
              Events ({dayEvents.length})
            </h3>
            {dayEvents.length > 0 ? (
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {event.title}
                        </h4>
                        <p className="text-blue-600 font-medium mt-1">
                          {event.startTime} - {event.endTime}
                        </p>
                        {event.duration && (
                          <p className="text-gray-600 text-sm mt-1">
                            Duration: {event.duration}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📅</div>
                <p className="text-gray-500">No events scheduled</p>
              </div>
            )}
          </div>

          {/* Todos Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              Todos ({dayTodos.length})
            </h3>
            {dayTodos.length > 0 ? (
              <div className="space-y-3">
                {dayTodos.map(todo => (
                  <div
                    key={todo.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                      todo.completed
                        ? "bg-gray-50 border-gray-200"
                        : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() =>
                            handleToggleTodo(todo.id, !todo.completed)
                          }
                          className="mt-1 w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div>
                          <h4
                            className={`font-semibold text-lg ${
                              todo.completed
                                ? "text-gray-500 line-through"
                                : "text-gray-800"
                            }`}
                          >
                            {todo.title}
                          </h4>
                          {todo.description && (
                            <p
                              className={`text-sm mt-1 ${
                                todo.completed
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {todo.description}
                            </p>
                          )}
                          {todo.priority && (
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                                todo.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : todo.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {todo.priority} priority
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingTodo(todo)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">✅</div>
                <p className="text-gray-500">No todos due today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Event Form Modal Component
  const EventFormModal = () => {
    const [formData, setFormData] = useState({
      title: editingEvent?.title || "",
      date:
        editingEvent?.date ||
        formatDateForAPI(new Date(current.year, current.month, current.day)),
      startTime: editingEvent?.startTime || "",
      endTime: editingEvent?.endTime || "",
      category_id: editingEvent?.category_id || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveEvent({
        ...formData,
        category_id: formData.category_id
          ? Number(formData.category_id)
          : undefined,
      });
    };

    const handleClose = () => {
      setShowEventForm(false);
      setEditingEvent(null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">
            {editingEvent ? "Edit Event" : "Create Event"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={e =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={e =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={e =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {editingEvent ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Todo Form Modal Component
  const TodoFormModal = () => {
    const [formData, setFormData] = useState({
      title: editingTodo?.title || "",
      description: editingTodo?.description || "",
      priority: editingTodo?.priority || "",
      estimated_duration: editingTodo?.estimated_duration || "",
      due_date:
        editingTodo?.due_date ||
        formatDateForAPI(new Date(current.year, current.month, current.day)),
      category_id: editingTodo?.category_id || "",
      completed: editingTodo?.completed || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveTodo({
        ...formData,
        category_id: formData.category_id
          ? Number(formData.category_id)
          : undefined,
        priority: formData.priority as "low" | "medium" | "high" | undefined,
      });
    };

    const handleClose = () => {
      setShowTodoForm(false);
      setEditingTodo(null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">
            {editingTodo ? "Edit Todo" : "Create Todo"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={e =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={e =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Est. Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2 hours"
                  value={formData.estimated_duration}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      estimated_duration: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={e =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {editingTodo && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="completed"
                  checked={formData.completed}
                  onChange={e =>
                    setFormData({ ...formData, completed: e.target.checked })
                  }
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <label
                  htmlFor="completed"
                  className="ml-2 text-sm text-gray-700"
                >
                  Mark as completed
                </label>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {editingTodo ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Todo Selector Modal Component
  const TodoSelector = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);

    // Filter todos based on search term
    useEffect(() => {
      if (searchTerm.trim() === "") {
        setFilteredTodos(todos);
      } else {
        const filtered = todos.filter(
          todo =>
            todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (todo.description &&
              todo.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredTodos(filtered);
      }
    }, [searchTerm, todos]);

    const handleClose = () => {
      setShowTodoSelector(false);
      setSearchTerm("");
    };

    const selectedDateStr = formatDateForAPI(
      new Date(current.year, current.month, current.day)
    );
    const currentSelectedDate = new Date(
      current.year,
      current.month,
      current.day
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              Reschedule Todo to{" "}
              {currentSelectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search todos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Todo List */}
          <div className="overflow-y-auto max-h-96 p-6">
            {filteredTodos.length > 0 ? (
              <div className="space-y-3">
                {filteredTodos.map(todo => {
                  const isAlreadyScheduled = todo.due_date === selectedDateStr;
                  return (
                    <div
                      key={todo.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        isAlreadyScheduled
                          ? "border-green-300 bg-green-50"
                          : todo.completed
                            ? "border-gray-200 bg-gray-50"
                            : "border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
                      }`}
                      onClick={() =>
                        !isAlreadyScheduled &&
                        !todo.completed &&
                        handleRescheduleTodo(todo.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            readOnly
                            className="mt-1 w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <h4
                              className={`font-semibold text-lg ${
                                todo.completed
                                  ? "text-gray-500 line-through"
                                  : "text-gray-800"
                              }`}
                            >
                              {todo.title}
                            </h4>
                            {todo.description && (
                              <p
                                className={`text-sm mt-1 ${
                                  todo.completed
                                    ? "text-gray-400"
                                    : "text-gray-600"
                                }`}
                              >
                                {todo.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-3 mt-2">
                              {todo.priority && (
                                <span
                                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    todo.priority === "high"
                                      ? "bg-red-100 text-red-800"
                                      : todo.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {todo.priority} priority
                                </span>
                              )}
                              {todo.due_date && (
                                <span className="text-xs text-gray-500">
                                  Due:{" "}
                                  {new Date(
                                    todo.due_date + "T00:00:00"
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {isAlreadyScheduled ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                              Already scheduled
                            </span>
                          ) : todo.completed ? (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                              Completed
                            </span>
                          ) : (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleRescheduleTodo(todo.id);
                              }}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                            >
                              Reschedule
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-2">🔍</div>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No todos found matching your search"
                    : "No todos available"}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Click on a todo to reschedule it to the selected date
              </p>
              <button
                onClick={() => {
                  setShowTodoSelector(false);
                  setShowTodoForm(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create New Todo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading/error states
  if (loading) return <div className="p-8 text-center">Loading events...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header with navigation and view toggles */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-8 pb-6 gap-4 flex-shrink-0">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                view === "year"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setView("year")}
            >
              Year
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                view === "month"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setView("month")}
            >
              Month
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                view === "week"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setView("week")}
            >
              Week
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                view === "day"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setView("day")}
            >
              Day
            </button>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={goPrev}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={goToday}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
            >
              Today
            </button>

            <span className="font-bold text-xl text-gray-800">
              {view === "month"
                ? `${months[current.month]} ${current.year}`
                : view === "week"
                  ? `${months[current.month]} ${current.year}`
                  : view === "year"
                    ? current.year
                    : new Date(
                        current.year,
                        current.month,
                        current.day
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
            </span>

            <button
              onClick={goNext}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pb-6 flex-shrink-0">
          {/* Time Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                {getProgressLabel()}
              </span>
              <span className="text-sm text-gray-500">
                {getProgressForView().toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressForView()}%` }}
              ></div>
            </div>
          </div>

          {/* Event Density */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Event Density for {view}
              </span>
              <span className="text-sm text-gray-500">
                {getEventDensityForView().toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, getEventDensityForView() * 10)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-auto px-8 pb-8">
          {view === "month" && renderMonth()}
          {view === "week" && renderWeek()}
          {view === "year" && renderYear()}
          {view === "day" && renderDay()}
        </div>
      </div>

      {/* Modals */}
      {showTodoSelector && <TodoSelector />}
      {showEventForm && <EventFormModal />}
      {showTodoForm && <TodoFormModal />}
    </div>
  );
};

export default Calendar;
