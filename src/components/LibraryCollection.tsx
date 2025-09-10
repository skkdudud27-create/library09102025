import React, { useState, useEffect } from 'react';
import { Search, Download, BookOpen, Loader2 } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const LibraryCollection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('books').select('*, categories(name)').order('title');
      if (error) {
        toast.error('Could not fetch books.');
        console.error(error);
      } else {
        setBooks(data || []);
      }
      setLoading(false);
    };

    fetchBooks();

    const channel = supabase.channel('public:books')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, fetchBooks)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.isbn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-neutral-200/80 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-neutral-900">Our Collection</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search title, author, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filteredBooks.length > 0 ? (
          <table className="min-w-full bg-white">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredBooks.map((book) => (
                <motion.tr 
                  key={book.id} 
                  className="hover:bg-neutral-50 transition-colors duration-150"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-neutral-900">{book.title}</div>
                    <div className="text-sm text-neutral-500 md:hidden">{book.author}</div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-600">{book.author}</div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                      {book.categories?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {book.available_copies > 0 ? (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Available
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Issued
                        </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen size={48} className="text-neutral-300 mb-4" />
            <p className="text-neutral-600 text-lg font-medium">
              {searchQuery ? 'No books match your search.' : 'No books in the library yet.'}
            </p>
            <p className="text-neutral-500 mt-1">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryCollection;
