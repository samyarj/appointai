import React, { useState, useEffect } from "react";
import { todoAPI, categoryAPI } from "../api";
import { useRefresh } from "../contexts/RefreshContext";

import type { Todo as TodoItem, Category } from "../types";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { TodoStats } from "../components/todos/TodoStats";
import { TodoForm } from "../components/todos/TodoForm";

const Todo: React.FC = () => {
  const { refreshKey } = useRefresh();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
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

  useEffect(() => {
    loadTodos();
    loadCategories();
  }, [refreshKey]);

  const loadTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await todoAPI.getTodos();
      setTodos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load todos");
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

  const handleAddTodo = async () => {
    if (!newTodo.title?.trim()) {
      showStatus("error", "Todo title cannot be empty.");
      return;
    }

    setActionStatus({ type: "loading", message: "Creating todo..." });

    try {
      const todoData = {
        title: newTodo.title.trim(),
        description: newTodo.description || "",
        priority: newTodo.priority || "medium",
        estimated_duration: newTodo.estimated_duration || "",
        due_date: newTodo.due_date || "",
        category_id: newTodo.category_id,
      };

      const createdTodo = await todoAPI.createTodo(todoData);
      setTodos([...todos, createdTodo]);
      setNewTodo({
        title: "",
        description: "",
        priority: "medium",
        estimated_duration: "",
        due_date: "",
        category_id: undefined,
      });
      setShowAddForm(false);
      showStatus("success", "Todo created successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to create todo";
      showStatus("error", errorMessage);
    }
  };

  const handleEditTodo = (todo: TodoItem) => {
    setEditingTodo(todo);
    setNewTodo({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      estimated_duration: todo.estimated_duration,
      due_date: todo.due_date,
      category_id: todo.category_id,
    });
    setShowAddForm(true);
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo || !newTodo.title?.trim()) {
      showStatus("error", "Todo title cannot be empty.");
      return;
    }

    setActionStatus({ type: "loading", message: "Updating todo..." });

    try {
      const todoData = {
        title: newTodo.title.trim(),
        description: newTodo.description || "",
        priority: newTodo.priority || "medium",
        estimated_duration: newTodo.estimated_duration || "",
        due_date: newTodo.due_date || "",
        category_id: newTodo.category_id,
      };

      const updatedTodo = await todoAPI.updateTodo(editingTodo.id, todoData);
      setTodos(
        todos.map(todo => (todo.id === editingTodo.id ? updatedTodo : todo))
      );
      setEditingTodo(null);
      setNewTodo({
        title: "",
        description: "",
        priority: "medium",
        estimated_duration: "",
        due_date: "",
        category_id: undefined,
      });
      setShowAddForm(false);
      showStatus("success", "Todo updated successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update todo";
      showStatus("error", errorMessage);
    }
  };

  const handleToggleComplete = async (todo: TodoItem) => {
    setActionStatus({ type: "loading", message: "Updating todo..." });
    try {
      const updatedTodo = await todoAPI.updateTodo(todo.id, {
        completed: !todo.completed,
      });
      setTodos(todos.map(t => (t.id === todo.id ? updatedTodo : t)));
      showStatus(
        "success",
        `Todo marked as ${!todo.completed ? "completed" : "pending"}!`
      );
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update todo";
      showStatus("error", errorMessage);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    const todoName = todo ? todo.title : "this todo";

    showConfirmDialog(
      "Delete Todo",
      `Are you sure you want to delete "${todoName}"? This action cannot be undone.`,
      async () => {
        setActionStatus({ type: "loading", message: "Deleting todo..." });

        try {
          await todoAPI.deleteTodo(id);
          setTodos(todos.filter(todo => todo.id !== id));
          showStatus("success", "Todo deleted successfully!");
        } catch (e) {
          const errorMessage =
            e instanceof Error ? e.message : "Failed to delete todo";
          showStatus("error", errorMessage);
        }
      }
    );
  };

  const priorityColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  };

  const priorityOrder = { high: 3, medium: 2, low: 1 };

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
        const aPriority = a.priority || "medium";
        const bPriority = b.priority || "medium";
        return priorityOrder[bPriority] - priorityOrder[aPriority];
      } else if (sortBy === "dueDate") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
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
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(
      t => !t.completed && t.due_date && new Date(t.due_date) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Unknown";
  };

  const filteredTodos = getFilteredAndSortedTodos();
  const stats = getStats();

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Todo List
            </h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showAddForm
                  ? "bg-gray-500 text-white hover:bg-gray-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {showAddForm ? (
                <>
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
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
                </>
              )}
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
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {actionStatus.message}
                </div>
              )}
              {actionStatus.type === "error" && (
                <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {actionStatus.message}
                </div>
              )}
            </div>
          )}

          <TodoStats stats={stats} />

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Filter:
              </label>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === "pending"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilter("pending")}
              >
                Pending
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === "completed"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
            </div>
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sort by:
              </label>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "priority"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSortBy("priority")}
              >
                Priority
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "dueDate"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSortBy("dueDate")}
              >
                Due Date
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
              Showing {filteredTodos.length} todos
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-spin"
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
              <p className="text-gray-500">Loading todos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-red-400 mx-auto mb-4"
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
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                Error loading todos
              </h3>
              <p className="text-gray-400">{error}</p>
              <button
                onClick={loadTodos}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Add/Edit Todo Form */}
              {showAddForm && (
                <TodoForm
                  newTodo={newTodo}
                  setNewTodo={setNewTodo}
                  categories={categories}
                  editingTodo={editingTodo}
                  onCancel={() => {
                    setShowAddForm(false);
                    setEditingTodo(null);
                    setNewTodo({
                      title: "",
                      description: "",
                      priority: "medium",
                      estimated_duration: "",
                      due_date: "",
                      category_id: undefined,
                    });
                  }}
                  onSubmit={editingTodo ? handleUpdateTodo : handleAddTodo}
                />
              )}

              {/* Todos List */}
              {filteredTodos.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredTodos.map(todo => {
                    const isOverdue =
                      todo.due_date &&
                      new Date(todo.due_date) < new Date() &&
                      !todo.completed;

                    return (
                      <div
                        key={todo.id}
                        className={`group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-700 hover:-translate-y-1 ${
                          todo.completed
                            ? "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-75"
                            : isOverdue
                              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40"
                              : ""
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => handleToggleComplete(todo)}
                            className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              todo.completed
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-400 text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {todo.completed && (
                              <svg
                                className="w-4 h-4"
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
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h3
                                className={`text-lg font-semibold ${
                                  todo.completed
                                    ? "line-through text-gray-500 dark:text-gray-500"
                                    : "text-gray-800 dark:text-gray-100"
                                }`}
                              >
                                {todo.title}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full border ${
                                  priorityColors[todo.priority || "medium"]
                                }`}
                              >
                                {todo.priority || "Medium"}
                              </span>
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                                {getCategoryName(todo.category_id)}
                              </span>
                              {isOverdue && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                                  Overdue
                                </span>
                              )}
                            </div>

                            {todo.description && (
                              <p
                                className={`text-sm mb-3 ${
                                  todo.completed
                                    ? "text-gray-400 dark:text-gray-500"
                                    : "text-gray-600 dark:text-gray-300"
                                }`}
                              >
                                {todo.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {todo.estimated_duration && (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {todo.estimated_duration}
                                </span>
                              )}
                              {todo.due_date && (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Due:{" "}
                                  {new Date(todo.due_date).toLocaleDateString()}
                                </span>
                              )}
                              {todo.createdAt && (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Created:{" "}
                                  {new Date(
                                    todo.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditTodo(todo)}
                              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                              title="Edit todo"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete todo"
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">
                    📝
                  </div>
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                    No todos found
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500 mb-6">
                    {filter === "all"
                      ? "Create your first todo to get started"
                      : `No ${filter} todos found`}
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Todo
                  </button>
                </div>
              )}
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
      />
    </>
  );
};

export default Todo;
