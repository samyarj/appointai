import React, { useState } from "react";

interface Category {
  id: number;
  name: string;
  color: string;
  description: string;
  createdAt: Date;
  usageCount: number;
}

// Sample categories data
const initialCategories: Category[] = [
  {
    id: 1,
    name: "Work",
    color: "#3B82F6",
    description: "Work-related events and tasks",
    createdAt: new Date("2025-07-01"),
    usageCount: 15,
  },
  {
    id: 2,
    name: "Personal",
    color: "#10B981",
    description: "Personal activities and appointments",
    createdAt: new Date("2025-07-05"),
    usageCount: 8,
  },
  {
    id: 3,
    name: "Health",
    color: "#F59E0B",
    description: "Medical appointments and health activities",
    createdAt: new Date("2025-07-10"),
    usageCount: 5,
  },
  {
    id: 4,
    name: "Family",
    color: "#EF4444",
    description: "Family events and gatherings",
    createdAt: new Date("2025-07-15"),
    usageCount: 12,
  },
  {
    id: 5,
    name: "Education",
    color: "#8B5CF6",
    description: "Learning and educational activities",
    createdAt: new Date("2025-07-20"),
    usageCount: 3,
  },
];

const predefinedColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#EC4899", // Pink
  "#6B7280", // Gray
];

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "usage" | "created">("name");
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: "",
    color: predefinedColors[0],
    description: "",
  });

  const handleAddCategory = () => {
    if (!newCategory.name?.trim()) return;

    const category: Category = {
      id: Math.max(...categories.map(c => c.id), 0) + 1,
      name: newCategory.name.trim(),
      color: newCategory.color || predefinedColors[0],
      description: newCategory.description || "",
      createdAt: new Date(),
      usageCount: 0,
    };

    setCategories([...categories, category]);
    setNewCategory({
      name: "",
      color: predefinedColors[0],
      description: "",
    });
    setShowAddForm(false);
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

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name?.trim()) return;

    setCategories(categories.map(cat => 
      cat.id === editingCategory.id 
        ? {
            ...cat,
            name: newCategory.name!.trim(),
            color: newCategory.color || predefinedColors[0],
            description: newCategory.description || "",
          }
        : cat
    ));

    setEditingCategory(null);
    setNewCategory({
      name: "",
      color: predefinedColors[0],
      description: "",
    });
    setShowAddForm(false);
  };

  const handleDeleteCategory = (id: number) => {
    if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const getSortedCategories = () => {
    return [...categories].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "usage") {
        return b.usageCount - a.usageCount;
      } else if (sortBy === "created") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return 0;
    });
  };

  const getStats = () => {
    const total = categories.length;
    const totalUsage = categories.reduce((sum, cat) => sum + cat.usageCount, 0);
    const mostUsed = categories.reduce((max, cat) => 
      cat.usageCount > max.usageCount ? cat : max, categories[0]);
    const recent = categories.filter(cat => 
      (new Date().getTime() - cat.createdAt.getTime()) < (7 * 24 * 60 * 60 * 1000)
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
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 text-sm">Total</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs text-blue-600">Categories</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 text-sm">Usage</h3>
              <p className="text-2xl font-bold text-green-900">{stats.totalUsage}</p>
              <p className="text-xs text-green-600">Total uses</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 text-sm">Most Used</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.mostUsed?.name || "None"}</p>
              <p className="text-xs text-purple-600">{stats.mostUsed?.usageCount || 0} uses</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 text-sm">Recent</h3>
              <p className="text-2xl font-bold text-orange-900">{stats.recent}</p>
              <p className="text-xs text-orange-600">This week</p>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-600">Sort by:</label>
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
          {sortedCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <h3 className="font-semibold text-gray-800 text-lg">{category.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{category.usageCount} uses</span>
                    <span>Created {category.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-500 mb-2">No categories found</h3>
              <p className="text-gray-400">Create your first category to organize your events and todos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name || ""}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategory.description || ""}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        newCategory.color === color
                          ? "border-gray-400 ring-2 ring-blue-500"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                  setNewCategory({
                    name: "",
                    color: predefinedColors[0],
                    description: "",
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {editingCategory ? "Update" : "Add"} Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
