import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  BookOpen,
  UserPlus,
  CheckCircle2,
  Loader2,
  UploadCloud,
  X,
  Users,
  RotateCcw,
  LayoutDashboard,
  LibraryBig,
  ChevronDown,
  KeyRound,
  Trash2,
  MessageSquare,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getCurrentUser } from '../../services/borrowedService';

const API_BASE = 'http://localhost/Readora_API';

const Admin = () => {
  const [activeForm, setActiveForm] = useState('loans');
  const [loans, setLoans] = useState([]);
  const [loanView, setLoanView] = useState('reserved');
  const [isBookActivityOpen, setIsBookActivityOpen] = useState(true);
  const [areUsersOpen, setAreUsersOpen] = useState(false);
  const [pendingLoanAction, setPendingLoanAction] = useState(null);
  const [loanActionSubmitting, setLoanActionSubmitting] = useState(false);
  const [loanAdminPassword, setLoanAdminPassword] = useState('');
  const [pendingUserAction, setPendingUserAction] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [confirmTemporaryPassword, setConfirmTemporaryPassword] = useState('');
  const [userActionSubmitting, setUserActionSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [inventory, setInventory] = useState({
    total_books: 0,
    borrowed_books: 0,
    reserved_books: 0,
  });
  const [loansLoading, setLoansLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [pendingReviewAction, setPendingReviewAction] = useState(null);
  const [reviewAdminPassword, setReviewAdminPassword] = useState('');
  const [reviewActionSubmitting, setReviewActionSubmitting] = useState(false);

  // Book form state
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: '',
    image: '',
    summary: '',
    quantity: '',
    available: '',
    is_new: '0',
  });

  // Author form state
  const [authorForm, setAuthorForm] = useState({
    name: '',
    bio: '',
    nationality: '',
    birth_year: '',
    death_year: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadLoans = async () => {
    setLoansLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/borrow.php`, {
        params: { admin: '1' },
      });
      setLoans(Array.isArray(res.data.loans) ? res.data.loans : []);
      setUsers(Array.isArray(res.data.users) ? res.data.users : []);
      setTotalUsers(Number(res.data.total_users || 0));
      setInventory(res.data.inventory || { total_books: 0, borrowed_books: 0 });
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setError('Failed to load borrowed books');
    } finally {
      setLoansLoading(false);
    }
  };

  useEffect(() => {
    if (activeForm === 'loans') loadLoans();
  }, [activeForm]);

  const loadReviews = async () => {
    const admin = getCurrentUser();
    if (!admin?.id) {
      setError('Unable to verify the current admin. Please sign in again.');
      return;
    }

    setReviewsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/reviews.php`, {
        params: { admin: '1', admin_id: admin.id },
      });
      setReviews(Array.isArray(response.data.reviews) ? response.data.reviews : []);
    } catch (requestError) {
      console.error('Error loading reviews for moderation:', requestError);
      setError(requestError.response?.data?.message || 'Failed to load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeForm === 'reviews') loadReviews();
  }, [activeForm]);

  const confirmReviewAction = async (event) => {
    event.preventDefault();
    if (!pendingReviewAction || reviewActionSubmitting) return;

    const admin = getCurrentUser();
    if (!admin?.id) {
      setError('Unable to verify the current admin. Please sign in again.');
      return;
    }

    setReviewActionSubmitting(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/api/reviews.php`, {
        action: 'moderate',
        admin_id: admin.id,
        admin_password: reviewAdminPassword,
        review_id: pendingReviewAction.review.id,
        is_visible: pendingReviewAction.isVisible ? 1 : 0,
      });
      if (!response.data.success) {
        setError(response.data.message || 'Review moderation failed.');
        return;
      }

      setMessage(response.data.message);
      setPendingReviewAction(null);
      setReviewAdminPassword('');
      await loadReviews();
    } catch (requestError) {
      console.error('Error moderating review:', requestError);
      setError(requestError.response?.data?.message || 'Review moderation failed.');
    } finally {
      setReviewActionSubmitting(false);
    }
  };

  const handleAdminReturn = async (loan) => {
    setLoanActionSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/borrow.php`, {
        user_id: loan.user_id,
        book_id: loan.book_id,
        action: 'admin_return',
        admin_id: getCurrentUser()?.id,
        admin_password: loanAdminPassword,
      });
      if (!res.data.success) {
        setError(res.data.message || 'Failed to return book');
        return;
      }
      setMessage(`${loan.book_title} returned by ${loan.user_name}. Available copies: ${res.data.available}/${loan.quantity}.`);
      setLoanAdminPassword('');
      setPendingLoanAction(null);
      await loadLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return book');
    } finally {
      setLoanActionSubmitting(false);
    }
  };

  const handleAdminPickup = async (loan) => {
    setLoanActionSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/borrow.php`, {
        user_id: loan.user_id,
        book_id: loan.book_id,
        action: 'pickup',
        admin_id: getCurrentUser()?.id,
        admin_password: loanAdminPassword,
      });
      if (!res.data.success) {
        setError(res.data.message || 'Failed to mark book as picked up');
        return;
      }
      setMessage(`${loan.book_title} picked up by ${loan.user_name}. Their ${loan.loan_days}-day return period has started.`);
      setLoanAdminPassword('');
      setPendingLoanAction(null);
      await loadLoans();
    } catch (err) {
      console.error('Error marking book as picked up:', err);
      setError(err.response?.data?.message || 'Failed to mark book as picked up');
    } finally {
      setLoanActionSubmitting(false);
    }
  };

  const confirmLoanAction = () => {
    if (!pendingLoanAction || loanActionSubmitting) return;
    if (!loanAdminPassword) {
      setError('Enter your admin password to confirm this action.');
      return;
    }
    setError(null);
    if (pendingLoanAction.type === 'pickup') {
      handleAdminPickup(pendingLoanAction.loan);
    } else {
      handleAdminReturn(pendingLoanAction.loan);
    }
  };

  const openUserAction = (type, user) => {
    setError(null);
    setMessage(null);
    setAdminPassword('');
    setTemporaryPassword('');
    setConfirmTemporaryPassword('');
    setPendingUserAction({ type, user });
  };

  const confirmUserAction = async () => {
    if (!pendingUserAction || userActionSubmitting) return;

    if (
      pendingUserAction.type === 'reset_password' &&
      temporaryPassword !== confirmTemporaryPassword
    ) {
      setError('Temporary passwords do not match.');
      return;
    }

    const admin = getCurrentUser();
    if (!admin?.id) {
      setError('Unable to verify the current admin. Please sign in again.');
      return;
    }

    setUserActionSubmitting(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/api/admin_users.php`, {
        action: pendingUserAction.type,
        admin_id: admin.id,
        admin_password: adminPassword,
        user_id: pendingUserAction.user.id,
        ...(pendingUserAction.type === 'reset_password'
          ? { new_password: temporaryPassword }
          : {}),
      });

      if (!response.data.success) {
        setError(response.data.message || 'User action could not be completed.');
        return;
      }

      setMessage(response.data.message);
      if (pendingUserAction.type === 'delete_user') {
        await loadLoans();
      }
      setPendingUserAction(null);
    } catch (requestError) {
      console.error('Error managing user account:', requestError);
      setError(
        requestError.response?.data?.message ||
        'User action could not be completed. Please try again.'
      );
    } finally {
      setUserActionSubmitting(false);
      setAdminPassword('');
      setTemporaryPassword('');
      setConfirmTemporaryPassword('');
    }
  };

  const handleBookChange = (e) => {
    setBookForm({ ...bookForm, [e.target.name]: e.target.value });
  };

  const handleAuthorChange = (e) => {
    setAuthorForm({ ...authorForm, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleImageSelect(file);
  };

  const handleImageInput = (e) => {
    const file = e.target.files?.[0];
    handleImageSelect(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await axios.post(`${API_BASE}/api/upload.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.image; // e.g. "images/book_abc123.jpg"
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      // Upload image first if selected
      let imagePath = bookForm.image;
      if (imageFile) {
        const uploaded = await uploadImage();
        if (uploaded) {
          imagePath = uploaded;
        } else {
          setSubmitting(false);
          return;
        }
      }

      const res = await axios.post(`${API_BASE}/api/books.php`, {
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        image: imagePath,
        summary: bookForm.summary,
        quantity: parseInt(bookForm.quantity, 10) || 0,
        available: parseInt(bookForm.available, 10) || 0,
        is_new: parseInt(bookForm.is_new, 10) || 0,
      });
      setMessage(`Book added successfully! (ID: ${res.data.id})`);
      setBookForm({
        title: '',
        author: '',
        category: '',
        image: '',
        summary: '',
        quantity: '',
        available: '',
        is_new: '0',
      });
      clearImage();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthorSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/api/authors.php`, {
        name: authorForm.name,
        bio: authorForm.bio,
        nationality: authorForm.nationality,
        birth_year: authorForm.birth_year,
        death_year: authorForm.death_year,
      });
      setMessage(`Author added successfully! (ID: ${res.data.id})`);
      setAuthorForm({
        name: '',
        bio: '',
        nationality: '',
        birth_year: '',
        death_year: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add author');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-[#F16A43]";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5";
  const sections = [
    { id: 'loans', label: 'Dashboard', description: 'Library overview and active loans', icon: LayoutDashboard },
    { id: 'reviews', label: 'Reviews', description: 'Moderate reader feedback', icon: MessageSquare },
    { id: 'book', label: 'Add Book', description: 'Add a title to your collection', icon: BookOpen },
    { id: 'author', label: 'Add Author', description: 'Add author information', icon: UserPlus },
  ];
  const activeSection = sections.find((section) => section.id === activeForm);

  return (
    <div className="min-h-screen bg-[#F4F5F9] font-sans text-gray-700 md:flex">
      <aside className="border-b border-gray-200 bg-white px-4 py-5 md:min-h-screen md:w-64 md:flex-shrink-0 md:border-b-0 md:border-r md:px-5 md:py-7">
        <div className="mb-5 flex items-center gap-3 md:mb-10 md:px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F16A43]/10">
            <LibraryBig className="h-6 w-6 text-[#F16A43]" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-gray-900">Readora</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Admin workspace</p>
          </div>
        </div>

        <p className="mb-3 hidden px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 md:block">
          Workspace
        </p>
        <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeForm === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveForm(section.id);
                  setMessage(null);
                  setError(null);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors md:w-full ${
                  isActive
                    ? 'bg-[#F16A43] text-white shadow-sm shadow-orange-200'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-[#F16A43]'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">{section.label}</span>
                  <span className={`hidden text-[10px] md:block ${isActive ? 'text-white/75' : 'text-gray-400'}`}>
                    {section.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-10 hidden rounded-2xl bg-[#F8F8FA] p-4 md:block">
          <p className="text-xs font-semibold text-gray-700">Library administration</p>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
            Manage your collection, members, and active loans.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-9 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <header className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-400">
                <span>Admin</span>
                <span>/</span>
                <span className="text-[#F16A43]">{activeSection?.label}</span>
              </p>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {activeSection?.label}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {activeForm === 'loans'
                  ? 'Monitor your library and manage current loans.'
                  : activeForm === 'reviews'
                  ? 'Review reader feedback and moderate inappropriate content.'
                  : activeForm === 'book'
                  ? 'Expand your collection by adding a new book.'
                  : 'Add and maintain author information.'}
              </p>
            </div>
            <div className="flex items-center gap-3 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm sm:self-auto">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-gray-600">Admin mode</span>
            </div>
          </header>

        {/* Success / Error Messages */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {activeForm === 'loans' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <Users className="w-5 h-5 text-[#F16A43] mb-3" />
                <p className="text-xs text-gray-400">Total users</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalUsers}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <RotateCcw className="w-5 h-5 text-[#F16A43] mb-3" />
                <p className="text-xs text-gray-400">Awaiting pickup</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{inventory.reserved_books}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <BookOpen className="w-5 h-5 text-[#F16A43] mb-3" />
                <p className="text-xs text-gray-400">Total book copies</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{inventory.total_books}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <RotateCcw className="w-5 h-5 text-[#F16A43] mb-3" />
                <p className="text-xs text-gray-400">Currently borrowed</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{inventory.borrowed_books}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 p-5 sm:p-6">
                <button
                  type="button"
                  aria-expanded={isBookActivityOpen}
                  aria-controls="admin-book-activity"
                  onClick={() => setIsBookActivityOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-4 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F16A43]"
                >
                  <span>
                    <span className="block text-lg font-bold text-gray-800">Book activity</span>
                    <span className="mt-1 block text-xs text-gray-400">
                      View reservations awaiting pickup or books currently with members.
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${
                      isBookActivityOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isBookActivityOpen && (
                  <div id="admin-book-activity">
                    <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Book activity">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={loanView === 'reserved'}
                    onClick={() => setLoanView('reserved')}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      loanView === 'reserved'
                        ? 'bg-sky-100 text-sky-800 ring-1 ring-sky-200'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Awaiting pickup <span className="ml-1">{loans.filter((loan) => loan.status === 'reserved').length}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={loanView === 'borrowed'}
                    onClick={() => setLoanView('borrowed')}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      loanView === 'borrowed'
                        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Picked up <span className="ml-1">{loans.filter((loan) => loan.status === 'borrowed').length}</span>
                  </button>
                </div>
              </div>
                )}
              </div>
              {isBookActivityOpen && (loansLoading ? (
                <p className="p-8 text-sm text-gray-400 text-center">Loading book activity...</p>
              ) : (
                (() => {
                  const visibleLoans = loans.filter((loan) => loan.status === loanView);
                  return visibleLoans.length === 0 ? (
                    <p className="p-10 text-center text-sm text-gray-400">
                      {loanView === 'reserved'
                        ? 'No books are waiting for pickup.'
                        : 'No books have been picked up yet.'}
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {visibleLoans.map((loan) => (
                        <div key={loan.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{loan.book_title}</p>
                        <p className="text-sm text-gray-500">{loan.user_name} · {loan.email}</p>
                        <p className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          loan.status === 'reserved'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {loan.status === 'reserved'
                            ? 'Awaiting pickup'
                            : `Picked up · ${loan.loan_days}-day loan`}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Copies available: {loan.available}/{loan.quantity} ·{' '}
                          {loan.status === 'reserved'
                            ? `Reserved ${new Date(`${loan.borrowed_at.replace(' ', 'T')}Z`).toLocaleString()} · Pick up by ${new Date(`${loan.pickup_expires_at.replace(' ', 'T')}Z`).toLocaleString()}`
                            : `Picked up ${new Date(`${(loan.pickup_at || loan.borrowed_at).replace(' ', 'T')}Z`).toLocaleString()}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setLoanAdminPassword('');
                          setPendingLoanAction({
                            loan,
                            type: loan.status === 'reserved' ? 'pickup' : 'return',
                          });
                        }}
                        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                          loan.status === 'reserved'
                            ? 'bg-sky-600 text-white hover:bg-sky-700'
                            : 'bg-[#F16A43] text-white hover:bg-[#e05831]'
                        }`}
                      >
                        {loan.status === 'reserved' ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                        {loan.status === 'reserved' ? 'Mark Picked Up' : 'Mark Returned'}
                      </button>
                    </div>
                  ))}
                    </div>
                  );
                })()
              ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <button
                type="button"
                aria-expanded={areUsersOpen}
                aria-controls="admin-registered-users"
                onClick={() => setAreUsersOpen((open) => !open)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-bold text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F16A43]"
              >
                <span>
                  Registered users
                  <span className="ml-1 text-xs font-medium text-gray-400">({totalUsers})</span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    areUsersOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {areUsersOpen && (
                <div id="admin-registered-users">
              {loansLoading ? (
                <p className="p-6 text-center text-sm text-gray-400">Loading users...</p>
              ) : (
                <div className="overflow-x-auto border-t border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-400">
                      <tr>
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Email</th>
                        <th className="px-5 py-3 font-medium">Joined</th>
                        <th className="px-5 py-3 font-medium">Active books</th>
                        <th className="px-5 py-3 font-medium">Account actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user) => (
                        <tr key={user.id} className="text-sm text-gray-600">
                          <td className="px-5 py-3 font-semibold text-gray-800">{user.name}</td>
                          <td className="px-5 py-3">{user.email}</td>
                          <td className="px-5 py-3">
                            {user.created_at ? new Date(user.created_at.replace(' ', 'T')).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-3 font-semibold">{user.borrowed_count}</td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openUserAction('reset_password', user)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-[#D95531] transition hover:bg-orange-50"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                Reset password
                              </button>
                              <button
                                type="button"
                                disabled={Number(user.borrowed_count) > 0}
                                title={Number(user.borrowed_count) > 0
                                  ? 'Return active books or wait for reservations to expire before removing this user.'
                                  : undefined}
                                onClick={() => openUserAction('delete_user', user)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove user
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
                </div>
              )}
            </section>
          </section>
        )}

        {activeForm === 'reviews' && (
          <section className="space-y-5">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-5">
              <h2 className="font-bold text-gray-900">Reader reviews</h2>
              <p className="mt-1 text-sm text-gray-600">
                Only reviews from returned loans are published. Hide inappropriate reviews or restore them if hidden by mistake.
              </p>
            </div>
            {reviewsLoading ? (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-400 shadow-sm">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm font-semibold text-gray-700">No reviews to moderate</p>
                <p className="mt-1 text-xs text-gray-400">Reader reviews will appear here after submission.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900">{review.book_title}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            Number(review.is_visible)
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {Number(review.is_visible) ? 'Published' : 'Hidden'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {review.user_name} · {new Date(`${review.created_at.replace(' ', 'T')}Z`).toLocaleDateString()}
                        </p>
                        <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                          <Star className="h-4 w-4 fill-current" /> {review.rating}/5
                        </p>
                        {review.comment && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{review.comment}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setPendingReviewAction({
                            review,
                            isVisible: !Number(review.is_visible),
                          });
                          setReviewAdminPassword('');
                        }}
                        className={`inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                          Number(review.is_visible)
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {Number(review.is_visible) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {Number(review.is_visible) ? 'Hide review' : 'Restore review'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Book Form */}
        {activeForm === 'book' && (
          <form onSubmit={handleBookSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Add <span className="text-[#F16A43]">Book</span>
            </h2>

            {/* Image Upload Dropzone */}
            <div>
              <label className={labelClass}>Book Cover Image</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleImageDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#F16A43] transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageInput}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-40 object-cover rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <UploadCloud className="w-10 h-10 text-gray-300" />
                    <p className="text-xs text-gray-500">
                      Drag & drop an image here, or click to browse
                    </p>
                    <p className="text-[10px] text-gray-400">
                      JPG, PNG, GIF, WEBP
                    </p>
                  </div>
                )}
              </div>
              {uploading && (
                <p className="text-xs text-[#F16A43] mt-2 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading image...
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={bookForm.title}
                  onChange={handleBookChange}
                  required
                  placeholder="Book title"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Author *</label>
                <input
                  type="text"
                  name="author"
                  value={bookForm.author}
                  onChange={handleBookChange}
                  required
                  placeholder="Author name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <input
                  type="text"
                  name="category"
                  value={bookForm.category}
                  onChange={handleBookChange}
                  placeholder="e.g. Fiction, History"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={bookForm.quantity}
                  onChange={handleBookChange}
                  min="0"
                  placeholder="Total copies"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Available</label>
                <input
                  type="number"
                  name="available"
                  value={bookForm.available}
                  onChange={handleBookChange}
                  min="0"
                  placeholder="Available copies"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Is New</label>
                <select
                  name="is_new"
                  value={bookForm.is_new}
                  onChange={handleBookChange}
                  className={inputClass}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Summary</label>
              <textarea
                name="summary"
                value={bookForm.summary}
                onChange={handleBookChange}
                rows={4}
                placeholder="Book summary / description"
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-[#F16A43] hover:bg-[#e05831] text-white py-3 rounded-xl font-bold tracking-wider text-xs uppercase shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Book'
              )}
            </button>
          </form>
        )}

        {/* Author Form */}
        {activeForm === 'author' && (
          <form onSubmit={handleAuthorSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Add <span className="text-[#F16A43]">Author</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={authorForm.name}
                  onChange={handleAuthorChange}
                  required
                  placeholder="Author name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={authorForm.nationality}
                  onChange={handleAuthorChange}
                  placeholder="e.g. American, British"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Birth Year</label>
                <input
                  type="text"
                  name="birth_year"
                  value={authorForm.birth_year}
                  onChange={handleAuthorChange}
                  placeholder="e.g. 1930"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Death Year (optional)</label>
                <input
                  type="text"
                  name="death_year"
                  value={authorForm.death_year}
                  onChange={handleAuthorChange}
                  placeholder="e.g. 2013"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                name="bio"
                value={authorForm.bio}
                onChange={handleAuthorChange}
                rows={4}
                placeholder="Author biography"
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F16A43] hover:bg-[#e05831] text-white py-3 rounded-xl font-bold tracking-wider text-xs uppercase shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Author'
              )}
            </button>
          </form>
        )}
        </div>
      </main>
      {pendingLoanAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="loan-action-title"
            aria-describedby="loan-action-description"
            className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-7 shadow-2xl"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              pendingLoanAction.type === 'pickup'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-orange-100 text-[#F16A43]'
            }`}>
              {pendingLoanAction.type === 'pickup'
                ? <CheckCircle2 className="h-6 w-6" />
                : <RotateCcw className="h-6 w-6" />}
            </div>
            <h2 id="loan-action-title" className="text-lg font-bold text-gray-900">
              {pendingLoanAction.type === 'pickup' ? 'Confirm book pickup' : 'Confirm book return'}
            </h2>
            <p id="loan-action-description" className="mt-2 text-sm leading-relaxed text-gray-600">
              {pendingLoanAction.type === 'pickup'
                ? `Confirm that ${pendingLoanAction.loan.user_name} picked up “${pendingLoanAction.loan.book_title}”. This starts their ${pendingLoanAction.loan.loan_days}-day return period.`
                : `Confirm that “${pendingLoanAction.loan.book_title}” was returned by ${pendingLoanAction.loan.user_name}.`}
            </p>
            <label htmlFor="loan-admin-password" className="mt-5 block text-xs font-semibold text-gray-700">
              Confirm with your admin password
            </label>
            <input
              id="loan-admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={loanAdminPassword}
              onChange={(event) => {
                setLoanAdminPassword(event.target.value);
                setError(null);
              }}
              className={`${inputClass} mt-1.5`}
            />
            {error && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loanActionSubmitting}
                onClick={() => {
                  setPendingLoanAction(null);
                  setLoanAdminPassword('');
                  setError(null);
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loanActionSubmitting || !loanAdminPassword}
                onClick={confirmLoanAction}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#F16A43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e05831] disabled:cursor-wait disabled:opacity-60"
              >
                {loanActionSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {loanActionSubmitting
                  ? 'Updating...'
                  : pendingLoanAction.type === 'pickup'
                  ? 'Confirm Pickup'
                  : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingReviewAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={confirmReviewAction}
            className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-7 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-[#F16A43]">
              {pendingReviewAction.isVisible ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {pendingReviewAction.isVisible ? 'Restore this review?' : 'Hide this review?'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {pendingReviewAction.isVisible
                ? `“${pendingReviewAction.review.book_title}” review by ${pendingReviewAction.review.user_name} will be visible to readers again.`
                : `“${pendingReviewAction.review.book_title}” review by ${pendingReviewAction.review.user_name} will no longer appear publicly.`}
            </p>
            <label htmlFor="review-admin-password" className="mt-5 block text-xs font-semibold text-gray-700">
              Confirm with your admin password
            </label>
            <input
              id="review-admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={reviewAdminPassword}
              onChange={(event) => setReviewAdminPassword(event.target.value)}
              className={`${inputClass} mt-1.5`}
            />
            {error && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={reviewActionSubmitting}
                onClick={() => setPendingReviewAction(null)}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewActionSubmitting || !reviewAdminPassword}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#F16A43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e05831] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reviewActionSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {reviewActionSubmitting ? 'Updating...' : pendingReviewAction.isVisible ? 'Restore review' : 'Hide review'}
              </button>
            </div>
          </form>
        </div>
      )}
      {pendingUserAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmUserAction();
            }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="user-action-title"
            aria-describedby="user-action-description"
            className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-7 shadow-2xl"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              pendingUserAction.type === 'delete_user'
                ? 'bg-red-100 text-red-600'
                : 'bg-orange-100 text-[#F16A43]'
            }`}>
              {pendingUserAction.type === 'delete_user'
                ? <Trash2 className="h-6 w-6" />
                : <KeyRound className="h-6 w-6" />}
            </div>
            <h2 id="user-action-title" className="text-lg font-bold text-gray-900">
              {pendingUserAction.type === 'delete_user' ? 'Confirm user removal' : 'Reset user password'}
            </h2>
            <p id="user-action-description" className="mt-2 text-sm leading-relaxed text-gray-600">
              {pendingUserAction.type === 'delete_user'
                ? `Remove ${pendingUserAction.user.name}'s account? This permanently removes their account, favorites, reviews, and borrowing history.`
                : `Set a temporary password for ${pendingUserAction.user.name}. Share it with them directly.`}
            </p>

            {pendingUserAction.type === 'reset_password' && (
              <div className="mt-5 space-y-3">
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  placeholder="Temporary password (at least 8 characters)"
                  aria-label="Temporary password"
                  className={inputClass}
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmTemporaryPassword}
                  onChange={(event) => setConfirmTemporaryPassword(event.target.value)}
                  placeholder="Confirm temporary password"
                  aria-label="Confirm temporary password"
                  className={inputClass}
                />
              </div>
            )}

            <div className="mt-5">
              <label htmlFor="admin-confirm-password" className={labelClass}>
                Enter your admin password to confirm
              </label>
              <input
                id="admin-confirm-password"
                type="password"
                autoComplete="current-password"
                required
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                className={inputClass}
              />
            </div>
            {error && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={userActionSubmitting}
                onClick={() => setPendingUserAction(null)}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  userActionSubmitting ||
                  (pendingUserAction.type === 'reset_password' &&
                    (temporaryPassword.length < 8 ||
                      temporaryPassword !== confirmTemporaryPassword))
                }
                className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  pendingUserAction.type === 'delete_user'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#F16A43] hover:bg-[#e05831]'
                }`}
              >
                {userActionSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {userActionSubmitting
                  ? 'Processing...'
                  : pendingUserAction.type === 'delete_user'
                  ? 'Remove User'
                  : 'Set Temporary Password'}
              </button>
            </div>
          </form>
        </div>
      )}
      </div>
  );
};

export default Admin;