import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MessageSquare,
  Star,
  UserRound,
} from 'lucide-react';
import { getCurrentUser } from '../../services/borrowedService';
import AlertCard from '../../components/alertCard/alertCard';

const API_BASE = 'http://localhost/Readora_API';

export default function Profile() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [profileData, setProfileData] = useState({ books_read: 0, completed_books: [] });
  const [loading, setLoading] = useState(!!user);
  const [profileError, setProfileError] = useState('');
  const [libraryHistoryOpen, setLibraryHistoryOpen] = useState(true);
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;
    setLoading(true);
    setProfileError('');
    axios.get(`${API_BASE}/api/profile.php`, { params: { user_id: user.id } })
      .then(({ data }) => {
        if (!active) return;
        if (!data.success) {
          throw new Error(data.message || 'Could not load your reading history.');
        }
        setProfileData({
          books_read: Number(data.books_read || 0),
          completed_books: Array.isArray(data.completed_books) ? data.completed_books : [],
        });
      })
      .catch((error) => {
        console.error('Error loading profile:', error);
        if (active) {
          setProfileError(
            error.response?.data?.message ||
            error.message ||
            'Could not load your reading history. Please try again later.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const openBookReviews = (bookId) => {
    navigate(`/book/${bookId}`, { state: { activeTab: 'Reviews' } });
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Your new password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Choose a new password different from your current password.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/change_password.php`, {
        user_id: user.id,
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (!data.success) {
        setPasswordError(data.message || 'Password could not be changed.');
        return;
      }

      const updatedUser = { ...user, must_change_password: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFormOpen(false);
      setAlert({ title: 'Password changed', message: 'Your password has been updated successfully.' });
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(
        error.response?.data?.message ||
        'Password could not be changed. Please try again.'
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F9] p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="mb-5 text-gray-600">Please sign in to view your profile.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-xl bg-[#F16A43] px-6 py-2.5 font-semibold text-white transition hover:bg-[#e05831]"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const inputClass = 'mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F16A43]';

  return (
    <div className="min-h-screen bg-[#F4F5F9] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#FFF0EA] text-2xl font-bold text-[#F16A43]">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F16A43]">Reader profile</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{user.name || 'Reader'}</h1>
                <p className="mt-1 text-sm text-gray-500">{user.email || 'No email available'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPasswordFormOpen((open) => !open);
                setPasswordError('');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-[#D95531] transition hover:bg-orange-50"
            >
              <KeyRound className="h-4 w-4" />
              {passwordFormOpen ? 'Close password form' : 'Change password'}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2 border-t border-gray-100 pt-6 sm:gap-3">
            <div className="rounded-2xl bg-[#F8F8FA] p-3 sm:p-4">
              <div className="flex items-center gap-2 text-[#F16A43]">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-medium text-gray-500">Books read</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{loading ? '—' : profileData.books_read}</p>
            </div>
            <div className="rounded-2xl bg-[#F8F8FA] p-3 sm:p-4">
              <div className="flex items-center gap-2 text-[#F16A43]">
                <UserRound className="h-4 w-4" />
                <span className="text-xs font-medium text-gray-500">Name</span>
              </div>
              <p className="mt-2 truncate text-base font-semibold text-gray-900">{user.name || '—'}</p>
            </div>
            <div className="rounded-2xl bg-[#F8F8FA] p-3 sm:p-4">
              <div className="flex items-center gap-2 text-[#F16A43]">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs font-medium text-gray-500">Member since</span>
              </div>
              <p className="mt-2 text-base font-semibold text-gray-900">
                {user.created_at ? new Date(user.created_at.replace(' ', 'T')).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          {passwordFormOpen && (
            <form onSubmit={handlePasswordChange} className="mt-6 rounded-2xl border border-gray-100 bg-[#FCFCFD] p-5 sm:p-6">
              <h2 className="font-bold text-gray-900">Update your password</h2>
              <p className="mt-1 text-xs text-gray-500">Choose a new password with at least 8 characters.</p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 sm:col-span-2">
                  Current password
                  <span className="relative block">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                      onClick={() => setShowCurrentPassword((show) => !show)}
                      className="absolute right-3 top-4 text-gray-400 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
                <label className="text-xs font-semibold text-gray-700">
                  New password
                  <span className="relative block">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      onClick={() => setShowNewPassword((show) => !show)}
                      className="absolute right-3 top-4 text-gray-400 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
                <label className="text-xs font-semibold text-gray-700">
                  Confirm new password
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              {passwordError && (
                <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {passwordError}
                </p>
              )}
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F16A43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e05831] disabled:cursor-wait disabled:opacity-60"
                >
                  {passwordSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {passwordSubmitting ? 'Saving...' : 'Save new password'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F16A43]">Your library history</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">Books you’ve read</h2>
            </div>
            <button
              type="button"
              aria-expanded={libraryHistoryOpen}
              aria-controls="profile-library-history"
              onClick={() => setLibraryHistoryOpen((open) => !open)}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#D95531]"
            >
              <span>{loading ? '— books' : `${profileData.books_read} ${profileData.books_read === 1 ? 'book' : 'books'}`}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${libraryHistoryOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {libraryHistoryOpen && <div id="profile-library-history">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your reading history...
            </div>
          ) : profileError ? (
            <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {profileError}
            </p>
          ) : profileData.completed_books.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#F8F8FA] px-5 py-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-700">Your reading history is just getting started</p>
              <p className="mt-1 text-xs text-gray-500">Books will appear here after they’ve been returned to the library.</p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-gray-100">
              {profileData.completed_books.map((book) => (
                <article key={book.book_id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                    {book.book_image ? (
                      <img
                        src={`${API_BASE}/${book.book_image}`}
                        alt={book.book_title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-7 w-7 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">{book.book_title}</h3>
                    <p className="mt-1 text-xs text-gray-400">
                      Returned {book.returned_at ? new Date(`${book.returned_at.replace(' ', 'T')}Z`).toLocaleDateString() : '—'}
                    </p>
                    {book.review_id ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500" aria-label={`Rated ${book.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${index < Number(book.rating) ? 'fill-current' : 'text-gray-200'}`}
                            />
                          ))}
                        </span>
                        {!Number(book.review_visible) && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500">
                            Hidden by admin
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">You haven’t reviewed this book yet.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openBookReviews(book.book_id)}
                    className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-xs font-semibold text-[#D95531] transition hover:bg-orange-50"
                  >
                    {book.review_id ? <Eye className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    {book.review_id ? 'View review' : 'Review book'}
                  </button>
                </article>
              ))}
            </div>
          )}
          </div>}
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
