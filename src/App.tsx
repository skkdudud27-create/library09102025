import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import HomePage from './components/HomePage';
import { supabase } from './lib/supabase';

function App() {
  const [view, setView] = useState<'home' | 'login' | 'admin'>('home');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setView('admin');
      }
      setAuthChecked(true);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setView('admin');
      } else {
        setView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleShowLogin = () => setView('login');
  const handleLoginSuccess = () => setView('admin');
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
  };
  const handleReturnHome = () => setView('home');

  const renderView = () => {
    switch (view) {
      case 'login':
        return <LoginForm onLoginSuccess={handleLoginSuccess} onReturnHome={handleReturnHome} />;
      case 'admin':
        return <AdminDashboard onLogout={handleLogout} />;
      default:
        return <HomePage onAdminLoginClick={handleShowLogin} />;
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
