import React from "react";
import type { Event } from "../../types";

interface EventListProps {
  events: Event[];
  allEvents: Event[]; // For finding children/parents
  today: Date;
  getCategoryName: (id?: number) => string;
  getCategoryColor: (id?: number) => string;
  onEdit: (event: Event) => void;
  onDelete: (id: number) => void;
  expandedSeries: Record<number, boolean>;
  toggleSeries: (id: number) => void;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  allEvents,
  today,
  getCategoryName,
  getCategoryColor,
  onEdit,
  onDelete,
  expandedSeries,
  toggleSeries,
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
          No events found
        </h3>
        <p className="text-gray-400 dark:text-gray-500 mb-6">
          There are no events matching your filter.
        </p>
      </div>
    );
  }

  const groupedEvents: { parent: Event; children: Event[] }[] = [];
  const seenParents = new Set<number>();

  events.forEach(event => {
    const parentId = event.original_event_id || event.id;
    if (!seenParents.has(parentId)) {
      seenParents.add(parentId);
      const parentEvent = allEvents.find(e => e.id === parentId) || event;
      const children = allEvents.filter(e => e.original_event_id === parentId);
      children.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      groupedEvents.push({ parent: parentEvent, children });
    }
  });

  return (
    <div className="space-y-4">
      {groupedEvents.map(({ parent, children }) => {
        const eventDate = new Date(parent.date + "T00:00:00");
        const isPast = eventDate < today;
        const isToday = eventDate.toDateString() === today.toDateString();
        const categoryColor = getCategoryColor(parent.category_id);
        const hasChildren = parent.is_recurring && children.length > 0;
        const isExpanded = expandedSeries[parent.id];

        return (
          <div key={parent.id} className="mb-4">
            <div
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
                    {hasChildren && (
                      <button
                        onClick={() => toggleSeries(parent.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        title={isExpanded ? "Collapse series" : "Expand series"}
                      >
                        {isExpanded ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    ></div>
                    <h3
                      className={`font-semibold text-xl ${
                        isPast
                          ? "text-gray-600 dark:text-gray-500"
                          : "text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {parent.title}
                    </h3>
                    {hasChildren && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs rounded-full font-medium flex items-center gap-1">
                        🔁 Series ({children.length + 1})
                      </span>
                    )}
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
                      hasChildren ? "ml-10" : ""
                    } ${
                      isPast
                        ? "text-gray-500 dark:text-gray-500"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span className="font-medium">
                        {hasChildren ? "Starts: " : ""}
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
                          {parent.startTime} - {parent.endTime}
                        </span>
                      </div>

                      {parent.duration && (
                        <div className="flex items-center gap-2">
                          <span>⏱️</span>
                          <span>{parent.duration}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span>🏷️</span>
                        <span>{getCategoryName(parent.category_id)}</span>
                      </div>

                      {parent.is_recurring && (
                        <div
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
                          title={`Recurs: ${parent.recurrence_rule}`}
                        >
                          <span>🔁</span>
                          <span className="text-xs">
                            {parent.recurrence_rule?.includes("DAILY")
                              ? "Daily"
                              : parent.recurrence_rule?.includes("WEEKLY")
                                ? "Weekly"
                                : parent.recurrence_rule?.includes("MONTHLY")
                                  ? "Monthly"
                                  : "Recurring"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4 self-center">
                  <button
                    onClick={() => onEdit(parent)}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm hover:shadow"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(parent.id)}
                    className="px-4 py-2 bg-red-400 text-white text-sm rounded-lg hover:bg-red-500 transition-colors font-medium shadow-sm hover:shadow"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Render Children if expanded */}
            {isExpanded && hasChildren && (
              <div className="mt-3 ml-6 pl-6 border-l-2 border-gray-200 dark:border-gray-700/50 space-y-3">
                {children.map(child => {
                  const childDate = new Date(child.date + "T00:00:00");
                  const cIsPast = childDate < today;
                  const cIsToday =
                    childDate.toDateString() === today.toDateString();

                  return (
                    <div
                      key={child.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        cIsPast
                          ? "bg-gray-50 border-gray-100 dark:bg-gray-800/20 dark:border-gray-700/50 text-gray-400 dark:text-gray-500"
                          : cIsToday
                            ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30 text-blue-800 dark:text-blue-300"
                            : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md">
                          <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 leading-none mb-1">
                            {childDate.toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {childDate.getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {childDate.toLocaleDateString("en-US", {
                              weekday: "long",
                            })}
                            {cIsToday && (
                              <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="text-sm opacity-80 flex items-center gap-1">
                            <span>🕐</span> {child.startTime} - {child.endTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-50 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(child)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                          title="Edit this occurrence"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(child.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                          title="Delete this occurrence"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
