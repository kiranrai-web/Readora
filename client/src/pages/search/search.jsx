import React, { useState, useEffect } from 'react';
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
    rating: apiBook.rating || null,
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
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [alert, setAlert] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    fetchBooks();
  }, [category, searchQuery]);

  useEffect(() => {
    // Load user's favorites if logged in
    const user = getCurrentUser();
    if (user) {
      getFavorites().then(setFavoriteIds);
    }
  }, []);

  const fetchBooks = () => {
    setLoading(true);

    Promise.all([
      axios.get(`${API_BASE}/api/books.php`),
      getBorrowed(),
    ])
      .then(([booksResponse, borrowedIds]) => {
        let data = Array.isArray(booksResponse.data) ? booksResponse.data : [];
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
      })
      .finally(() => setLoading(false));
  };

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

  return (
    <div className="search__page">
      {searchQuery && (
        <p className="text-sm text-gray-500 mb-4">
          Results for "<span className="font-medium">{searchQuery}</span>"
          {category !== 'All' && (
            <>
              {' '}
              in <span className="font-medium">{category}</span>
            </>
          )}
        </p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-10 text-center">Loading books...</p>
      ) : (
        <BookTable books={books} onToggleFavorite={handleToggleFavorite} />
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