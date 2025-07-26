import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import Calendar from "./Calendar";
import Events from "./Events";
import Navbar from "./Navbar";

const Root: React.FC = () => (
  <Router>
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      <Navbar />
      <div className="h-full pt-24">
        <Routes>
          <Route
            path="/"
            element={
              <div className="container mx-auto px-4 py-8 overflow-auto h-full">
                <App />
              </div>
            }
          />
          <Route
            path="/calendar"
            element={
              <div className="h-full overflow-hidden">
                <Calendar />
              </div>
            }
          />
          <Route
            path="/events"
            element={
              <div className="h-full overflow-hidden">
                <Events />
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  </Router>
);

export default Root;
