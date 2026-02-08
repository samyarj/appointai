import React, { useState, useEffect } from "react";
import { eventAPI, categoryAPI } from "./api";
import { RRule, rrulestr } from "rrule";

type Event = {
  id: number;
  user_id?: number;
  category_id?: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  createdAt?: string;
  original_event_id?: number; // Helper for frontend-generated instances
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
    is_recurring: false,
    recurrence_rule: "",
  });
  const [recurrenceType, setRecurrenceType] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY">("NONE");
  const [recurrenceEnd, setRecurrenceEnd] = useState<string>("");
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
      // Expand recurring events here for the view
      const expandedEvents = expandRecurringEvents(data);
      setEvents(expandedEvents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const expandRecurringEvents = (rawEvents: Event[]): Event[] => {
    const expanded: Event[] = [];
    const now = new Date();
    // Look ahead 1 year for recurrence expansion by default
    const limitDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    rawEvents.forEach(event => {
      // Always add the original event (or its base instance)
      expanded.push(event);

      if (event.is_recurring && event.recurrence_rule) {
        try {
          const ruleOptions = RRule.parseString(event.recurrence_rule);
          
          // Ensure DTSTART is set to event date for correct calculations
          // Note: rrule doesn't handle timezones perfectly with strings, working with local dates here
          const [year, month, day] = event.date.split("-").map(Number);
          ruleOptions.dtstart = new Date(year, month - 1, day);
          
          const rule = new RRule(ruleOptions);
          // Use dtstart to include all occurrences
          const occurrences = rule.between(ruleOptions.dtstart, limitDate, true); 
          
          // Skip the first one if it matches the original event date (to avoid duplicates, though set logic might be better)
          // Actually, we should probably treat the "event" object as the definition, 
          // and if we want to show instances, we might just use the instances.
          // But for now, let's keep the original and add *additional* instances.
          
          occurrences.forEach((date, index) => {
             // format YYYY-MM-DD
             const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time usually
             
             if (dateStr === event.date) return; // Skip original date

             expanded.push({
               ...event,
               id: -1 * (event.id * 1000 + index), // Temporary ID for frontend key
               original_event_id: event.id,
               date: dateStr,
               // Make instances distinct looking if needed, or treated same
             });
          });

        } catch (err) {
          console.error("Failed to parse recurrence rule", err, event);
        }
      }
    });
    return expanded;
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
      
      let rrule = undefined;
      if (recurrenceType !== "NONE") {
         let parts = [`FREQ=${recurrenceType}`, `INTERVAL=1`];
         if (recurrenceEnd) {
           // Format date to YYYYMMDD for RRULE UNTIL
           const endDate = new Date(recurrenceEnd);
           const yyyy = endDate.getFullYear();
           const mm = String(endDate.getMonth() + 1).padStart(2, '0');
           const dd = String(endDate.getDate()).padStart(2, '0');
           // UNTIL expects UTC usually or floating. Let's use floating date format for now T235959
           parts.push(`UNTIL=${yyyy}${mm}${dd}T235959`);
         }
         rrule = parts.join(";");
      }

      const eventData = {
        title: newEvent.title.trim(),
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        duration: duration,
        category_id: newEvent.category_id,
        is_recurring: recurrenceType !== "NONE",
        recurrence_rule: rrule,
      };

      await eventAPI.createEvent(eventData);
      // Reload all events to get authoritative list (simplified)
      await loadEvents();
      
      setNewEvent({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        category_id: undefined,
        is_recurring: false,
        recurrence_rule: "",
      });
      setRecurrenceType("NONE");
      setRecurrenceEnd("");
      setShowAddForm(false);
      showStatus("success", "Event created successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to create event";
      showStatus("error", errorMessage);
    }
  };

  const handleEditEvent = (event: Event) => {
    if (event.original_event_id) {
        // If it's a generated instance, we should probably edit the original
        // For now, let's just warn or handle it simply finding the original
        alert("Editing a single instance of a recurring event is not fully supported yet. Please edit the original event.");
        const original = events.find(e => e.id === event.original_event_id);
        if (original) event = original;
        else return; 
    }

    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      duration: event.duration,
      category_id: event.category_id,
      is_recurring: event.is_recurring,
      recurrence_rule: event.recurrence_rule,
    });
    
    // Parse recurrence rule to set type and end date
    setRecurrenceType("NONE");
    setRecurrenceEnd("");
    
    if (event.is_recurring && event.recurrence_rule) {
      const rule = event.recurrence_rule;
      if (rule.includes("FREQ=DAILY")) setRecurrenceType("DAILY");
      else if (rule.includes("FREQ=WEEKLY")) setRecurrenceType("WEEKLY");
      else if (rule.includes("FREQ=MONTHLY")) setRecurrenceType("MONTHLY");
      
      // Parse UNTIL if present
      const match = rule.match(/UNTIL=(\d{8})/);
      if (match) {
        const dateStr = match[1];
        const yyyy = dateStr.substring(0, 4);
        const mm = dateStr.substring(4, 6);
        const dd = dateStr.substring(6, 8);
        setRecurrenceEnd(`${yyyy}-${mm}-${dd}`);
      }
    }
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
      
      let rrule = undefined;
      if (recurrenceType !== "NONE") {
         let parts = [`FREQ=${recurrenceType}`, `INTERVAL=1`];
         if (recurrenceEnd) {
           const endDate = new Date(recurrenceEnd);
           const yyyy = endDate.getFullYear();
           const mm = String(endDate.getMonth() + 1).padStart(2, '0');
           const dd = String(endDate.getDate()).padStart(2, '0');
           parts.push(`UNTIL=${yyyy}${mm}${dd}T235959`);
         }
         rrule = parts.join(";");
      }

      const eventData = {
        title: newEvent.title.trim(),
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        duration: duration,
        category_id: newEvent.category_id,
        is_recurring: recurrenceType !== "NONE",
        recurrence_rule: rrule,
      };

      await eventAPI.updateEvent(
        editingEvent.id,
        eventData
      );
      
      await loadEvents();
      
      setEditingEvent(null);
      setNewEvent({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        category_id: undefined,
        is_recurring: false,
        recurrence_rule: "",
      });
      setRecurrenceType("NONE");
      setRecurrenceEnd("");
      setShowAddForm(false);
      showStatus("success", "Event updated successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update event";
      showStatus("error", errorMessage);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    // If it's an instance, delete the original (for now)
    const event = events.find(e => e.id === id);
    if (!event) return;
    
    // Check if it's a frontend instance
    const targetId = event.original_event_id || event.id;
    const isInstance = !!event.original_event_id;
    
    const eventName = event.title;
    const message = isInstance 
       ? `This is an instance of a recurring event. Deleting it will delete the entire series "${eventName}". Continue?`
       : `Are you sure you want to delete "${eventName}"? This action cannot be undone.`;

    showConfirmDialog(
      "Delete Event",
      message,
      async () => {
        setActionStatus({ type: "loading", message: "Deleting event..." });

        try {
          await eventAPI.deleteEvent(targetId);
          // Reload to refresh list
          await loadEvents();
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

    let filtered = [...events]; // Create copy

    // Apply filter
    if (filterBy === "upcoming") {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date + "T00:00:00");
        return eventDate >= today;
      });
    } else if (filterBy === "past") {
      filtered = filtered.filter(event => {
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
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Events</h1>
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
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Total</h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Events</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-300 text-sm">Upcoming</h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.upcoming}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">Scheduled</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 dark:text-purple-300 text-sm">Past</h3>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.past}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Completed</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 dark:text-orange-300 text-sm">
                This Month
              </h3>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {stats.thisMonth}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Events</p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
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
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
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
            <div className="text-sm text-gray-500 dark:text-gray-500">
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border-2 border-blue-200 dark:border-gray-600 rounded-xl p-6 mb-6 shadow-lg animate-in slide-in-from-top-2 duration-300">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    {editingEvent ? "Edit Event" : "Add New Event"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        value={newEvent.title || ""}
                        onChange={e =>
                          setNewEvent({ ...newEvent, title: e.target.value })
                        }
                        placeholder="Enter event title"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={newEvent.date || ""}
                        onChange={e =>
                          setNewEvent({ ...newEvent, date: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Recurrence
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={recurrenceType}
                          onChange={e => setRecurrenceType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                        >
                          <option value="NONE">Does not repeat</option>
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                        </select>
                        {recurrenceType !== "NONE" && (
                          <input 
                            type="date"
                            placeholder="Until (optional)"
                            value={recurrenceEnd}
                            onChange={e => setRecurrenceEnd(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                            title="Recurrence end date (optional)"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                          is_recurring: false,
                          recurrence_rule: "",
                        });
                        setRecurrenceType("NONE");
                        setRecurrenceEnd("");
                      }}
                        className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
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
                            ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                            : isToday
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
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
                                  isPast ? "text-gray-600 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"
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
                                isPast ? "text-gray-500 dark:text-gray-500" : "text-gray-600 dark:text-gray-300"
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

                                {event.is_recurring && !event.original_event_id && (
                                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400" title={`Recurs: ${event.recurrence_rule}`}>
                                    <span>🔁</span>
                                    <span className="text-xs">
                                      {event.recurrence_rule?.includes("DAILY") ? "Daily" : 
                                       event.recurrence_rule?.includes("WEEKLY") ? "Weekly" : 
                                       event.recurrence_rule?.includes("MONTHLY") ? "Monthly" : "Recurring"}
                                    </span>
                                  </div>
                                )}
                                {event.original_event_id && (
                                  <div className="flex items-center gap-2 text-gray-400" title="Instance of recurring event">
                                     <span>↪️</span>
                                     <span className="text-xs">Recursive Instance</span>
                                  </div>
                                )}
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
                  <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                    No events found
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500 mb-6">
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
        <div className="fixed inset-0 bg-white dark:bg-black bg-opacity-80 dark:bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={confirmDialog.onCancel}
                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200 rounded-lg border border-gray-300 dark:border-gray-600"
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
    </>
  );
};

export default Events;
