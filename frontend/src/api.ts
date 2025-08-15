// Centralized API utility for frontend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Get token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

// Set token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

// Remove token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem("authToken");
};

// Get user info from localStorage
export const getUserInfo = (): {
  id: number;
  name: string;
  email: string;
} | null => {
  const userStr = localStorage.getItem("userInfo");
  return userStr ? JSON.parse(userStr) : null;
};

// Set user info in localStorage
export const setUserInfo = (userInfo: {
  id: number;
  name: string;
  email: string;
}): void => {
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
};

// Remove user info from localStorage
export const removeUserInfo = (): void => {
  localStorage.removeItem("userInfo");
};

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Merge with existing headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    // Token expired or invalid, redirect to login
    removeAuthToken();
    removeUserInfo();
    window.location.href = "/login";
    throw new Error("Authentication required");
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
}

// Authentication specific API calls
export const authAPI = {
  // Login with email and password
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return response.json();
  },

  // Register new user
  register: async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return response.json();
  },

  // Get current user info
  getCurrentUser: async () => {
    return await fetchAPI("/api/auth/me");
  },

  // Update user profile
  updateProfile: async (
    profileData: Partial<{
      name: string;
      email: string;
      timezone: string;
      date_format: string;
      time_format: string;
      theme: string;
      notifications: {
        email: boolean;
        push: boolean;
        reminders: boolean;
        weeklyDigest: boolean;
      };
      privacy: {
        profileVisibility: string;
        showActivity: boolean;
      };
    }>
  ) => {
    return await fetchAPI("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Category API functions
export const categoryAPI = {
  // Get all categories
  getCategories: async () => {
    return await fetchAPI("/api/categories");
  },

  // Create a new category
  createCategory: async (categoryData: {
    name: string;
    color?: string;
    description?: string;
  }) => {
    return await fetchAPI("/api/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  // Update an existing category
  updateCategory: async (
    categoryId: number,
    categoryData: Partial<{
      name: string;
      color: string;
      description: string;
    }>
  ) => {
    return await fetchAPI(`/api/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  // Delete a category
  deleteCategory: async (categoryId: number) => {
    return await fetchAPI(`/api/categories/${categoryId}`, {
      method: "DELETE",
    });
  },
};

export default API_URL;
