import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import BookTable from '../../components/bookTable/bookTable';
import { getFavorites, toggleFavorite as toggleFavService } from '../../services/favoritesService';

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

const transformBook = (apiBook) => {
  const available = parseInt(apiBook.available, 10) > 0;
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
    status: available ? 'in-shelf' : 'borrowed',
    hardCopy: {
      available,
      location: available ? 'Shelf' : null,
    },
    borrowedBy: available ? null : 'Someone',
    isFavorite: getFavorites().includes(apiBook.id),
  };
};

const Search = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    fetchBooks();
  }, [category, searchQuery]);

  const fetchBooks = () => {
    setLoading(true);

    axios
      .get(`${API_BASE}/api/books.php`)
      .then((res) => {
        let data = Array.isArray(res.data) ? res.data : [];
        let transformed = data.map(transformBook);

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

  const handleToggleFavorite = (bookId) => {
    toggleFavService(bookId);
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId ? { ...book, isFavorite: !book.isFavorite } : book
      )
    );
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
    </div>
  );
};

export default Search;