import React from 'react';
import { BookMarked, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onAdminLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAdminLoginClick }) => {
  return (
    <header className="w-full bg-white/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3">
            <BookMarked className="text-primary" size={32} />
            <h1 className="text-2xl font-extrabold text-neutral-800 tracking-tight">
              Muhimmath Library
            </h1>
          </motion.div>
          {onAdminLoginClick && (
            <motion.button
              onClick={onAdminLoginClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              <User size={18} />
              <span className="hidden sm:inline">Admin Portal</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
