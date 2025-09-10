import React, { useState } from 'react';
import Header from './Header';
import ActionCard from './ActionCard';
import LibraryCollection from './LibraryCollection';
import SuggestBookModal from './SuggestBookModal';
import WriteReviewModal from './WriteReviewModal';
import ReportsModal from './ReportsModal';
import { Lightbulb, Edit, BarChart3, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomePageProps {
  onAdminLoginClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onAdminLoginClick }) => {
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  const actionCards = [
    {
      icon: Lightbulb,
      title: 'Suggest a Book',
      description: 'Help us grow our collection. Let us know what you want to read.',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      onClick: () => setShowSuggestModal(true),
    },
    {
      icon: Edit,
      title: 'Write a Review',
      description: 'Read a book from our library? Share your valuable thoughts.',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: () => setShowReviewModal(true),
    },
    {
      icon: BarChart3,
      title: 'View Reports',
      description: 'Explore library statistics, popular books, and active readers.',
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      onClick: () => setShowReportsModal(true),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <Header onAdminLoginClick={onAdminLoginClick} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-800 tracking-tight">Welcome to Your Digital Library</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-neutral-600">Discover, read, and engage with our growing collection of books.</p>
        </motion.section>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {actionCards.map((card, index) => (
            <ActionCard
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              bgColor={card.bgColor}
              iconColor={card.iconColor}
              onClick={card.onClick}
            />
          ))}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <LibraryCollection />
        </motion.div>
      </main>

      <footer className="bg-white mt-16 border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Muhimmath Library. All rights reserved.</p>
          <p className="text-sm mt-1">Designed by Dualite Alpha</p>
        </div>
      </footer>

      {showSuggestModal && <SuggestBookModal onClose={() => setShowSuggestModal(false)} />}
      {showReviewModal && <WriteReviewModal onClose={() => setShowReviewModal(false)} />}
      {showReportsModal && <ReportsModal onClose={() => setShowReportsModal(false)} />}
    </div>
  );
};

export default HomePage;
