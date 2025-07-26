import React, { useState } from "react";

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

// Sample events data
const sampleEvents: Record<
  string,
  Array<{ id: number; startTime: string; endTime: string; title: string; duration: string }>
> = {
  "2025-07-26": [
    { id: 1, startTime: "09:00", endTime: "10:00", title: "Team Meeting", duration: "1 hour" },
    { id: 2, startTime: "14:30", endTime: "15:00", title: "Doctor Appointment", duration: "30 min" },
  ],
  "2025-07-27": [
    { id: 3, startTime: "10:00", endTime: "10:45", title: "Client Call", duration: "45 min" },
  ],
  "2025-07-28": [
    { id: 4, startTime: "16:00", endTime: "17:30", title: "Gym Session", duration: "1.5 hours" },
    { id: 5, startTime: "19:00", endTime: "21:00", title: "Dinner with Friends", duration: "2 hours" },
  ],
};

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

  // Helper function to get events for a date
  const getEventsForDate = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    return sampleEvents[dateKey] || [];
  };

  // Helper function to check if a date has events
  const hasEvents = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    return !!sampleEvents[dateKey];
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
      const events: Array<{ startTime: string; endTime: string }> = [];
      const currentDate = new Date(startDate);
      
      while (currentDate < endDate) {
        const dateKey = currentDate.toISOString().split("T")[0];
        if (sampleEvents[dateKey]) {
          events.push(...sampleEvents[dateKey]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return events;
    };

    const calculateEventHours = (events: Array<{ startTime: string; endTime: string }>) => {
      return events.reduce((total, event) => {
        const [startHour, startMin] = event.startTime.split(":").map(Number);
        const [endHour, endMin] = event.endTime.split(":").map(Number);
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        return total + duration / 60;
      }, 0);
    };

    if (view === "year") {
      const yearStart = new Date(current.year, 0, 1);
      const yearEnd = new Date(current.year + 1, 0, 1);
      const events = getAllEventsInRange(yearStart, yearEnd);
      const eventHours = calculateEventHours(events);
      const totalHours = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60);
      return (eventHours / totalHours) * 100;
    } else if (view === "month") {
      const monthStart = new Date(current.year, current.month, 1);
      const monthEnd = new Date(current.year, current.month + 1, 1);
      const events = getAllEventsInRange(monthStart, monthEnd);
      const eventHours = calculateEventHours(events);
      const totalHours = (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60);
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
      const totalHours = (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60);
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
    setCurrent({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
      day: selectedDate.getDate(),
    });
    setView("day");
  };

  // Navigation handlers
  const goPrev = () => {
    if (view === "month") {
      setCurrent((c) => {
        let month = c.month - 1;
        let year = c.year;
        if (month < 0) {
          month = 11;
          year--;
        }
        return { ...c, month, year };
      });
    } else if (view === "year") {
      setCurrent((c) => ({ ...c, year: c.year - 1 }));
    } else if (view === "week") {
      setCurrent((c) => {
        const d = new Date(c.year, c.month, c.day - 7);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    } else if (view === "day") {
      setCurrent((c) => {
        const d = new Date(c.year, c.month, c.day - 1);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    }
  };
  const goNext = () => {
    if (view === "month") {
      setCurrent((c) => {
        let month = c.month + 1;
        let year = c.year;
        if (month > 11) {
          month = 0;
          year++;
        }
        return { ...c, month, year };
      });
    } else if (view === "year") {
      setCurrent((c) => ({ ...c, year: c.year + 1 }));
    } else if (view === "week") {
      setCurrent((c) => {
        const d = new Date(c.year, c.month, c.day + 7);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    } else if (view === "day") {
      setCurrent((c) => {
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
        <div className="grid grid-cols-7 gap-2 mb-4">
          {daysOfWeek.map((d) => (
            <div
              key={d}
              className="font-semibold text-center text-gray-600 py-2"
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
            const hasEventsForDay = date ? hasEvents(date) : false;

            return (
              <div
                key={i}
                onClick={() => day && selectDay(day)}
                className={`
                  h-12 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200
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
                    hasEventsForDay && !isToday && !isPastDay
                      ? "border-l-4 border-l-green-400"
                      : ""
                  }
                  ${
                    hasEventsForDay && isPastDay ? "border-l-4 border-l-gray-300" : ""
                  }
                `}
              >
                <div className="text-center">
                  <div
                    className={`${
                      hasEventsForDay && !isToday ? "font-semibold" : ""
                    }`}
                  >
                    {day || ""}
                  </div>
                  {hasEventsForDay && (
                    <div
                      className={`w-1 h-1 rounded-full mx-auto mt-1 ${
                        isPastDay ? "bg-gray-300" : "bg-green-400"
                      }`}
                    ></div>
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
      <div className="grid grid-cols-7 gap-2 mb-4">
        {daysOfWeek.map((d) => (
          <div key={d} className="font-semibold text-center text-gray-600 py-2">
            {d}
          </div>
        ))}
        {days.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const isPastDay = date < today && !isToday;
          const hasEventsForDay = hasEvents(date);

          return (
            <div
              key={i}
              onClick={() =>
                selectDay(date.getDate(), date.getMonth(), date.getFullYear())
              }
              className={`
                h-16 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200
                hover:bg-blue-50 hover:shadow-md
                ${
                  isToday
                    ? "bg-blue-500 text-white font-bold shadow-lg"
                    : isPastDay
                    ? "bg-gray-100 text-gray-400 border border-gray-150"
                    : "bg-white border border-gray-200 text-gray-800 hover:border-blue-300"
                }
                ${
                  hasEventsForDay && !isToday && !isPastDay
                    ? "border-l-4 border-l-green-400"
                    : ""
                }
                ${hasEventsForDay && isPastDay ? "border-l-4 border-l-gray-300" : ""}
              `}
            >
              <div
                className={`${hasEventsForDay && !isToday ? "font-semibold" : ""}`}
              >
                {date.getDate()}
              </div>
              {hasEventsForDay && (
                <div
                  className={`text-xs mt-1 ${
                    isPastDay ? "text-gray-400" : "text-green-600"
                  }`}
                >
                  {getEventsForDate(date).length} events
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
      <div className="grid grid-cols-3 gap-6">
        {months.map((m, idx) => (
          <div
            key={m}
            className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
          >
            <div className="font-bold text-center mb-3 text-gray-700">{m}</div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {daysOfWeek.map((d) => (
                <div
                  key={d}
                  className="font-semibold text-center text-gray-500"
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
                  const hasEventsForDay = date ? hasEvents(date) : false;

                  return (
                    <div
                      key={i}
                      onClick={() => day && selectDay(day, idx)}
                      className={`
                        h-6 flex items-center justify-center rounded cursor-pointer
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
                          hasEventsForDay && !isToday && !isPastDay
                            ? "bg-green-50 font-semibold"
                            : ""
                        }
                        ${
                          hasEventsForDay && isPastDay
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
    const events = getEventsForDate(currentDate);

    return (
      <div className="bg-gray-50 rounded-lg p-6">
        {events.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Events ({events.length})
            </h3>
            {events.map((event) => (
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
                    <p className="text-gray-600 text-sm mt-1">
                      Duration: {event.duration}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              No events scheduled
            </h3>
            <p className="text-gray-400 mb-6">Your day is free!</p>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Add Event
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header with navigation and view toggles */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-6 pb-4 gap-4 flex-shrink-0">
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
        <div className="px-6 pb-4 flex-shrink-0">
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
                style={{ width: `${Math.min(100, getEventDensityForView() * 10)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          {view === "month" && renderMonth()}
          {view === "week" && renderWeek()}
          {view === "year" && renderYear()}
          {view === "day" && renderDay()}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
