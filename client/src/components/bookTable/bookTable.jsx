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
          <p className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-400">
            No books match your search. Try another title or category.
          </p>
        )}
      </div>

      <div className="hidden min-w-0 overflow-x-auto overscroll-x-contain rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full min-w-[760px]">
          <thead className="bg-gray-50/80">
            <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="px-5 py-4 font-semibold">Book</th>
              <th className="px-4 py-4 font-semibold">Rating</th>
              <th className="px-4 py-4 font-semibold">Category</th>
              <th className="px-4 py-4 font-semibold">Format</th>
              <th className="px-4 py-4 font-semibold">Status</th>
              <th className="px-2 py-4 font-semibold"><span className="sr-only">Favorite</span></th>
              <th className="px-4 py-4 font-semibold"><span className="sr-only">Preview</span></th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <BookRow key={book.id} book={book} onToggleFavorite={onToggleFavorite} />
            ))}

            {books.length === 0 && (
              <tr>
                <td colSpan="7" className="py-14 text-center text-sm text-gray-400">
                  No books match your search. Try another title or category.
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