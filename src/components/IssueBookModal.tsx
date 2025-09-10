import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface IssueBookModalProps {
  onClose: () => void;
  onSave: () => void;
  initialBook?: Book | null;
}

const IssueBookModal: React.FC<IssueBookModalProps> = ({ onClose, onSave, initialBook }) => {
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialBook) {
      setSelectedBook({
        value: initialBook.id,
        label: initialBook.title,
        data: initialBook
      });
    }
  }, [initialBook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedMember) {
      toast.error('Please select both a book and a member.');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Issuing book...');

    try {
      const dueDate = new Date();
      dueDate.setDate(new Date().getDate() + days);

      const { error } = await supabase.rpc('issue_book', {
        p_book_id: selectedBook.value,
        p_member_id: selectedMember.value,
        p_due_date: dueDate.toISOString(),
      });

      if (error) throw error;
      toast.success('Book issued successfully!', { id: toastId });
      onSave();
    } catch (error) {
      toast.error('Error issuing book. The book may not be available.', { id: toastId });
      console.error('Error issuing book:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
      >
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">Issue Book</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Book *</label>
            {initialBook ? (
              <div className="w-full px-3 py-2.5 border border-neutral-300 rounded-md bg-neutral-100 text-neutral-800">
                {selectedBook?.label}
              </div>
            ) : (
              <SearchableSelect
                value={selectedBook}
                onChange={setSelectedBook}
                placeholder="Search for a book..."
                tableName="books"
                labelField="title"
                searchFields={['title', 'author', 'isbn']}
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Select Member *</label>
            <SearchableSelect
              value={selectedMember}
              onChange={setSelectedMember}
              placeholder="Search for a member..."
              tableName="members"
              labelField="name"
              searchFields={['name', 'email', 'phone']}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Loan Period (Days) *</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-md bg-white"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={21}>21 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {selectedBook && selectedMember && (
            <div className="bg-primary/5 p-4 rounded-lg text-sm text-neutral-600 space-y-1 border border-primary/10">
              <p><strong>Book:</strong> {selectedBook.label}</p>
              <p><strong>Member:</strong> {selectedMember.label}</p>
              <p><strong>Due Date:</strong> {new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 mt-2 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !selectedBook || !selectedMember} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-primary-dark transition-colors flex items-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Issuing...' : 'Issue Book'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default IssueBookModal;
