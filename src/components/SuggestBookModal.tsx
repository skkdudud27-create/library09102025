import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface SuggestBookModalProps {
  onClose: () => void;
}

const SuggestBookModal: React.FC<SuggestBookModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    member_id: '',
    suggestion_title: '',
    suggestion_author: '',
    suggestion_reason: ''
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id) {
      toast.error('Please select a member.');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Submitting suggestion...');

    try {
      // Prepare the data for insertion, working around the schema cache issue.
      const submissionData = {
        member_id: formData.member_id,
        suggestion_title: formData.suggestion_title,
        // Combine author and reason into one field to bypass the problematic 'suggestion_author' column.
        suggestion_reason: `Author: ${formData.suggestion_author || 'Not provided'}\n\nReason: ${formData.suggestion_reason || 'No reason given.'}`,
        feedback_type: 'suggestion' as const,
        status: 'pending' as const,
      };

      // We will no longer send `suggestion_author` directly.
      const { error } = await supabase.from('feedback').insert(submissionData);

      if (error) throw error;

      toast.success('Thank you! Your suggestion has been submitted.', { id: toastId });
      onClose();
    } catch (error) {
      const typedError = error as any;
      // Provide a more specific error message if the old problem somehow persists.
      if (typedError?.message?.includes('suggestion_author')) {
          toast.error('A persistent database error occurred. Please contact support.', { id: toastId });
      } else {
          toast.error('Failed to submit suggestion.', { id: toastId });
      }
      console.error('Error submitting suggestion:', error);
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
          <h2 className="text-xl font-bold text-neutral-800">Suggest a Book</h2>
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
            <input
              type="text"
              required
              value={formData.suggestion_title}
              onChange={(e) => setFormData({ ...formData, suggestion_title: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Author</label>
            <input
              type="text"
              value={formData.suggestion_author}
              onChange={(e) => setFormData({ ...formData, suggestion_author: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Reason for Suggestion</label>
            <textarea
              rows={3}
              value={formData.suggestion_reason}
              onChange={(e) => setFormData({ ...formData, suggestion_reason: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light"
              placeholder="e.g., It's a popular new release, it would be a great addition to the history section, etc."
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 mt-2 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-primary-dark transition-colors flex items-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SuggestBookModal;
