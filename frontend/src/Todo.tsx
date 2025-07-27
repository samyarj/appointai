import React, { useState, useEffect } from "react";
import { fetchAPI } from "./api";

type TodoItem = {
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

const Todo: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "created">(
    "priority"
  );
  const [newTodo, setNewTodo] = useState<Partial<TodoItem>>({
    title: "",
    description: "",
    priority: "medium",
    estimated_duration: "",
    due_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAPI("/api/todos")
      .then(data => {
        setTodos(data);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const priorityColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  };

  const priorityOrder = { high: 3, medium: 2, low: 1 };

  const handleAddTodo = () => {
    if (!newTodo.title?.trim()) return;

    const todo: TodoItem = {
      id: Math.max(...todos.map(t => t.id), 0) + 1,
      title: newTodo.title.trim(),
      description: newTodo.description || "",
      priority: newTodo.priority || "medium",
      category_id: newTodo.category_id || 1,
      estimated_duration: newTodo.estimated_duration || "1 hour",
      due_date: newTodo.due_date || undefined,
      completed: false,
      created_at: new Date().toISOString(),
    };

    setTodos([...todos, todo]);
    setNewTodo({
      title: "",
      description: "",
      priority: "medium",
      estimated_duration: "",
      due_date: "",
    });
    setShowAddForm(false);
  };

  const handleToggleComplete = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const getFilteredAndSortedTodos = () => {
    let filtered = todos;

    // Apply filter
    if (filter === "pending") {
      filtered = todos.filter(todo => !todo.completed);
    } else if (filter === "completed") {
      filtered = todos.filter(todo => todo.completed);
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === "priority") {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortBy === "dueDate") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortBy === "created") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return 0;
    });

    return filtered;
  };

  const getStats = () => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(
      t => !t.completed && t.due_date && new Date(t.due_date) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const filteredTodos = getFilteredAndSortedTodos();
  const stats = getStats();

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Todo List</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Todo
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 text-sm">Total</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 text-sm">
                Completed
              </h3>
              <p className="text-2xl font-bold text-green-900">
                {stats.completed}
              </p>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 text-sm">Pending</h3>
              <p className="text-2xl font-bold text-yellow-900">
                {stats.pending}
              </p>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 text-sm">Overdue</h3>
              <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600">
                Filter:
              </label>
              <select
                value={filter}
                onChange={e =>
                  setFilter(e.target.value as "all" | "pending" | "completed")
                }
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={e =>
                  setSortBy(
                    e.target.value as "priority" | "dueDate" | "created"
                  )
                }
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="created">Created</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredTodos.length} todos
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4 animate-spin">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <p className="text-gray-500">Loading todos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <p className="text-gray-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredTodos.length > 0 ? (
            <div className="space-y-4">
              {filteredTodos.map(todo => {
                const isOverdue =
                  todo.due_date &&
                  new Date(todo.due_date) < new Date() &&
                  !todo.completed;

                return (
                  <div
                    key={todo.id}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      todo.completed
                        ? "bg-gray-50 border-gray-200 opacity-75"
                        : isOverdue
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-gray-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleComplete(todo.id)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                      >
                        {todo.completed && (
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3
                            className={`font-semibold ${
                              todo.completed
                                ? "line-through text-gray-500"
                                : "text-gray-800"
                            }`}
                          >
                            {todo.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${
                              priorityColors[todo.priority || "medium"]
                            }`}
                          >
                            {todo.priority}
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {todo.category_id}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                              Overdue
                            </span>
                          )}
                        </div>

                        {todo.description && (
                          <p
                            className={`text-sm mb-2 ${
                              todo.completed ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {todo.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>📅 Duration: {todo.estimated_duration}</span>
                          {todo.due_date && (
                            <span>
                              🗓️ Due:{" "}
                              {new Date(todo.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span>
                            🕒 Created:{" "}
                            {new Date(
                              todo.created_at || ""
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                No todos found
              </h3>
              <p className="text-gray-400 mb-6">
                Create your first todo to get started
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Todo Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Add New Todo
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTodo.title || ""}
                  onChange={e =>
                    setNewTodo({ ...newTodo, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter todo title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTodo.description || ""}
                  onChange={e =>
                    setNewTodo({ ...newTodo, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTodo.priority || "medium"}
                    onChange={e =>
                      setNewTodo({
                        ...newTodo,
                        priority: e.target.value as TodoItem["priority"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newTodo.category_id || ""}
                    onChange={e =>
                      setNewTodo({ ...newTodo, category_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Work, Personal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={newTodo.estimated_duration || ""}
                    onChange={e =>
                      setNewTodo({
                        ...newTodo,
                        estimated_duration: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1 hour"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTodo.due_date || ""}
                    onChange={e =>
                      setNewTodo({ ...newTodo, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTodo}
                disabled={!newTodo.title?.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Todo;
