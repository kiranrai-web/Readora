import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, UserPlus, CheckCircle2, Loader2, UploadCloud, X, Users, RotateCcw } from 'lucide-react';

const API_BASE = 'http://localhost/Readora_API';

const admin = () => {
  const [activeForm, setActiveForm] = useState('book');
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [inventory, setInventory] = useState({ total_books: 0, borrowed_books: 0 });
  const [loansLoading, setLoansLoading] = useState(false);

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
      setError('Failed to load borrowed books');
    } finally {
      setLoansLoading(false);
    }
  };

  useEffect(() => {
    if (activeForm === 'loans') loadLoans();
  }, [activeForm]);

  const handleAdminReturn = async (loan) => {
    try {
      const res = await axios.post(`${API_BASE}/api/borrow.php`, {
        user_id: loan.user_id,
        book_id: loan.book_id,
        action: 'return',
      });
      if (!res.data.success) {
        setError(res.data.message || 'Failed to return book');
        return;
      }
      setMessage(`${loan.book_title} returned by ${loan.user_name}. Available copies: ${res.data.available}/${loan.quantity}.`);
      loadLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return book');
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

  return (
    <div className="min-h-screen bg-[#F4F5F9] p-8 font-sans text-gray-700">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin <span className="text-[#F16A43]">Panel</span>
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Upload books and manage author information.
        </p>

        {/* Form Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveForm('loans')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeForm === 'loans'
                ? 'bg-[#F16A43] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Library Management
          </button>
          <button
            onClick={() => setActiveForm('book')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeForm === 'book'
                ? 'bg-[#F16A43] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Add Book
          </button>
          <button
            onClick={() => setActiveForm('author')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeForm === 'author'
                ? 'bg-[#F16A43] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Add Author
          </button>
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <Users className="w-5 h-5 text-[#F16A43] mb-3" />
                <p className="text-xs text-gray-400">Total users</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalUsers}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <BookOpen className="w-5 h-5 text-[#F16A43] mb-3" />
                <p className="text-xs text-gray-400">Active borrowed books</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{loans.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm md:col-span-2">
                <BookOpen className="w-5 h-5 text-[#F16A43] mb-3" />
                <p className="text-xs text-gray-400">Book inventory</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {inventory.total_books} total books
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {inventory.borrowed_books} currently borrowed
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Users</h2>
                <p className="text-xs text-gray-400 mt-1">Registered users and their active borrowing totals.</p>
              </div>
              {loansLoading ? (
                <p className="p-8 text-sm text-gray-400 text-center">Loading users...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-400">
                      <tr>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Email</th>
                        <th className="px-6 py-3 font-medium">Joined Readora</th>
                        <th className="px-6 py-3 font-medium">Books borrowed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user) => (
                        <tr key={user.id} className="text-sm text-gray-600">
                          <td className="px-6 py-4 font-semibold text-gray-800">{user.name}</td>
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">
                            {user.created_at ? new Date(user.created_at.replace(' ', 'T')).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4 font-semibold">{user.borrowed_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Current loans</h2>
                <p className="text-xs text-gray-400 mt-1">Return a book only after the user hands it back.</p>
              </div>
              {loansLoading ? (
                <p className="p-8 text-sm text-gray-400 text-center">Loading borrowed books...</p>
              ) : loans.length === 0 ? (
                <p className="p-8 text-sm text-gray-400 text-center">No active borrowed books.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {loans.map((loan) => (
                    <div key={loan.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-800">{loan.book_title}</p>
                        <p className="text-sm text-gray-500">{loan.user_name} · {loan.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Available: {loan.available}/{loan.quantity} · Borrowed {new Date(`${loan.borrowed_at.replace(' ', 'T')}Z`).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdminReturn(loan)}
                        className="flex items-center justify-center gap-2 bg-[#F16A43] hover:bg-[#e05831] text-white px-4 py-2 rounded-lg text-xs font-semibold"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Mark Returned
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
    </div>
  );
};

export default admin;