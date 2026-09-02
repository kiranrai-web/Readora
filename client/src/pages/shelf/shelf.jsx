import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getFavorites, toggleFavorite as toggleFavService, getCurrentUser } from '../../services/favoritesService';
import { getBorrowed, getBorrowedDetails } from '../../services/borrowedService';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost/Readora_API';

const categories = [
  'Favourites',
  'Borrowed Books',
  'New Arrivals',
];

const transformBook = (apiBook, favoriteIds, borrowedIds) => {
  const available = parseInt(apiBook.available, 10) > 0;
  const bookIdStr = String(apiBook.id);
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
    isFavorite: favoriteIds.includes(bookIdStr),
    isBorrowed: borrowedIds.includes(bookIdStr),
  };
};

export default function Shelf() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Favourites');
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [borrowedIds, setBorrowedIds] = useState([]);
  const [borrowedDetails, setBorrowedDetails] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Load favorites and borrowed in parallel
    Promise.all([getFavorites(), getBorrowed(), getBorrowedDetails()])
      .then(([favs, borrowed, details]) => {
        setFavoriteIds(favs);
        setBorrowedIds(borrowed);
        setBorrowedDetails(details);
        return axios.get(`${API_BASE}/api/books.php`).then((res) => {
          const data = Array.isArray(res.data) ? res.data : [];
          setBooks(data.map((b) => transformBook(b, favs, borrowed)));
        });
      })
      .catch((err) => {
        console.error('Error fetching books:', err);
        setBooks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleFavorite = async (bookId) => {
    const result = await toggleFavService(bookId);
    if (result.success) {
      setFavoriteIds((prev) =>
        result.favorited
          ? [...prev, bookId]
          : prev.filter((id) => id !== bookId)
      );
      setBooks((prev) =>
        prev.map((book) =>
          book.id === bookId ? { ...book, isFavorite: result.favorited } : book
        )
      );
    } else {
      alert(result.message || 'Failed to update favorite.');
    }
  };

  const filteredBooks = books.filter((book) => {
    const bookIdStr = String(book.id);
    switch (activeTab) {
      case 'Favourites':
        return favoriteIds.includes(bookIdStr);
      case 'Borrowed Books':
        return borrowedIds.includes(bookIdStr);
      case 'New Arrivals':
        return book.isNew;
      default:
        return true;
    }
  });

  const getReturnTime = (bookId) => {
    const record = borrowedDetails.find((item) => String(item.book_id) === String(bookId));
    if (!record?.borrowed_at) return 'Return time managed by admin';
    const borrowedAt = new Date(`${record.borrowed_at.replace(' ', 'T')}Z`);
    const remaining = Math.max(0, borrowedAt.getTime() + 7 * 86400000 - Date.now());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `${days ? `${days}d ` : ''}${hours ? `${hours}h ` : ''}${minutes}m left to return`;
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] p-8 font-sans text-gray-700">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Your <span className="text-[#FF6B4A]">Shelf</span>
        </h1>

        {!isLoggedIn ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-lg p-12 shadow-lg text-center max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Please Login
              </h2>
              <p className="text-gray-600 mb-8">
                Sign in to view and manage your favorite books and borrowed items.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 bg-[#FA7C54] text-white font-semibold py-3 rounded-lg hover:bg-[#E86A42] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="flex-1 border-2 border-[#FA7C54] text-[#FA7C54] font-semibold py-3 rounded-lg hover:bg-[#FFF5F0] transition-colors"
                >
                  Register
                </button>
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-4 w-full text-gray-600 hover:text-gray-800 font-medium py-2"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        ) : (
          <>
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
                    onClick={() => navigate(`/book/${book.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/book/${book.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between cursor-pointer"
                  >
                    {book.isNew && (
                      <span className="absolute top-3 left-3 bg-[#FF6B4A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                        NEW
                      </span>
                    )}

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleFavorite(book.id);
                      }}
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

                    {activeTab === 'Borrowed Books' && book.isBorrowed && (
                      <p className="mt-2 text-xs text-gray-500">{getReturnTime(book.id)}</p>
                    )}

                    {activeTab === 'Borrowed Books' && book.isBorrowed && (
                      <button
                        type="button"
                        disabled
                        className="mt-3 w-full rounded-lg py-2 text-xs font-semibold text-gray-500 bg-gray-200 cursor-not-allowed"
                      >
                        Borrowed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}