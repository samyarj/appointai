import React, { useState, useEffect } from "react";
import { eventAPI, categoryAPI } from "./api";

type Event = {
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

interface Category {
  id: number;
  name: string;
  color: string;
  description: string;
  created_at: string;
  usage_count: number;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "title" | "created">("date");
  const [filterBy, setFilterBy] = useState<"all" | "upcoming" | "past">("all");
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    duration: "",
    category_id: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Load events and categories on component mount
  useEffect(() => {
    loadEvents();
    loadCategories();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventAPI.getEvents();
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryAPI.getCategories();
      setCategories(data);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  };

  const showStatus = (type: "success" | "error", message: string) => {
    setActionStatus({ type, message });
    setTimeout(
      () => {
        setActionStatus({ type: "idle", message: "" });
      },
      type === "success" ? 3000 : 5000
    );
  };

  // Helper function to show confirmation dialog
  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return "";

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const durationMin = endTotalMin - startTotalMin;

    if (durationMin <= 0) return "";

    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const handleAddEvent = async () => {
    if (!newEvent.title?.trim()) {
      showStatus("error", "Event title cannot be empty.");
      return;
    }
    if (!newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      showStatus("error", "Date, start time, and end time are required.");
      return;
    }

    setActionStatus({ type: "loading", message: "Creating event..." });

    try {
      const duration = calculateDuration(
        newEvent.startTime!,
        newEvent.endTime!
      );
      const eventData = {
        title: newEvent.title.trim(),
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        duration: duration,
        category_id: newEvent.category_id,
      };

      const createdEvent = await eventAPI.createEvent(eventData);
      setEvents([...events, createdEvent]);
      setNewEvent({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        category_id: undefined,
      });
      setShowAddForm(false);
      showStatus("success", "Event created successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to create event";
      showStatus("error", errorMessage);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      duration: event.duration,
      category_id: event.category_id,
    });
    setShowAddForm(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEvent.title?.trim()) {
      showStatus("error", "Event title cannot be empty.");
      return;
    }
    if (!newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      showStatus("error", "Date, start time, and end time are required.");
      return;
    }

    setActionStatus({ type: "loading", message: "Updating event..." });

    try {
      const duration = calculateDuration(
        newEvent.startTime!,
        newEvent.endTime!
      );
      const eventData = {
        title: newEvent.title.trim(),
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        duration: duration,
        category_id: newEvent.category_id,
      };

      const updatedEvent = await eventAPI.updateEvent(
        editingEvent.id,
        eventData
      );
      setEvents(
        events.map(event =>
          event.id === editingEvent.id ? updatedEvent : event
        )
      );
      setEditingEvent(null);
      setNewEvent({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        category_id: undefined,
      });
      setShowAddForm(false);
      showStatus("success", "Event updated successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update event";
      showStatus("error", errorMessage);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    const event = events.find(e => e.id === id);
    const eventName = event ? event.title : "this event";

    showConfirmDialog(
      "Delete Event",
      `Are you sure you want to delete "${eventName}"? This action cannot be undone.`,
      async () => {
        setActionStatus({ type: "loading", message: "Deleting event..." });

        try {
          await eventAPI.deleteEvent(id);
          setEvents(events.filter(event => event.id !== id));
          showStatus("success", "Event deleted successfully!");
        } catch (e) {
          const errorMessage =
            e instanceof Error ? e.message : "Failed to delete event";
          showStatus("error", errorMessage);
        }
      }
    );
  };

  const getFilteredAndSortedEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = events;

    // Apply filter
    if (filterBy === "upcoming") {
      filtered = events.filter(event => {
        const eventDate = new Date(event.date + "T00:00:00");
        return eventDate >= today;
      });
    } else if (filterBy === "past") {
      filtered = events.filter(event => {
        const eventDate = new Date(event.date + "T00:00:00");
        return eventDate < today;
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "created") {
        const aCreated = a.createdAt || "";
        const bCreated = b.createdAt || "";
        return new Date(bCreated).getTime() - new Date(aCreated).getTime();
      }
      return 0;
    });

    return filtered;
  };

  const getStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = events.length;
    const upcoming = events.filter(e => {
      const eventDate = new Date(e.date + "T00:00:00");
      return eventDate >= today;
    }).length;
    const past = events.filter(e => {
      const eventDate = new Date(e.date + "T00:00:00");
      return eventDate < today;
    }).length;
    const thisMonth = events.filter(e => {
      const eventDate = new Date(e.date + "T00:00:00");
      return (
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    }).length;

    return { total, upcoming, past, thisMonth };
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Unknown";
  };

  const getCategoryColor = (categoryId?: number) => {
    if (!categoryId) return "#6B7280";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : "#6B7280";
  };

  const filteredEvents = getFilteredAndSortedEvents();
  const stats = getStats();
  const today = new Date();

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Events</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showAddForm
                  ? "bg-gray-500 text-white hover:bg-gray-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {showAddForm ? <>✕ Cancel</> : <>+ Add Event</>}
            </button>
          </div>

          {/* Status Display */}
          {actionStatus.type !== "idle" && (
            <div className="mb-4">
              {actionStatus.type === "loading" && (
                <div className="flex items-center text-blue-600 bg-blue-50 p-3 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  {actionStatus.message}
                </div>
              )}
              {actionStatus.type === "success" && (
                <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg">
                  ✓ {actionStatus.message}
                </div>
              )}
              {actionStatus.type === "error" && (
                <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                  ✗ {actionStatus.message}
                </div>
              )}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 text-sm">Total</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs text-blue-600">Events</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 text-sm">Upcoming</h3>
              <p className="text-2xl font-bold text-green-900">
                {stats.upcoming}
              </p>
              <p className="text-xs text-green-600">Scheduled</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 text-sm">Past</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.past}</p>
              <p className="text-xs text-purple-600">Completed</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 text-sm">
                This Month
              </h3>
              <p className="text-2xl font-bold text-orange-900">
                {stats.thisMonth}
              </p>
              <p className="text-xs text-orange-600">Events</p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600">
                Filter:
              </label>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterBy === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilterBy("all")}
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterBy === "upcoming"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilterBy("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterBy === "past"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilterBy("past")}
              >
                Past
              </button>
            </div>
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600">
                Sort by:
              </label>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "date"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSortBy("date")}
              >
                Date
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "title"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSortBy("title")}
              >
                Title
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "created"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSortBy("created")}
              >
                Created
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredEvents.length} events
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                Error loading events
              </h3>
              <p className="text-gray-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Add/Edit Event Form */}
              {showAddForm && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg animate-in slide-in-from-top-2 duration-300">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {editingEvent ? "Edit Event" : "Add New Event"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        value={newEvent.title || ""}
                        onChange={e =>
                          setNewEvent({ ...newEvent, title: e.target.value })
                        }
                        placeholder="Enter event title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={newEvent.date || ""}
                        onChange={e =>
                          setNewEvent({ ...newEvent, date: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newEvent.category_id || ""}
                        onChange={e =>
                          setNewEvent({
                            ...newEvent,
                            category_id: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={newEvent.startTime || ""}
                        onChange={e =>
                          setNewEvent({
                            ...newEvent,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={newEvent.endTime || ""}
                        onChange={e =>
                          setNewEvent({ ...newEvent, endTime: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={
                        editingEvent ? handleUpdateEvent : handleAddEvent
                      }
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      {editingEvent ? "Update Event" : "Add Event"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingEvent(null);
                        setNewEvent({
                          title: "",
                          date: "",
                          startTime: "",
                          endTime: "",
                          duration: "",
                          category_id: undefined,
                        });
                      }}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Events List */}
              {filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  {filteredEvents.map(event => {
                    // Parse date string properly to avoid timezone issues
                    const eventDate = new Date(event.date + "T00:00:00");
                    const isPast = eventDate < today;
                    const isToday =
                      eventDate.toDateString() === today.toDateString();
                    const categoryColor = getCategoryColor(event.category_id);

                    return (
                      <div
                        key={event.id}
                        className={`border rounded-xl p-6 transition-all duration-200 hover:shadow-md ${
                          isPast
                            ? "bg-gray-50 border-gray-200"
                            : isToday
                              ? "bg-blue-50 border-blue-200"
                              : "bg-white border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: categoryColor }}
                              ></div>
                              <h3
                                className={`font-semibold text-xl ${
                                  isPast ? "text-gray-600" : "text-gray-800"
                                }`}
                              >
                                {event.title}
                              </h3>
                              {isToday && (
                                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                                  Today
                                </span>
                              )}
                              {isPast && (
                                <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full font-medium">
                                  Past
                                </span>
                              )}
                            </div>
                            <div
                              className={`space-y-2 text-sm ${
                                isPast ? "text-gray-500" : "text-gray-600"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>📅</span>
                                <span className="font-medium">
                                  {eventDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <span>🕐</span>
                                  <span className="font-medium">
                                    {event.startTime} - {event.endTime}
                                  </span>
                                </div>
                                {event.duration && (
                                  <div className="flex items-center gap-2">
                                    <span>⏱️</span>
                                    <span>{event.duration}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span>🏷️</span>
                                  <span>
                                    {getCategoryName(event.category_id)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
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
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Add Your First Event
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={confirmDialog.onCancel}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium transition-all duration-200 rounded-lg border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
