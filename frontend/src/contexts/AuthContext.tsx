import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  authAPI,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  removeAuthToken,
  setAuthToken,
} from "../api";

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  join_date?: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  theme?: string;
  notifications?: any;
  privacy?: any;
  is_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already logged in
        const storedUser = getUserInfo();
        if (storedUser) {
          // Verify token is still valid by fetching current user
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        // Token is invalid, clear stored data
        removeUserInfo();
        removeAuthToken();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Apply theme when user.theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const theme = user?.theme || "light";
      const isDark =
        theme === "dark" ||
        (theme === "auto" && mediaQuery.matches);

      // Clean up legacy class on body just in case it persisted from previous versions
      document.body.classList.remove("dark");

      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    const handleSystemChange = () => {
      if (user?.theme === "auto") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const userData = {
        id: response.user_id,
        name: response.user_name,
        email: response.user_email,
      };
      setUser(userData);
      setUserInfo(userData);
      setAuthToken(response.access_token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    removeUserInfo();
    removeAuthToken();
    window.location.href = "/login";
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      setUserInfo(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
