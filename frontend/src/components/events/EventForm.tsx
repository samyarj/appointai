import React from "react";
import type { Event, Category } from "../../types";

interface EventFormProps {
  newEvent: Partial<Event>;
  setNewEvent: (event: Partial<Event>) => void;
  categories: Category[];
  editingEvent: Event | null;
  recurrenceType: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  setRecurrenceType: (type: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY") => void;
  recurrenceEnd: string;
  setRecurrenceEnd: (end: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  newEvent,
  setNewEvent,
  categories,
  editingEvent,
  recurrenceType,
  setRecurrenceType,
  recurrenceEnd,
  setRecurrenceEnd,
  onCancel,
  onSubmit,
}) => {
  return (
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
            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
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
            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
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
                category_id: e.target.value ? parseInt(e.target.value) : undefined,
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
            onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
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
            onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onSubmit}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          {editingEvent ? "Update Event" : "Add Event"}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
