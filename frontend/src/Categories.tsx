import React, { useState, useEffect } from "react";
import { categoryAPI } from "./api";

interface Category {
  id: number;
  name: string;
  color: string;
  description: string;
  created_at: string;
  usage_count: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "usage" | "created">("name");
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: "",
    color: "#3B82F6",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryAPI.getCategories();
      setCategories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
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

  const handleAddCategory = async () => {
    if (!newCategory.name?.trim()) {
      showStatus("error", "Category name cannot be empty.");
      return;
    }

    setActionStatus({ type: "loading", message: "Creating category..." });

    try {
      const categoryData = {
        name: newCategory.name.trim(),
        color: newCategory.color || "#3B82F6",
        description: newCategory.description || "",
      };

      const createdCategory = await categoryAPI.createCategory(categoryData);

      setCategories([...categories, createdCategory]);
      setNewCategory({
        name: "",
        color: "#3B82F6",
        description: "",
      });
      setShowAddForm(false);

      showStatus("success", "Category created successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to create category";
      showStatus("error", errorMessage);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color,
      description: category.description,
    });
    setShowAddForm(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategory.name?.trim()) {
      showStatus("error", "Category name cannot be empty.");
      return;
    }

    setActionStatus({ type: "loading", message: "Updating category..." });

    try {
      const categoryData = {
        name: newCategory.name.trim(),
        color: newCategory.color || "#3B82F6",
        description: newCategory.description || "",
      };

      const updatedCategory = await categoryAPI.updateCategory(
        editingCategory.id,
        categoryData
      );

      setCategories(
        categories.map(cat =>
          cat.id === editingCategory.id ? updatedCategory : cat
        )
      );

      setEditingCategory(null);
      setNewCategory({
        name: "",
        color: "#3B82F6",
        description: "",
      });
      setShowAddForm(false);

      showStatus("success", "Category updated successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update category";
      showStatus("error", errorMessage);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      return;
    }

    setActionStatus({ type: "loading", message: "Deleting category..." });

    try {
      await categoryAPI.deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
      showStatus("success", "Category deleted successfully!");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to delete category";
      showStatus("error", errorMessage);
    }
  };

  const getSortedCategories = () => {
    return [...categories].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "usage") {
        return b.usage_count - a.usage_count;
      } else if (sortBy === "created") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return 0;
    });
  };

  const getStats = () => {
    const total = categories.length;
    const totalUsage = categories.reduce(
      (sum, cat) => sum + cat.usage_count,
      0
    );
    const mostUsed = categories.reduce(
      (max, cat) => (cat.usage_count > max.usage_count ? cat : max),
      categories[0]
    );
    const recent = categories.filter(
      cat =>
        new Date().getTime() - new Date(cat.created_at).getTime() <
        7 * 24 * 60 * 60 * 1000
    ).length;

    return { total, totalUsage, mostUsed, recent };
  };

  const sortedCategories = getSortedCategories();
  const stats = getStats();

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
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
                  Add Category
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 text-sm">Total</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs text-blue-600">Categories</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 text-sm">Usage</h3>
              <p className="text-2xl font-bold text-green-900">
                {stats.totalUsage}
              </p>
              <p className="text-xs text-green-600">Total uses</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 text-sm">
                Most Used
              </h3>
              <p className="text-2xl font-bold text-purple-900">
                {stats.mostUsed?.name || "None"}
              </p>
              <p className="text-xs text-purple-600">
                {stats.mostUsed?.usage_count || 0} uses
              </p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 text-sm">Recent</h3>
              <p className="text-2xl font-bold text-orange-900">
                {stats.recent}
              </p>
              <p className="text-xs text-orange-600">This week</p>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600">
                Sort by:
              </label>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "name"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSortBy("name")}
              >
                Name
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "usage"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSortBy("usage")}
              >
                Usage
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
              Showing {sortedCategories.length} categories
            </div>
          </div>
        </div>

        {/* Categories Grid */}
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
              <p className="text-gray-500">Loading categories...</p>
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
                Error loading categories
              </h3>
              <p className="text-gray-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Add/Edit Category Form */}
              {showAddForm && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {editingCategory ? "Edit Category" : "Add New Category"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {editingCategory
                          ? "Update your category information below"
                          : "Create a new category to organize your events and todos"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingCategory(null);
                        setNewCategory({
                          name: "",
                          color: "#3B82F6",
                          description: "",
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        value={newCategory.name || ""}
                        onChange={e =>
                          setNewCategory({
                            ...newCategory,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter category name"
                        disabled={actionStatus.type === "loading"}
                      />
                      {!newCategory.name?.trim() && (
                        <p className="text-sm text-red-500 mt-1">
                          Category name is required
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          "#3B82F6",
                          "#10B981",
                          "#F59E0B",
                          "#EF4444",
                          "#8B5CF6",
                          "#06B6D4",
                          "#84CC16",
                          "#F97316",
                          "#EC4899",
                          "#6B7280",
                        ].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() =>
                              setNewCategory({ ...newCategory, color })
                            }
                            className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                              newCategory.color === color
                                ? "border-gray-400 ring-2 ring-blue-500 ring-offset-2"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                            style={{ backgroundColor: color }}
                            disabled={actionStatus.type === "loading"}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newCategory.description || ""}
                        onChange={e =>
                          setNewCategory({
                            ...newCategory,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        rows={3}
                        placeholder="Enter description (optional)"
                        disabled={actionStatus.type === "loading"}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingCategory(null);
                        setNewCategory({
                          name: "",
                          color: "#3B82F6",
                          description: "",
                        });
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={actionStatus.type === "loading"}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={
                        editingCategory
                          ? handleUpdateCategory
                          : handleAddCategory
                      }
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                      disabled={
                        actionStatus.type === "loading" ||
                        !newCategory.name?.trim()
                      }
                    >
                      {actionStatus.type === "loading" ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingCategory ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        `${editingCategory ? "Update" : "Create"} Category`
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              {sortedCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedCategories.map(category => (
                    <div
                      key={category.id}
                      className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:border-blue-200 hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-200"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                            {category.name}
                          </h3>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleEditCategory(category);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit category"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete category"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
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

                      {category.description && (
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {category.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-100">
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          {category.usage_count} uses
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(category.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14-7H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No categories found
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Create your first category to organize your events and
                    todos.
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Your First Category
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
