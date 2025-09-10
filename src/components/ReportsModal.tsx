import React, { useState, useEffect } from 'react';
import { X, Loader2, Book, User, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface ReportsModalProps {
  onClose: () => void;
}

type ReportTab = 'Most Read' | 'Most Active' | 'Issued';

const ReportsModal: React.FC<ReportsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('Most Read');
  const [loading, setLoading] = useState(true);
  const [mostRead, setMostRead] = useState<any[]>([]);
  const [mostActive, setMostActive] = useState<any[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data: circulationData, error: circError } = await supabase
          .from('circulation')
          .select('id, book_id, member_id, status, due_date');
        
        if (circError) throw circError;
        if (!circulationData) return;

        const bookIds = [...new Set(circulationData.map(c => c.book_id).filter(Boolean))];
        const memberIds = [...new Set(circulationData.map(c => c.member_id).filter(Boolean))];

        const { data: booksData } = await supabase.from('books').select('id, title, author').in('id', bookIds);
        const { data: membersData } = await supabase.from('members').select('id, name, email').in('id', memberIds);

        const booksMap = new Map(booksData?.map(b => [b.id, b]));
        const membersMap = new Map(membersData?.map(m => [m.id, m]));

        const readCounts = circulationData.reduce((acc, curr) => {
          if (curr.book_id) { acc[curr.book_id] = (acc[curr.book_id] || 0) + 1; }
          return acc;
        }, {} as Record<string, number>);

        setMostRead(Object.entries(readCounts).map(([book_id, count]) => ({
          id: book_id, title: booksMap.get(book_id)?.title || 'Unknown Book', author: booksMap.get(book_id)?.author || 'N/A', count,
        })).sort((a, b) => b.count - a.count).slice(0, 10));

        const activeCounts = circulationData.reduce((acc, curr) => {
          if (curr.member_id) { acc[curr.member_id] = (acc[curr.member_id] || 0) + 1; }
          return acc;
        }, {} as Record<string, number>);

        setMostActive(Object.entries(activeCounts).map(([member_id, count]) => ({
          id: member_id, name: membersMap.get(member_id)?.name || 'Unknown Member', email: membersMap.get(member_id)?.email || '', count,
        })).sort((a, b) => b.count - a.count).slice(0, 10));

        setIssuedBooks(circulationData.filter(c => c.status === 'issued').map(c => ({
          ...c, books: booksMap.get(c.book_id), members: membersMap.get(c.member_id),
        })));

      } catch (error) {
        toast.error('Failed to fetch reports.');
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    const listVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
        },
      },
    };
    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    };
    
    const EmptyState = ({ message }: { message: string }) => (
      <div className="text-center text-neutral-500 py-16">
        <TrendingUp size={40} className="mx-auto mb-2 text-neutral-400" />
        <p className="font-medium">{message}</p>
      </div>
    );

    switch (activeTab) {
      case 'Most Read':
        return mostRead.length > 0 ? (
          <motion.ul variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
            {mostRead.map((book, index) => (
              <motion.li variants={itemVariants} key={book.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-primary">{index + 1}</span>
                  <div>
                    <p className="font-semibold text-neutral-800">{book.title}</p>
                    <p className="text-sm text-neutral-500">by {book.author}</p>
                  </div>
                </div>
                <p className="font-bold text-lg text-neutral-700">{book.count} <span className="text-sm font-medium text-neutral-500">borrows</span></p>
              </motion.li>
            ))}
          </motion.ul>
        ) : <EmptyState message="No borrowing data available." />;
      
      case 'Most Active':
        return mostActive.length > 0 ? (
          <motion.ul variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
            {mostActive.map((member, index) => (
              <motion.li variants={itemVariants} key={member.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <img src={`https://ui-avatars.com/api/?name=${member.name}&background=E0E7FF&color=4F46E5&bold=true`} alt={member.name} className="w-10 h-10 rounded-full"/>
                  <div>
                    <p className="font-semibold text-neutral-800">{member.name}</p>
                    <p className="text-sm text-neutral-500">{member.email}</p>
                  </div>
                </div>
                <p className="font-bold text-lg text-neutral-700">{member.count} <span className="text-sm font-medium text-neutral-500">borrows</span></p>
              </motion.li>
            ))}
          </motion.ul>
        ) : <EmptyState message="No active readers found." />;

      case 'Issued':
        return issuedBooks.length > 0 ? (
          <motion.ul variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
            {issuedBooks.map(item => (
              <motion.li variants={itemVariants} key={item.id} className="p-4 bg-neutral-50 rounded-lg border">
                <p className="font-semibold text-neutral-800">{item.books?.title || 'Unknown Book'}</p>
                <p className="text-sm text-neutral-600">Borrowed by: <span className="font-medium">{item.members?.name || 'Unknown Member'}</span></p>
                <p className={`text-sm ${new Date(item.due_date) < new Date() ? 'text-red-600 font-semibold' : 'text-neutral-500'}`}>Due: {new Date(item.due_date).toLocaleDateString()}</p>
              </motion.li>
            ))}
          </motion.ul>
        ) : <EmptyState message="No books are currently issued." />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">Library Reports</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="border-b border-neutral-200">
          <nav className="flex gap-4 px-6">
            {(['Most Read', 'Most Active', 'Issued'] as ReportTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 font-semibold text-sm transition-colors relative ${
                  activeTab === tab ? 'text-primary' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {tab}
                {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="underline" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsModal;
