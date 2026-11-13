import React from 'react';
import BookRow, { BookCard } from '../bookRow/bookRow';

const bookTable = ({ books, onToggleFavorite }) => {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onToggleFavorite={onToggleFavorite} />
        ))}
        {books.length === 0 && (
          <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400">
            No books found
          </p>
        )}
      </div>

      <div className="hidden min-w-0 overflow-x-auto overscroll-x-contain rounded-md bg-white shadow-sm md:block">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 text-left text-sm text-gray-400">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Ratings</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Availability</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <BookRow key={book.id} book={book} onToggleFavorite={onToggleFavorite} />
            ))}

            {books.length === 0 && (
              <tr>
                <td colSpan="7" className="py-10 text-center text-sm text-gray-400">
                  No books found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default bookTable;