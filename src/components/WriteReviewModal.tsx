import React, { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface WriteReviewModalProps {
  onClose: () => void;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    member_id: '',
    book_id: '',
    rating: 0,
    review: ''
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id || !formData.book_id || formData.rating === 0) {
      toast.error('Please fill all required fields and provide a rating.');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Submitting review...');

    try {
      const { error } = await supabase.from('feedback').insert({
        ...formData,
        feedback_type: 'book_review',
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Thank you! Your review has been submitted.', { id: toastId });
      onClose();
    } catch (error) {
      toast.error('Failed to submit review.', { id: toastId });
      console.error('Error submitting review:', error);
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
          <h2 className="text-xl font-bold text-neutral-800">Write a Review</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Your Name *</label>
            <SearchableSelect
              value={selectedMember}
              onChange={(option: any) => {
                setSelectedMember(option);
                setFormData({ ...formData, member_id: option ? option.value : '' });
              }}
              placeholder="Search for your name..."
              tableName="members"
              labelField="name"
              searchFields={['name', 'email']}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Book Title *</label>
            <SearchableSelect
              value={selectedBook}
              onChange={(option: any) => {
                setSelectedBook(option);
                setFormData({ ...formData, book_id: option ? option.value : '' });
              }}
              placeholder="Search for the book you read..."
              tableName="books"
              labelField="title"
              searchFields={['title', 'author']}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Your Rating *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <motion.button
                  type="button"
                  key={star}
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star
                    size={32}
                    className={`transition-colors duration-200 ${
                      star <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Your Review</label>
            <textarea
              rows={4}
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light"
              placeholder="What did you think about the book?"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 mt-2 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-primary-dark transition-colors flex items-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default WriteReviewModal;
