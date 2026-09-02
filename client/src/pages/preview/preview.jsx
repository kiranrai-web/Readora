import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Share2,
  Check,
  MapPin,
  Heart,
} from 'lucide-react';
import { getBorrowed } from '../../services/borrowedService';
import { getFavorites, toggleFavorite } from '../../services/favoritesService';

const API_BASE = 'http://localhost/Readora_API';

export default function Preview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const navTabs = [
    'Overview',
    'Details',
    'Reviews',
    'Related Books',
  ];

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    let fetchedBook = null;

    // Fetch all books and find the one matching the id param
    // (API doesn't filter server-side, so we filter client-side)
    Promise.all([
      axios.get(`${API_BASE}/api/books.php`),
      getBorrowed(),
      getFavorites(),
    ])
      .then(([booksResponse, borrowedIds, favoriteIds]) => {
        const data = Array.isArray(booksResponse.data) ? booksResponse.data : [];
        const matched = data.find((b) => String(b.id) === String(id));
        if (matched) {
          fetchedBook = matched;
          setBook(matched);
          setIsBorrowed(borrowedIds.includes(String(id)));
          setIsFavorite(favoriteIds.includes(String(id)));
          // Fetch authors to find a matching bio
          return axios.get(`${API_BASE}/api/authors.php`);
        }
        return Promise.reject(new Error('Book not found'));
      })
      .then((authorRes) => {
        if (!authorRes || !fetchedBook) return;
        const authors = Array.isArray(authorRes.data) ? authorRes.data : [];
        const bookAuthorName = fetchedBook.author
          ? fetchedBook.author.replace(/\r?\n/g, '').trim().toLowerCase()
          : '';
        const matched = authors.find(
          (a) => a.name.toLowerCase() === bookAuthorName
        );
        if (matched) setAuthor(matched);
      })
      .catch((err) => {
        console.error('Error fetching book:', err);
        setBook(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F9] p-6 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading book details...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#F4F5F9] p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Book not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#F16A43] underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const available = parseInt(book.available, 10) > 0;
  const coverUrl = `${API_BASE}/${book.image}`;
  const authorName = book.author ? book.author.replace(/\r?\n/g, '').trim() : 'Unknown';

  const handleFavoriteToggle = async () => {
    const result = await toggleFavorite(id);
    if (!result.success) {
      alert(result.message || 'Failed to update favorite.');
      return;
    }
    setIsFavorite(result.favorited);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] p-6 text-gray-700 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to results</span>
        </button>

        {/* Top Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Book Cover Card */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <div className="w-48 h-64 rounded shadow-md overflow-hidden mb-6">
              <img
                src={coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex justify-between w-full px-2 text-gray-500 pt-2 border-t border-gray-100">
              <button className="flex flex-col items-center text-xs hover:text-gray-800 gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>Review</span>
              </button>
              <button className="flex flex-col items-center text-xs hover:text-gray-800 gap-1">
                <FileText className="w-4 h-4" />
                <span>Notes</span>
              </button>
              <button className="flex flex-col items-center text-xs hover:text-gray-800 gap-1">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Center Column: Main Book Information */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{book.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                By{' '}
                <span className="underline font-medium text-gray-600">
                  {authorName}
                </span>
                {book.created_at && (
                  <span className="text-gray-400">
                    , {new Date(book.created_at).getFullYear()}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">{book.category}</p>

              {/* Ratings & Stats */}
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1 text-amber-400">
                  {'★'.repeat(5)}
                  <span className="text-gray-700 font-semibold ml-1">
                    {book.rating || '?'}/5
                  </span>
                </div>
                <span className="text-gray-600">
                  {book.quantity || 0} copies available
                </span>
              </div>
            </div>

            {/* Availability & Status Grid */}
            <div className="flex gap-10 text-xs pt-2">
              <div>
                <p className="font-bold text-gray-800 mb-2">Availability</p>
                <ul className="space-y-1.5 text-gray-600">
                  <li className="flex items-center gap-1.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        available && !isBorrowed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {available ? <Check className="w-3 h-3" /> : '—'}
                    </span>
                    <span>Hard Copy</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-2">Status</p>
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-md mb-2 ${
                    available
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {available ? 'In-Shelf' : 'Borrowed'}
                </span>
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />{' '}
                  {available ? 'Available' : 'Currently unavailable'}
                </p>
              </div>

              <div className="self-center">
                <button
                  type="button"
                  onClick={handleFavoriteToggle}
                  className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm transition-colors ${
                    isFavorite
                      ? 'bg-[#F16A43] text-white hover:bg-[#e05831]'
                      : 'bg-gray-700 hover:bg-gray-800 text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>{isFavorite ? 'Favorited' : 'Add to Favorite'}</span>
                </button>
              </div>
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate(`/borrow/${id}`)}
                className={`flex-1 py-3 rounded-lg font-bold tracking-wider text-sm shadow-sm transition-colors ${
                  available
                    ? 'bg-[#F16A43] hover:bg-[#e05831] text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!available || isBorrowed}
              >
                {isBorrowed ? 'BORROWED' : available ? 'BORROW' : 'UNAVAILABLE'}
              </button>
            </div>
          </div>

          {/* Right Column: About Author Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">
              <span className="text-[#F16A43]">About</span> Author
            </h2>

            <div className="flex justify-between items-start">
              <span className="text-base font-semibold text-gray-800">
                {authorName}
              </span>
            </div>

            {author && author.bio ? (
              <p className="text-xs text-gray-500 leading-relaxed">
                {author.bio}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">
                No biography available for this author.
              </p>
            )}

            {author && (
              <div className="text-xs text-gray-500 space-y-1">
                {author.nationality && (
                  <p>
                    <span className="font-medium text-gray-700">Nationality:</span>{' '}
                    {author.nationality}
                  </p>
                )}
                {author.birth_year && (
                  <p>
                    <span className="font-medium text-gray-700">Born:</span>{' '}
                    {author.birth_year}
                    {author.death_year ? ` – ${author.death_year}` : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Area Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Summary Card */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold">
              <span className="text-[#F16A43]">About</span> this Book
            </h3>
            {book.summary ? (
              <p className="text-xs text-gray-500 leading-relaxed">
                {book.summary}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">
                No summary available.
              </p>
            )}
          </div>

          {/* Right Side: Tabbed Details & Meta */}
          <div className="lg:col-span-9 space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl p-2 shadow-sm border-b border-gray-100 flex items-center overflow-x-auto">
              {navTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-semibold px-4 py-2 transition-colors whitespace-nowrap relative ${
                    activeTab === tab
                      ? 'text-[#F16A43] border-b-2 border-[#F16A43]'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Quick Specs Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-[11px] text-gray-400 font-medium">Category</p>
                <p className="text-xs font-bold text-gray-800 mt-1">
                  {book.category || '—'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-[11px] text-gray-400 font-medium">Total Copies</p>
                <p className="text-xs font-bold text-[#F16A43] mt-1">
                  {book.quantity || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-[11px] text-gray-400 font-medium">Available</p>
                <p className="text-xs font-bold text-[#3EC150] mt-1">
                  {book.available || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-[11px] text-gray-400 font-medium">Added</p>
                <p className="text-xs font-bold text-gray-800 mt-1">
                  {book.created_at
                    ? new Date(book.created_at).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>

            {/* Description / Summary */}
            {book.summary && (
              <div className="text-xs text-gray-500 leading-relaxed">
                <p>{book.summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}