import React from "react";
import type { Todo, Category } from "../../types";

interface TodoFormProps {
  newTodo: Partial<Todo>;
  setNewTodo: (todo: Partial<Todo>) => void;
  categories: Category[];
  editingTodo: Todo | null;
  onCancel: () => void;
  onSubmit: () => void;
}

export const TodoForm: React.FC<TodoFormProps> = ({
  newTodo,
  setNewTodo,
  categories,
  editingTodo,
  onCancel,
  onSubmit,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border-2 border-blue-200 dark:border-gray-600 rounded-xl p-6 mb-6 shadow-lg animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {editingTodo ? "Edit Todo" : "Add New Todo"}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={newTodo.title || ""}
            onChange={e => setNewTodo({ ...newTodo, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter todo title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            value={newTodo.priority || "medium"}
            onChange={e =>
              setNewTodo({
                ...newTodo,
                priority: e.target.value as Todo["priority"],
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={newTodo.description || ""}
            onChange={e =>
              setNewTodo({ ...newTodo, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter description (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={newTodo.category_id || ""}
            onChange={e =>
              setNewTodo({
                ...newTodo,
                category_id: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category (optional)</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estimated Duration
          </label>
          <input
            type="text"
            value={newTodo.estimated_duration || ""}
            onChange={e =>
              setNewTodo({ ...newTodo, estimated_duration: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2 hours, 30 min"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={newTodo.due_date || ""}
            onChange={e => setNewTodo({ ...newTodo, due_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!newTodo.title?.trim()}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {editingTodo ? "Update Todo" : "Add Todo"}
        </button>
      </div>
    </div>
  );
};
