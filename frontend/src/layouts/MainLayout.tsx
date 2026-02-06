import React, { type ReactNode } from 'react';
import Navbar from '../Navbar';
import ChatAssistant from '../components/ChatAssistant';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Navbar />
      <div className="h-full pl-20">
        <div className="h-full overflow-auto">
            {children}
        </div>
      </div>
      <ChatAssistant />
    </div>
  );
};

export default MainLayout;
