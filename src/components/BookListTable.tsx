import React from 'react';
import { Book } from '../lib/supabase';
import { Edit, Trash2, Folder, Loader2 } from 'lucide-react';

interface BookListTableProps {
  books: Book[];
  loading: boolean;
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
}

const BookListTable: React.FC<BookListTableProps> = ({ books, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-10">
        <Folder size={40} className="mx-auto text-gray-300" />
        <p className="mt-2 text-gray-500">No books found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Copies</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {books.map((book) => (
            <tr key={book.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{book.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{book.author}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                  {book.categories?.name || 'Uncategorized'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="text-sm font-semibold text-gray-700">{book.available_copies} / {book.total_copies}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end items-center gap-4">
                  <button onClick={() => onEdit(book)} className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={() => onDelete(book.id)} className="text-red-600 hover:text-red-900 flex items-center gap-1">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookListTable;
