import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Share2,
  Check,
  MapPin,
  Heart,
  BookOpen,
  CalendarDays,
  LibraryBig,
  Star,
} from 'lucide-react';
import { getBorrowed, getCurrentUser } from '../../services/borrowedService';
import { getFavorites, toggleFavorite } from '../../services/favoritesService';
import AlertCard from '../../components/alertCard/alertCard';

const API_BASE = 'http://localhost/Readora_API';

export default function Preview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [book, setBook] = useState(null);
  const [allBooks, setAllBooks] = useState([]);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Overview');
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [alert, setAlert] = useState(null);
  const [reviewData, setReviewData] = useState({
    reviews: [],
    eligible: false,
    my_review: null,
    total_reviews: 0,
    average_rating: null,
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const navTabs = [
    'Overview',
    'Details',
    'Reviews',
    'Related Books',
  ];

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    let fetchedBook = null;

    Promise.all([
      axios.get(`${API_BASE}/api/books.php`),
      getBorrowed(),
      getFavorites(),
    ])
      .then(([booksResponse, borrowedIds, favoriteIds]) => {
        const data = Array.isArray(booksResponse.data) ? booksResponse.data : [];
        setAllBooks(data);
        const matched = data.find((b) => String(b.id) === String(id));
        if (matched) {
          fetchedBook = matched;
          setBook(matched);
          setIsBorrowed(borrowedIds.includes(String(id)));
          setIsFavorite(favoriteIds.includes(String(id)));

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

  const loadReviews = async () => {
    const user = getCurrentUser();
    const response = await axios.get(`${API_BASE}/api/reviews.php`, {
      params: { book_id: id, ...(user?.id ? { user_id: user.id } : {}) },
    });
    const data = response.data;
    setReviewData({
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
      eligible: !!data.eligible,
      my_review: data.my_review || null,
      total_reviews: Number(data.total_reviews || 0),
      average_rating: data.average_rating,
    });
    setReviewRating(Number(data.my_review?.rating || 0));
    setReviewComment(data.my_review?.comment || '');
  };

  useEffect(() => {
    let active = true;
    setReviewsLoading(true);
    setReviewsError('');
    const user = getCurrentUser();
    axios.get(`${API_BASE}/api/reviews.php`, {
      params: { book_id: id, ...(user?.id ? { user_id: user.id } : {}) },
    })
      .then(({ data }) => {
        if (!active) return;
        setReviewData({
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          eligible: !!data.eligible,
          my_review: data.my_review || null,
          total_reviews: Number(data.total_reviews || 0),
          average_rating: data.average_rating,
        });
        setReviewRating(Number(data.my_review?.rating || 0));
        setReviewComment(data.my_review?.comment || '');
      })
      .catch((err) => {
        console.error('Error fetching book reviews:', err);
        if (active) setReviewsError('Reviews could not be loaded. Please try again later.');
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user?.id) {
      setAlert({
        title: 'Sign in to review',
        message: 'Please sign in with the account you used to borrow this book.',
      });
      return;
    }
    if (!reviewRating) {
      setAlert({ title: 'Choose a rating', message: 'Select a star rating before submitting your review.' });
      return;
    }

    setReviewSubmitting(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/reviews.php`, {
        user_id: user.id,
        book_id: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      if (!data.success) {
        throw new Error(data.message || 'Your review could not be saved.');
      }
      await loadReviews();
      setAlert({ title: 'Review saved', message: data.message });
    } catch (err) {
      console.error('Error saving book review:', err);
      setAlert({
        title: 'Unable to save review',
        message: err.response?.data?.message || err.message || 'Please try again.',
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

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
  const relatedBooks = allBooks
    .filter((item) =>
      String(item.id) !== String(book.id) &&
      item.category &&
      item.category.toLowerCase() === (book.category || '').toLowerCase()
    )
    .slice(0, 4);
  const addedDate = book.created_at
    ? new Date(book.created_at.replace(' ', 'T')).toLocaleDateString()
    : 'Not specified';

  const handleFavoriteToggle = async () => {
    const result = await toggleFavorite(id);
    if (!result.success) {
      setAlert({
        title: 'Unable to update favorites',
        message: result.message || 'Failed to update favorite.',
      });
      return;
    }
    setIsFavorite(result.favorited);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] p-6 text-gray-700 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to results</span>
        </button>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <div className="w-48 h-64 rounded shadow-md overflow-hidden mb-6">
              <img
                src={coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex justify-between w-full px-2 text-gray-500 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('Reviews')}
                className="flex flex-col items-center text-xs hover:text-gray-800 gap-1"
              >
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


              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1 text-amber-400">
                  {reviewData.total_reviews > 0 ? (
                    <>
                      {'★'.repeat(Math.round(Number(book.rating)))}
                      <span className="text-gray-700 font-semibold ml-1">
                        {Number(book.rating).toFixed(1)}/5 ({book.review_count})
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">No reviews yet</span>
                  )}
                </div>
                <span className="text-gray-600">
                  {book.quantity || 0} copies available
                </span>
              </div>
            </div>


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


        <section className="space-y-4">
            <div
              className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
              role="tablist"
              aria-label="Book information"
            >
              {navTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-orange-50 text-[#F16A43]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <section
              role="tabpanel"
              aria-label={activeTab}
              className="min-h-56 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              {activeTab === 'Overview' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F16A43]">
                    Overview
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-gray-900">About this book</h3>
                  <p className="mt-4 max-w-4xl text-sm leading-7 text-gray-600">
                    {book.summary || 'No overview is available for this book yet.'}
                  </p>
                </div>
              )}

              {activeTab === 'Details' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Book details</h3>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: 'Title', value: book.title, icon: BookOpen },
                      { label: 'Author', value: authorName, icon: FileText },
                      { label: 'Category', value: book.category || 'Uncategorized', icon: LibraryBig },
                      { label: 'Added to library', value: addedDate, icon: CalendarDays },
                      { label: 'Total copies', value: book.quantity || 0, icon: BookOpen },
                      { label: 'Available copies', value: book.available || 0, icon: Check },
                      { label: 'Availability', value: available ? 'Available to borrow' : 'Currently unavailable', icon: MapPin },
                      { label: 'Rating', value: reviewData.total_reviews > 0
                        ? `${reviewData.average_rating}/5 (${reviewData.total_reviews})`
                        : 'No reviews yet', icon: Star },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="flex items-start gap-3 rounded-xl bg-[#F8F8FA] p-4">
                        {React.createElement(icon, {
                          className: 'mt-0.5 h-4 w-4 flex-shrink-0 text-[#F16A43]',
                        })}
                        <div>
                          <p className="text-xs font-medium text-gray-400">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-gray-800">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Reviews' && (
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Reader reviews</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {reviewData.total_reviews > 0
                          ? `${reviewData.average_rating}/5 average · ${reviewData.total_reviews} ${reviewData.total_reviews === 1 ? 'review' : 'reviews'}`
                          : 'No reviews yet'}
                      </p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                      Verified borrowers
                    </span>
                  </div>

                  {reviewsLoading ? (
                    <p className="py-8 text-center text-sm text-gray-400">Loading reviews...</p>
                  ) : reviewsError ? (
                    <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {reviewsError}
                    </p>
                  ) : (
                    <>
                      {reviewData.eligible && (
                        <form onSubmit={handleReviewSubmit} className="mt-6 rounded-2xl bg-[#F8F8FA] p-5">
                          <h4 className="text-sm font-bold text-gray-800">
                            {reviewData.my_review ? 'Edit your review' : 'Share your experience'}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            Thanks for returning this book. Your review will be marked as a verified borrower.
                          </p>
                          <div className="mt-4 flex items-center gap-1" role="group" aria-label="Your rating">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setReviewRating(rating)}
                                aria-label={`${rating} ${rating === 1 ? 'star' : 'stars'}`}
                                aria-pressed={reviewRating === rating}
                                className="rounded p-1 text-2xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F16A43]"
                              >
                                <Star className={rating <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                              </button>
                            ))}
                          </div>
                          <label htmlFor="book-review-comment" className="mt-3 block text-xs font-semibold text-gray-700">
                            Comment <span className="font-normal text-gray-400">(optional)</span>
                          </label>
                          <textarea
                            id="book-review-comment"
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder="What did you think of this book?"
                            className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#F16A43]"
                          />
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-gray-400">{reviewComment.length}/2000</span>
                            <button
                              type="submit"
                              disabled={reviewSubmitting || !reviewRating}
                              className="rounded-xl bg-[#F16A43] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#e05831] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {reviewSubmitting ? 'Saving...' : reviewData.my_review ? 'Update review' : 'Submit review'}
                            </button>
                          </div>
                        </form>
                      )}

                      {!getCurrentUser()?.id && (
                        <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                          Sign in after returning this book to leave a verified review.
                        </p>
                      )}
                      {!!getCurrentUser()?.id && !reviewData.eligible && (
                        <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                          Reviews are available after you borrow and return this book.
                        </p>
                      )}

                      {reviewData.reviews.length > 0 ? (
                        <div className="mt-6 divide-y divide-gray-100 border-t border-gray-100">
                          {reviewData.reviews.map((review) => (
                            <article key={review.id} className="py-5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{review.user_name}</p>
                                  <p className="mt-0.5 text-xs text-gray-400">
                                    {new Date(`${review.created_at.replace(' ', 'T')}Z`).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                                  <Star className="h-4 w-4 fill-current" />
                                  {review.rating}/5
                                  <span className="ml-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                    Verified borrower
                                  </span>
                                </span>
                              </div>
                              {review.comment && (
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{review.comment}</p>
                              )}
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-28 flex-col items-center justify-center text-center">
                          <MessageSquare className="h-7 w-7 text-gray-300" />
                          <p className="mt-2 text-sm font-semibold text-gray-700">No reviews yet</p>
                          <p className="mt-1 text-xs text-gray-500">Be the first verified reader to review this book.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'Related Books' && (
                <div>
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-gray-800">More in {book.category || 'this category'}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Books you might enjoy from the same category.
                    </p>
                  </div>
                  {relatedBooks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {relatedBooks.map((relatedBook) => (
                        <button
                          key={relatedBook.id}
                          type="button"
                          onClick={() => navigate(`/book/${relatedBook.id}`)}
                          className="group rounded-xl border border-gray-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                        >
                          <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                            {relatedBook.image ? (
                              <img
                                src={`${API_BASE}/${relatedBook.image}`}
                                alt={relatedBook.title}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <BookOpen className="h-10 w-10 text-gray-300" />
                            )}
                          </div>
                          <p className="line-clamp-1 text-sm font-bold text-gray-800 group-hover:text-[#F16A43]">
                            {relatedBook.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                            {relatedBook.author || 'Unknown author'}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-36 flex-col items-center justify-center text-center">
                      <BookOpen className="h-8 w-8 text-gray-300" />
                      <p className="mt-3 text-sm font-semibold text-gray-700">
                        No related books found
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        There are no other books in this category yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
        </section>
      </div>
      <AlertCard
        title={alert?.title}
        message={alert?.message}
        onClose={() => setAlert(null)}
      />
    </div>
  );
}