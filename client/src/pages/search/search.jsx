import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import BookTable from '../../components/bookTable/bookTable';
import { getFavorites, toggleFavorite as toggleFavService, getCurrentUser } from '../../services/favoritesService';
import { getBorrowed } from '../../services/borrowedService';
import AlertCard from '../../components/alertCard/alertCard';

const API_BASE = 'http://localhost/Readora_API';

const StatusBadge = ({ status }) => {
  const isAvailable = status === 'in-shelf';

  return (
    <span
      className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
        isAvailable ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
      }`}
    >
      {isAvailable ? 'In-Shelf' : 'Borrowed'}
    </span>
  );
};

const FavoriteButton = ({ isFavorite, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="text-xl leading-none"
      type="button"
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? (
        <AiFillHeart className="text-red-500" />
      ) : (
        <AiOutlineHeart className="text-gray-300" />
      )}
    </button>
  );
};

const transformBook = (apiBook, favoriteIds, borrowedIds) => {
  const available = parseInt(apiBook.available, 10) > 0;
  const isBorrowed = borrowedIds.includes(String(apiBook.id));
  return {
    id: apiBook.id,
    title: apiBook.title,
    author: apiBook.author,
    year: apiBook.year || new Date().getFullYear(),
    cover: `${API_BASE}/${apiBook.image}`,
    rating: apiBook.rating === null || apiBook.rating === undefined
      ? null
      : Number(apiBook.rating),
    reviewCount: Number(apiBook.review_count || 0),
    category: apiBook.category || 'Uncategorized',
    subCategory: null,
    edition: null,
    status: isBorrowed || !available ? 'borrowed' : 'in-shelf',
    hardCopy: {
      available,
      location: available ? 'Shelf' : null,
    },
    borrowedBy: isBorrowed ? 'You' : available ? null : 'Someone',
    isBorrowed,
    isFavorite: favoriteIds.includes(String(apiBook.id)),
  };
};

const Search = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booksError, setBooksError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [sortBy, setSortBy] = useState('title');
  const [alert, setAlert] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    // Load user's favorites if logged in
    const user = getCurrentUser();
    if (user) {
      getFavorites().then(setFavoriteIds);
    }
  }, []);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    setBooksError('');

    Promise.all([
      axios.get(`${API_BASE}/api/books.php`),
      getBorrowed(),
    ])
      .then(([booksResponse, borrowedIds]) => {
        if (!Array.isArray(booksResponse.data)) {
          throw new Error('The catalog response was invalid. Please try again.');
        }
        let data = booksResponse.data;
        let transformed = data.map((b) => transformBook(b, favoriteIds, borrowedIds));

        if (category !== 'All') {
          transformed = transformed.filter(
            (book) => book.category === category
          );
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          transformed = transformed.filter(
            (book) =>
              book.title.toLowerCase().includes(q) ||
              book.author.toLowerCase().includes(q)
          );
        }

        setBooks(transformed);
      })
      .catch((err) => {
        console.error('Error fetching books:', err);
        setBooks([]);
        setBooksError(err.response?.data?.error || err.response?.data?.message || (
          err.message === 'Network Error'
            ? 'Unable to connect to the catalog. Check your connection and try again.'
            : err.message || 'The catalog could not be loaded. Please try again.'
        ));
      })
      .finally(() => setLoading(false));
  }, [category, searchQuery, favoriteIds]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleToggleFavorite = async (bookId) => {
    const user = getCurrentUser();
    if (!user) {
      setAlert({
        title: 'Sign in required',
        message: 'Please sign in to add books to your favorites.',
        actionLabel: 'Sign in',
        onAction: () => navigate('/login'),
      });
      return;
    }

    const result = await toggleFavService(bookId);
    if (result.success) {
      // Update local favorite ids
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
      setAlert({
        title: 'Unable to update favorites',
        message: result.message || 'Failed to update favorite.',
      });
    }
  };

  const sortedBooks = useMemo(() => {
    const sorted = [...books];
    sorted.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title);
      }
      if (sortBy === 'availability') {
        return Number(b.hardCopy.available) - Number(a.hardCopy.available) ||
          a.title.localeCompare(b.title);
      }
      return a.title.localeCompare(b.title);
    });
    return sorted;
  }, [books, sortBy]);

  return (
    <div className="search__page min-w-0">
      <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-orange-100/80 bg-gradient-to-r from-white via-white to-orange-50/70 p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F16A43]">
            Readora collection
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl">
            {searchQuery ? 'Search results' : 'Explore books'}
          </h1>
          <p className="mt-1 break-words text-sm text-gray-500">
            {searchQuery ? (
              <>Showing matches for <span className="font-semibold text-gray-700">“{searchQuery}”</span></>
            ) : (
              'Find your next great read from the library.'
            )}
            {category !== 'All' && <> <span className="text-gray-400">in</span> <span className="font-medium text-gray-700">{category}</span></>}
          </p>
        </div>
        {!loading && !booksError && (
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <p className="text-xs font-medium text-gray-500">
              <span className="text-base font-bold text-gray-800">{sortedBooks.length}</span>
              {' '}{sortedBooks.length === 1 ? 'book' : 'books'}
            </p>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
              Sort by
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none transition focus:border-[#F16A43] focus:ring-2 focus:ring-orange-100"
              >
                <option value="title">Title</option>
                <option value="rating">Top rated</option>
                <option value="availability">Available first</option>
              </select>
            </label>
          </div>
        )}
      </header>

      {loading ? (
        <p className="rounded-2xl bg-white py-12 text-center text-sm text-gray-400 shadow-sm">Loading books...</p>
      ) : booksError ? (
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <p role="alert" className="text-sm text-red-600">{booksError}</p>
          <button
            type="button"
            onClick={fetchBooks}
            className="mt-4 rounded-lg bg-[#F16A43] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e05831]"
          >
            Retry
          </button>
        </div>
      ) : (
        <BookTable books={sortedBooks} onToggleFavorite={handleToggleFavorite} />
      )}
      <AlertCard
        title={alert?.title}
        message={alert?.message}
        actionLabel={alert?.actionLabel}
        onAction={alert?.onAction}
        onClose={() => setAlert(null)}
      />
    </div>
  );
};

export default Search;