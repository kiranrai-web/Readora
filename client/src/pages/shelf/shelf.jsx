import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getFavorites, toggleFavorite as toggleFavService } from '../../services/favoritesService';
import { getBorrowed } from '../../services/borrowedService';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

const API_BASE = 'http://localhost/Readora_API';

const categories = [
  'Favourites',
  'Borrowed Books',
  'New Arrivals',
];

const transformBook = (apiBook) => {
  const available = parseInt(apiBook.available, 10) > 0;
  return {
    id: apiBook.id,
    title: apiBook.title,
    author: apiBook.author ? apiBook.author.replace(/\r?\n/g, '').trim() : 'Unknown',
    cover: `${API_BASE}/${apiBook.image}`,
    category: apiBook.category || 'Uncategorized',
    available,
    quantity: parseInt(apiBook.quantity, 10) || 0,
    availableCount: parseInt(apiBook.available, 10) || 0,
    isNew: apiBook.is_new === '1',
    isFavorite: getFavorites().includes(apiBook.id),
    isBorrowed: getBorrowed().includes(apiBook.id),
  };
};

export default function Shelf() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Favourites');

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/api/books.php`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setBooks(data.map(transformBook));
      })
      .catch((err) => {
        console.error('Error fetching books:', err);
        setBooks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleFavorite = (bookId) => {
    toggleFavService(bookId);
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId ? { ...book, isFavorite: !book.isFavorite } : book
      )
    );
  };


  const filteredBooks = books.filter((book) => {
    switch (activeTab) {
      case 'Favourites':
        return getFavorites().includes(book.id);
      case 'Borrowed Books':
        return book.isBorrowed;
      case 'New Arrivals':
        return book.isNew;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-[#F4F5F9] p-8 font-sans text-gray-700">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Your <span className="text-[#FF6B4A]">Shelf</span>
        </h1>

        <div className="flex items-center gap-8 border-b border-gray-200/80 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`text-base font-semibold transition-colors duration-200 whitespace-nowrap relative pb-2 ${
                activeTab === category
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        {loading && (
          <p className="text-gray-400 text-sm py-10 text-center">Loading books...</p>
        )}
        {!loading && filteredBooks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">
              {activeTab === 'Favourites'
                ? 'No favourite books yet. Browse and add some!'
                : activeTab === 'Borrowed Books'
                ? 'No borrowed books at the moment.'
                : 'No new arrivals right now.'}
            </p>
          </div>
        )}

        {!loading && filteredBooks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
              >
                {book.isNew && (
                  <span className="absolute top-3 left-3 bg-[#FF6B4A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                    NEW
                  </span>
                )}


                <button
                  onClick={() => handleToggleFavorite(book.id)}
                  className="absolute top-5 right-6 text-2xl z-10 cursor-pointer"
                  aria-label={book.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {book.isFavorite ? (
                    <AiFillHeart className="text-red-500" />
                  ) : (
                    <AiOutlineHeart className="text-gray-300" />
                  )}
                </button>

                <div className="w-full h-48 flex-shrink-0 bg-gray-100 rounded overflow-hidden shadow-sm mb-3">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-800 line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">{book.author}</p>
                  <p className="text-xs text-gray-500">{book.category}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        book.available ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-xs text-gray-500">
                      {book.available ? 'Available' : 'Borrowed'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {book.availableCount}/{book.quantity} copies
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}