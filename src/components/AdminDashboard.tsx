import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { BarChart3, Bell, LogOut, Search, Plus, Edit, Trash2, Star, Folder, Book, Users, History, LayoutDashboard, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MemberModal from './MemberModal';
import IssueBookModal from './IssueBookModal';
import BookModal from './BookModal';
import ManageCategoriesForm from './ManageCategoriesForm';
import CirculationTable from './CirculationTable';
import BookListTable from './BookListTable';
import { AnimatePresence, motion } from 'framer-motion';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'Dashboard' | 'Circulation' | 'Library' | 'Members' | 'Feedback' | 'History';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const tabs: { name: TabType; icon: React.ElementType }[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Circulation', icon: Book },
    { name: 'Library', icon: Folder },
    { name: 'Members', icon: Users },
    { name: 'Feedback', icon: Star },
    { name: 'History', icon: History },
  ];

  const renderContent = () => {
    // In a real app, you would have separate components for each tab
    // For brevity, we'll just show the tab name
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{activeTab}</h1>
        <div className="mt-6">
          {/* Placeholder for tab content */}
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <p>Content for {activeTab} goes here.</p>
          </div>
        </div>
      </div>
    );
  };

  const Sidebar = () => (
    <aside className="bg-neutral-900 text-neutral-100 w-64 min-h-screen flex flex-col fixed lg:relative lg:translate-x-0 transform -translate-x-full lg:transition-none transition-transform duration-300 ease-in-out z-50">
      <div className="flex items-center justify-center h-20 border-b border-neutral-800">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {tabs.map(tab => (
          <button
            key={tab.name}
            onClick={() => {
              setActiveTab(tab.name);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.name
                ? 'bg-primary text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <tab.icon size={20} />
            <span>{tab.name}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-neutral-100">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <div className={`fixed lg:relative lg:translate-x-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50`}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-600">
            <Menu size={24} />
          </button>
          <div className="flex-1 hidden lg:block">
            {/* Can have breadcrumbs or search here */}
          </div>
          <div className="flex items-center gap-4">
            <button className="text-neutral-500 hover:text-primary"><BarChart3 size={22} /></button>
            <button className="text-neutral-500 hover:text-primary relative">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-6 bg-neutral-200"></div>
            <div className="flex items-center gap-3">
              <img src={`https://ui-avatars.com/api/?name=Admin&background=E0E7FF&color=4F46E5&bold=true`} alt="Admin" className="w-9 h-9 rounded-full"/>
              <div>
                <p className="text-sm font-semibold text-neutral-800">Admin</p>
                <p className="text-xs text-neutral-500">System Administrator</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {/* This is where the content for each tab will be rendered */}
          {/* For now, it's just a placeholder */}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
