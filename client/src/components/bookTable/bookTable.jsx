import React from 'react';
import BookRow from '../bookRow/bookRow';

const bookTable = ({ books, onToggleFavorite }) => {
  return (
    <div className="bg-white rounded-md shadow-sm overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="text-left text-sm text-gray-400 border-b border-gray-100">
            <th className="py-3 px-4 font-medium">Title</th>
            <th className="py-3 px-4 font-medium">Ratings</th>
            <th className="py-3 px-4 font-medium">Category</th>
            <th className="py-3 px-4 font-medium">Availability</th>
            <th className="py-3 px-4 font-medium">Status</th>
            <th className="py-3 px-4 font-medium"></th>
            <th className="py-3 px-4 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <BookRow key={book.id} book={book} onToggleFavorite={onToggleFavorite} />
          ))}

          {books.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-10 text-gray-400 text-sm">
                No books found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default bookTable;