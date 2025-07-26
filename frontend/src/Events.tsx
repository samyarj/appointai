import React, { useState } from "react";

// Sample events data (same as Calendar component)
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

const Events: React.FC = () => {
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [filterBy, setFilterBy] = useState<"all" | "upcoming" | "past">("all");

  // Get all events and format them
  const getAllEvents = () => {
    const allEvents: Array<{
      id: number;
      date: string;
      startTime: string;
      endTime: string;
      title: string;
      duration: string;
      dateObj: Date;
    }> = [];

    Object.entries(sampleEvents).forEach(([dateStr, events]) => {
      events.forEach((event) => {
        allEvents.push({
          ...event,
          date: dateStr,
          dateObj: new Date(dateStr),
        });
      });
    });

    return allEvents;
  };

  // Filter events based on filter criteria
  const getFilteredEvents = () => {
    const allEvents = getAllEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = allEvents;

    if (filterBy === "upcoming") {
      filtered = allEvents.filter((event) => event.dateObj >= today);
    } else if (filterBy === "past") {
      filtered = allEvents.filter((event) => event.dateObj < today);
    }

    // Sort events
    if (sortBy === "date") {
      filtered.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    } else if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  };

  // Calculate event density for different time periods
  const getEventDensity = () => {
    const now = new Date();
    const allEvents = getAllEvents();

    // Year density
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const yearEvents = allEvents.filter(
      (event) => event.dateObj >= yearStart && event.dateObj < yearEnd
    );
    const yearTotalHours =
      (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60);
    const yearEventHours = yearEvents.reduce((total, event) => {
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);
      const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
      return total + duration / 60;
    }, 0);
    const yearDensity = (yearEventHours / yearTotalHours) * 100;

    // Month density
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEvents = allEvents.filter(
      (event) => event.dateObj >= monthStart && event.dateObj < monthEnd
    );
    const monthTotalHours =
      (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60);
    const monthEventHours = monthEvents.reduce((total, event) => {
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);
      const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
      return total + duration / 60;
    }, 0);
    const monthDensity = (monthEventHours / monthTotalHours) * 100;

    // Week density
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekEvents = allEvents.filter(
      (event) => event.dateObj >= weekStart && event.dateObj < weekEnd
    );
    const weekTotalHours =
      (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60);
    const weekEventHours = weekEvents.reduce((total, event) => {
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);
      const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
      return total + duration / 60;
    }, 0);
    const weekDensity = (weekEventHours / weekTotalHours) * 100;

    // Day density
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const dayEvents = allEvents.filter(
      (event) => event.dateObj >= dayStart && event.dateObj < dayEnd
    );
    const dayTotalHours = 24;
    const dayEventHours = dayEvents.reduce((total, event) => {
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);
      const duration = endHour * 60 + endMin - (startHour * 60 + startMin);
      return total + duration / 60;
    }, 0);
    const dayDensity = (dayEventHours / dayTotalHours) * 100;

    return {
      year: {
        density: yearDensity,
        events: yearEvents.length,
        hours: yearEventHours,
      },
      month: {
        density: monthDensity,
        events: monthEvents.length,
        hours: monthEventHours,
      },
      week: {
        density: weekDensity,
        events: weekEvents.length,
        hours: weekEventHours,
      },
      day: {
        density: dayDensity,
        events: dayEvents.length,
        hours: dayEventHours,
      },
    };
  };

  const filteredEvents = getFilteredEvents();
  const eventDensity = getEventDensity();
  const today = new Date();

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">All Events</h1>

          {/* Event Density Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 text-sm">Year</h3>
              <p className="text-2xl font-bold text-blue-900">
                {eventDensity.year.density.toFixed(1)}%
              </p>
              <p className="text-xs text-blue-600">
                {eventDensity.year.events} events,{" "}
                {eventDensity.year.hours.toFixed(1)}h
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 text-sm">Month</h3>
              <p className="text-2xl font-bold text-green-900">
                {eventDensity.month.density.toFixed(1)}%
              </p>
              <p className="text-xs text-green-600">
                {eventDensity.month.events} events,{" "}
                {eventDensity.month.hours.toFixed(1)}h
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 text-sm">Week</h3>
              <p className="text-2xl font-bold text-purple-900">
                {eventDensity.week.density.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600">
                {eventDensity.week.events} events,{" "}
                {eventDensity.week.hours.toFixed(1)}h
              </p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 text-sm">Today</h3>
              <p className="text-2xl font-bold text-orange-900">
                {eventDensity.day.density.toFixed(1)}%
              </p>
              <p className="text-xs text-orange-600">
                {eventDensity.day.events} events,{" "}
                {eventDensity.day.hours.toFixed(1)}h
              </p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600">
                Filter:
              </label>
              <select
                value={filterBy}
                onChange={(e) =>
                  setFilterBy(e.target.value as "all" | "upcoming" | "past")
                }
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "title")}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredEvents.length} events
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-auto p-6">
          {filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const isPast = event.dateObj < today;
                const isToday =
                  event.dateObj.toDateString() === today.toDateString();

                return (
                  <div
                    key={`${event.date}-${event.id}`}
                    className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                      isPast
                        ? "bg-gray-50 border-gray-200"
                        : isToday
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className={`font-semibold text-lg ${
                              isPast ? "text-gray-600" : "text-gray-800"
                            }`}
                          >
                            {event.title}
                          </h3>
                          {isToday && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                              Today
                            </span>
                          )}
                          {isPast && (
                            <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full">
                              Past
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-4 text-sm ${
                            isPast ? "text-gray-500" : "text-gray-600"
                          }`}
                        >
                          <span className="font-medium">
                            📅{" "}
                            {event.dateObj.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="font-medium">
                            🕐 {event.startTime} - {event.endTime}
                          </span>
                          <span>⏱️ {event.duration}</span>
                        </div>
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
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                No events found
              </h3>
              <p className="text-gray-400 mb-6">
                {filterBy === "upcoming"
                  ? "No upcoming events scheduled"
                  : filterBy === "past"
                  ? "No past events found"
                  : "No events in your calendar"}
              </p>
              <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Add Event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
