import React, { useState, useEffect } from "react";
import { eventAPI, categoryAPI } from "../api";
import { useRefresh } from "../contexts/RefreshContext";
import { RRule } from "rrule";

import type { Event, Category } from "../types";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EventStats } from "../components/events/EventStats";
import { EventForm } from "../components/events/EventForm";
import { EventList } from "../components/events/EventList";

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
  const [recurrenceType, setRecurrenceType] = useState<
    "NONE" | "DAILY" | "WEEKLY" | "MONTHLY"
  >("NONE");
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
    onConfirm?: () => void;
    onCancel: () => void;
    buttons?: { label: string; action: () => void; className: string }[];
  }>({
    isOpen: false,
    title: "",
    message: "",
    onCancel: () => {},
  });
  
  const [expandedSeries, setExpandedSeries] = useState<Record<number, boolean>>({});
  const { refreshKey } = useRefresh();

  const toggleSeries = (id: number) => {
    setExpandedSeries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    loadEvents();
    loadCategories();

    const handleRefresh = () => {
      loadEvents();
      loadCategories();
    };
    window.addEventListener("refresh_data", handleRefresh);
    return () => window.removeEventListener("refresh_data", handleRefresh);
  }, [refreshKey]);

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
    const limitDate = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate()
    );

    rawEvents.forEach(event => {
      // Always add the original event (or its base instance)
      expanded.push(event);

      if (event.is_recurring && event.recurrence_rule) {
        try {
          const parts = event.recurrence_rule.split("|");
          const ruleOptions = RRule.parseString(parts[0]);
          const exdatesStr = parts[1] || "";
          let exdates: string[] = [];
          
          if (exdatesStr.startsWith("EXDATE=")) {
            exdates = exdatesStr.substring(7).split(",");
          }

          // Ensure DTSTART is set to event date for correct calculations
          // Note: rrule doesn't handle timezones perfectly with strings, working with local dates here
          const [year, month, day] = event.date.split("-").map(Number);
          ruleOptions.dtstart = new Date(year, month - 1, day);

          const rule = new RRule(ruleOptions);
          // Use dtstart to include all occurrences
          const occurrences = rule.between(
            ruleOptions.dtstart,
            limitDate,
            true
          );

          occurrences.forEach((date, index) => {
            // format YYYY-MM-DD
            const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time usually

            if (dateStr === event.date) return; // Skip original date
            if (exdates.includes(dateStr)) return; // Skip deleted instances

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

  // Helper function to show standard confirmation dialog
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
      buttons: undefined,
    });
  };

  // Helper for multi-option dialog
  const showOptionsDialog = (
    title: string,
    message: string,
    buttons: { label: string; action: () => void; className: string }[]
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      buttons,
    });
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return "";

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    let durationMin = endTotalMin - startTotalMin;
    if (durationMin < 0) durationMin += 24 * 60;
    if (durationMin === 0) return "";


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
        const parts = [`FREQ=${recurrenceType}`, `INTERVAL=1`];
        if (recurrenceEnd) {
          // Format date to YYYYMMDD for RRULE UNTIL
          const endDate = new Date(recurrenceEnd);
          const yyyy = endDate.getFullYear();
          const mm = String(endDate.getMonth() + 1).padStart(2, "0");
          const dd = String(endDate.getDate()).padStart(2, "0");
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
    const isInstance = !!event.original_event_id;
    
    if (isInstance || event.is_recurring) {
      const original = isInstance ? events.find(e => e.id === event.original_event_id) : event;
      if (!original) return;

      showOptionsDialog(
        "Edit Recurring Event",
        "You are editing a recurring event series.",
        [
          {
            label: "Apply to this event only",
            action: () => {
              alert("Editing a single instance is not fully supported yet by the backend API. Only full series edits will be properly saved right now.");
              // For demonstration purposes we let them open the form anyway to edit the series, but standard UI calls for letting them see the form
              openEditForm(original);
            },
            className: "w-full py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
          },
          {
            label: "Apply to all future events in series",
            action: () => {
              openEditForm(original);
            },
            className: "w-full py-2.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg font-medium transition-colors shadow-sm"
          }
        ]
      );
    } else {
      openEditForm(event);
    }
  };

  const openEditForm = (event: Event) => {

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
        const parts = [`FREQ=${recurrenceType}`, `INTERVAL=1`];
        if (recurrenceEnd) {
          const endDate = new Date(recurrenceEnd);
          const yyyy = endDate.getFullYear();
          const mm = String(endDate.getMonth() + 1).padStart(2, "0");
          const dd = String(endDate.getDate()).padStart(2, "0");
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

      await eventAPI.updateEvent(editingEvent.id, eventData);

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
    const event = events.find(e => e.id === id);
    if (!event) return;

    const isInstance = !!event.original_event_id;
    const targetId = event.original_event_id || event.id;
    const eventName = event.title;

    const execDeleteAll = async () => {
      setActionStatus({ type: "loading", message: "Deleting entire series..." });
      try {
        await eventAPI.deleteEvent(targetId);
        await loadEvents();
        showStatus("success", "Event series deleted successfully!");
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to delete series";
        showStatus("error", errorMessage);
      }
    };

    const execDeleteSingle = async () => {
      const originalEvent = isInstance ? events.find(e => e.id === targetId) : event;
      if (!originalEvent) return;
      
      // If we are deleting the very first instance, we should ideally shift DTSTART or re-create event.
      // For now, simpler approach: we add it to the EXDATE list
      
      setActionStatus({ type: "loading", message: "Deleting instance..." });
      try {
        const parts = (originalEvent.recurrence_rule || "").split('|');
        let rrulePart = parts[0];
        let exdatesPart = parts[1] || "EXDATE=";
        
        if (exdatesPart === "EXDATE=") {
          exdatesPart += event.date;
        } else {
          // Check if already in it
          if (!exdatesPart.includes(event.date)) {
            exdatesPart += "," + event.date;
          }
        }
        
        const newRule = `${rrulePart}|${exdatesPart}`;
        
        await eventAPI.updateEvent(targetId, { recurrence_rule: newRule });
        await loadEvents();
        showStatus("success", "Instance deleted successfully!");
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to delete instance";
        showStatus("error", errorMessage);
      }
    };

    if (isInstance || event.is_recurring) {
      showOptionsDialog(
        "Delete Recurring Event",
        `"${eventName}" is part of a recurring series. How would you like to delete?`,
        [
          {
            label: "Delete this event only",
            action: execDeleteSingle,
            className: "w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
          },
          {
            label: "Delete all events in series",
            action: execDeleteAll,
            className: "w-full py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-lg font-medium transition-colors shadow-sm"
          }
        ]
      );
    } else {
      showConfirmDialog(
        "Delete Event",
        `Are you sure you want to delete "${eventName}"? This action cannot be undone.`,
        execDeleteAll
      );
    }
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

  const getCategoryColor = (categoryId?: number): string => {
    if (!categoryId) return "#6B7280";
    const category = categories.find(c => c.id === categoryId);
    return category?.color || "#6B7280";
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Events
            </h1>
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

          <EventStats stats={stats} />

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
                <EventForm
                  newEvent={newEvent}
                  setNewEvent={setNewEvent}
                  categories={categories}
                  editingEvent={editingEvent}
                  recurrenceType={recurrenceType}
                  setRecurrenceType={setRecurrenceType}
                  recurrenceEnd={recurrenceEnd}
                  setRecurrenceEnd={setRecurrenceEnd}
                  onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
                  onCancel={() => {
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
                />
              )}

              <EventList
                events={filteredEvents}
                allEvents={events}
                today={today}
                getCategoryName={getCategoryName}
                getCategoryColor={getCategoryColor}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                expandedSeries={expandedSeries}
                toggleSeries={toggleSeries}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
        buttons={
          confirmDialog.buttons?.map(btn => ({
            ...btn,
            action: () => {
              btn.action();
              setConfirmDialog(p => ({ ...p, isOpen: false }));
            },
          }))
        }
      />
    </>
  );
};

export default Events;
