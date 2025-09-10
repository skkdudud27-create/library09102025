import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, type Book, type Category } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface BookModalProps {
  book?: Book | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

const BookModal: React.FC<BookModalProps> = ({ book, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category_id: '',
    language: 'English' as Book['language'],
    price: '',
    publisher: '',
    isbn: '',
    ddc_number: '',
    publication_year: '',
    total_copies: 1,
    available_copies: 1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        category_id: book.category_id || '',
        language: book.language || 'English',
        price: book.price?.toString() || '',
        publisher: book.publisher || '',
        isbn: book.isbn || '',
        ddc_number: book.ddc_number || '',
        publication_year: book.publication_year?.toString() || '',
        total_copies: book.total_copies,
        available_copies: book.available_copies
      });
    }
  }, [book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(book ? 'Updating book...' : 'Adding book...');

    try {
      const bookData = {
        ...formData,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id || null,
        updated_at: new Date().toISOString()
      };

      if (book) {
        const { error } = await supabase.from('books').update(bookData).eq('id', book.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert({ ...bookData, created_at: new Date().toISOString() });
        if (error) throw error;
      }
      toast.success(book ? 'Book updated successfully!' : 'Book added successfully!', { id: toastId });
      onSave();
    } catch (error) {
      toast.error('Error saving book.', { id: toastId });
      console.error('Error saving book:', error);
    } finally {
      setLoading(false);
    }
  };

  const Input = ({ label, ...props }: any) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      <input {...props} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-light focus:border-primary-light" />
    </div>
  );

  const Select = ({ label, children, ...props }: any) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      <select {...props} className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white focus:ring-primary-light focus:border-primary-light">
        {children}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-neutral-800">{book ? 'Edit Book' : 'Add New Book'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 transition-colors"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Book Title *" type="text" required value={formData.title} onChange={(e: any) => setFormData({ ...formData, title: e.target.value })} />
            <Input label="Author Name *" type="text" required value={formData.author} onChange={(e: any) => setFormData({ ...formData, author: e.target.value })} />
            <Select label="Book Category" value={formData.category_id} onChange={(e: any) => setFormData({ ...formData, category_id: e.target.value })}>
              <option value="">Select a category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </Select>
            <Select label="Language" value={formData.language} onChange={(e: any) => setFormData({ ...formData, language: e.target.value })}>
              <option>English</option><option>Kannada</option><option>Malayalam</option><option>Urdu</option><option>Arabic</option>
            </Select>
            <Input label="Book Price" type="number" step="0.01" value={formData.price} onChange={(e: any) => setFormData({ ...formData, price: e.target.value })} />
            <Input label="Publisher Name" type="text" value={formData.publisher} onChange={(e: any) => setFormData({ ...formData, publisher: e.target.value })} />
            <Input label="ISBN" type="text" value={formData.isbn} onChange={(e: any) => setFormData({ ...formData, isbn: e.target.value })} />
            <Input label="DDC Number" type="text" value={formData.ddc_number} onChange={(e: any) => setFormData({ ...formData, ddc_number: e.target.value })} />
            <Input label="Publication Year" type="number" value={formData.publication_year} onChange={(e: any) => setFormData({ ...formData, publication_year: e.target.value })} />
            <Input label="Total Copies *" type="number" min="1" required value={formData.total_copies} onChange={(e: any) => setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })} />
            {book && (
              <Input label="Available Copies *" type="number" min="0" max={formData.total_copies} required value={formData.available_copies} onChange={(e: any) => setFormData({ ...formData, available_copies: parseInt(e.target.value) || 0 })} />
            )}
          </div>
          <div className="flex justify-end gap-4 pt-4 mt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-primary-dark transition-colors flex items-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Book'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default BookModal;
