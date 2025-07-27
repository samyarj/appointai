import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import App from "./App";
import Calendar from "./Calendar";
import Events from "./Events";
import Todo from "./Todo";
import Categories from "./Categories";
import Profile from "./Profile";
import Navbar from "./Navbar";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const Root: React.FC = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
                <Navbar />
                <div className="h-full pl-20">
                  <App />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
                <Navbar />
                <div className="h-full pl-20">
                  <div className="h-full overflow-hidden">
                    <Calendar />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
                <Navbar />
                <div className="h-full pl-20">
                  <div className="h-full overflow-hidden">
                    <Events />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/todo"
          element={
            <ProtectedRoute>
              <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
                <Navbar />
                <div className="h-full pl-20">
                  <div className="h-full overflow-hidden">
                    <Todo />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
                <Navbar />
                <div className="h-full pl-20">
                  <div className="h-full overflow-hidden">
                    <Categories />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
                <Navbar />
                <div className="h-full pl-20">
                  <div className="h-full overflow-hidden">
                    <Profile />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </AuthProvider>
);

export default Root;
