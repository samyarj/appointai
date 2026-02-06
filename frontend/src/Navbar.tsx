import React from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  {
    name: "Home",
    path: "/",
    color: "gray",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: "Calendar",
    path: "/calendar",
    color: "blue",
    icon: (
      <svg
        className="w-6 h-6"
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
    ),
  },
  {
    name: "Events",
    path: "/events",
    color: "green",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    name: "Todo",
    path: "/todo",
    color: "orange",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    name: "Categories",
    path: "/categories",
    color: "purple",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },
  {
    name: "Profile",
    path: "/profile",
    color: "indigo",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

const Navbar: React.FC = () => {
  const location = useLocation();

  const getColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      return {
        text: "text-white",
        bg: "bg-blue-500",
        border: "border-blue-500",
      };
    } else {
      const colorMap = {
        gray: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
        blue: "text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
        green: "text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300",
        orange: "text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300",
        purple: "text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300",
        indigo: "text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300",
      };

      return {
        text: colorMap[color as keyof typeof colorMap],
        bg: "hover:bg-blue-100 dark:hover:bg-gray-700",
        border: "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500",
      };
    }
  };

  return (
    <nav className="fixed top-0 left-0 h-full w-20 z-50 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center py-6">
        <div className="flex flex-col gap-4">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const colors = getColorClasses(item.color, isActive);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`p-4 rounded-lg transition-colors border ${colors.text} ${colors.bg} ${colors.border} dark:border-gray-700`}
                title={item.name}
              >
                <div className={isActive ? "text-white" : ""}>{item.icon}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
