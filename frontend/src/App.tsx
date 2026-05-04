import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./contexts/AuthContext";
import { RefreshProvider } from "./contexts/RefreshContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Import other pages/components
import Login from "./components/Login";
import Calendar from "./pages/CalendarPage";
import Events from "./pages/EventsPage";
import Todo from "./pages/TodoPage";
import Categories from "./pages/CategoriesPage";
import Profile from "./pages/ProfilePage";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <RefreshProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Calendar />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Events />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/todo"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Todo />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Categories />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </RefreshProvider>
    </AuthProvider>
  );
};

export default App;
