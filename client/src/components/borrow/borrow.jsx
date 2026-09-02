import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Scan,
  Check,
  ChevronDown,
} from 'lucide-react';
import { addBorrowed, getBorrowed, getCurrentUser } from '../../services/borrowedService';

const API_BASE = 'http://localhost/Readora_API';

export default function Borrow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Single modal step state: 'FORM' | 'PROCESSING' | 'SUCCESS'
  const [modalStep, setModalStep] = useState('FORM');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [borrowMessage, setBorrowMessage] = useState('');

  // Form state
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => String(currentYear + i));
  const dayOptions = Array.from({ length: 31 }, (_, i) => pad(i + 1));
  const monthOptions = Array.from({ length: 12 }, (_, i) => pad(i + 1));

  const [fromDate, setFromDate] = useState({
    day: pad(now.getDate()),
    month: pad(now.getMonth() + 1),
    year: String(currentYear),
  });
  const [toDate, setToDate] = useState({
    day: pad(now.getDate()),
    month: pad(now.getMonth() + 1),
    year: String(currentYear),
  });
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!id) return;

    Promise.all([
      axios.get(`${API_BASE}/api/books.php`),
      getBorrowed(),
    ])
      .then(([booksResponse, borrowedIds]) => {
        const data = Array.isArray(booksResponse.data) ? booksResponse.data : [];
        const matched = data.find((b) => String(b.id) === String(id));
        if (matched) {
          setBook(matched);
          if (borrowedIds.includes(String(id))) {
            setBorrowMessage('You have already borrowed this book. Borrowing must be returned through the admin.');
            setModalStep('ALREADY_BORROWED');
          }
        } else {
          setError('Book not found');
        }
      })
      .catch(() => {
        setError('Failed to load book details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
      alert('Please login to borrow books.');
      navigate('/login');
      return;
    }

    if (Number(book.available || 0) <= 0) {
      alert('This book is currently unavailable.');
      return;
    }

    setModalStep('PROCESSING');
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        const next = prev + Math.random() * 15 + 5;
        if (next >= 100) {
          clearInterval(interval);

          addBorrowed(id).then((result) => {
                  if (!result.success || result.already_borrowed) {
                    setBorrowMessage(result.message || 'You have already borrowed this book. Borrowing must be returned through the admin.');
                    setModalStep('ALREADY_BORROWED');
              return;
            }

            setTimeout(() => setModalStep('SUCCESS'), 200);
          });

          return 100;
        }
        return next;
      });
    }, 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F9] p-6 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-[#F4F5F9] p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">{error || 'Book not found'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-[#F16A43] underline">
          Go back
        </button>
      </div>
    );
  }

  const available = parseInt(book.available, 10) > 0;
  const coverUrl = `${API_BASE}/${book.image}`;
  const authorName = book.author ? book.author.replace(/\r?\n/g, '').trim() : 'Unknown';
  const serialNo = `RR-${String(book.id).padStart(3, '0')}`;

  return (
    <div className="min-h-screen bg-[#F4F5F9] font-sans text-gray-700 relative">
      {/* Main Container */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to results</span>
        </button>

        {/* Book Main Card Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cover */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <div className="w-48 h-64 rounded shadow-md overflow-hidden mb-6">
              <img
                src={coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Book Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{book.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                By <span className="underline font-medium text-gray-600">{authorName}</span>
                {book.created_at && (
                  <span className="text-gray-400">, {new Date(book.created_at).getFullYear()}</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">{book.category}</p>
            </div>

            <div className="flex gap-10 text-xs pt-2">
              <div>
                <p className="font-bold text-gray-800 mb-2">Availability</p>
                <ul className="space-y-1.5 text-gray-600">
                  <li className="flex items-center gap-1.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        available
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
              </div>
            </div>

            {!available && (
              <div className="flex gap-3 pt-2">
                <button
                  disabled
                  className="flex-1 py-3 rounded-lg font-bold tracking-wider text-sm shadow-sm bg-gray-200 text-gray-400 cursor-not-allowed"
                >
                  UNAVAILABLE
                </button>
              </div>
            )}
          </div>

          {/* Author Block */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">
              <span className="text-[#F16A43]">About</span> this Book
            </h2>
            {book.summary ? (
              <p className="text-xs text-gray-500 leading-relaxed">{book.summary}</p>
            ) : (
              <p className="text-xs text-gray-400 italic">No summary available.</p>
            )}
          </div>
        </div>

        {/* Lower Metadata Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-[11px] text-gray-400 font-medium">Total Copies</p>
            <p className="text-xs font-bold text-[#F16A43] mt-1">{book.quantity || 0}</p>
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-[11px] text-gray-400 font-medium">Available</p>
            <p className="text-xs font-bold text-gray-800 mt-1">{book.available || 0}</p>
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-[11px] text-gray-400 font-medium">Category</p>
            <p className="text-xs font-bold text-gray-800 mt-1">{book.category || '—'}</p>
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-[11px] text-gray-400 font-medium">Added</p>
            <p className="text-xs font-bold text-gray-800 mt-1">
              {book.created_at ? new Date(book.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </main>

      {/* ==================== INTERACTIVE MODAL FLOW ==================== */}
      {modalStep !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          {/* STEP 1: FILL UP DETAILS FORM */}
          {modalStep === 'ALREADY_BORROWED' && (
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                <Check className="w-7 h-7 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Already Borrowed</h2>
              <p className="text-sm text-gray-500">{borrowMessage}</p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full bg-[#F16A43] hover:bg-[#e05831] text-white py-3 rounded-xl font-bold text-xs uppercase shadow-md"
              >
                Go Back
              </button>
            </div>
          )}

          {modalStep === 'FORM' && (
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold text-center text-gray-900">
                Fill Up the Details
              </h2>

              <form onSubmit={handleBorrowSubmit} className="space-y-5">
                {/* From Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">From</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                      <select
                        value={fromDate.day}
                        onChange={(e) => setFromDate({...fromDate, day: e.target.value})}
                        className="w-full bg-gray-100/80 text-gray-700 text-xs py-2.5 px-3 rounded-lg appearance-none outline-none font-medium text-center"
                      >
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={fromDate.month}
                        onChange={(e) => setFromDate({...fromDate, month: e.target.value})}
                        className="w-full bg-gray-100/80 text-gray-700 text-xs py-2.5 px-3 rounded-lg appearance-none outline-none font-medium text-center"
                      >
                        {monthOptions.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={fromDate.year}
                        onChange={(e) => setFromDate({...fromDate, year: e.target.value})}
                        className="w-full bg-gray-100/80 text-gray-700 text-xs py-2.5 px-3 rounded-lg appearance-none outline-none font-medium text-center"
                      >
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">To</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                      <select
                        value={toDate.day}
                        onChange={(e) => setToDate({...toDate, day: e.target.value})}
                        className="w-full bg-gray-100/80 text-gray-700 text-xs py-2.5 px-3 rounded-lg appearance-none outline-none font-medium text-center"
                      >
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={toDate.month}
                        onChange={(e) => setToDate({...toDate, month: e.target.value})}
                        className="w-full bg-gray-100/80 text-gray-700 text-xs py-2.5 px-3 rounded-lg appearance-none outline-none font-medium text-center"
                      >
                        {monthOptions.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={toDate.year}
                        onChange={(e) => setToDate({...toDate, year: e.target.value})}
                        className="w-full bg-gray-100/80 text-gray-700 text-xs py-2.5 px-3 rounded-lg appearance-none outline-none font-medium text-center"
                      >
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Serial No — auto-generated */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Book Serial No.</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={serialNo}
                      readOnly
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 outline-none cursor-not-allowed"
                    />
                    <Scan className="w-4 h-4 text-red-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Purpose"
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-[#F16A43] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={Number(book.available || 0) <= 0}
                    className={`w-full py-3 rounded-xl font-bold tracking-wider text-xs uppercase shadow-md transition-all ${
                      Number(book.available || 0) <= 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#F16A43] hover:bg-[#e05831] text-white'
                    }`}
                  >
                    {Number(book.available || 0) <= 0 ? 'UNAVAILABLE' : 'BORROW'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: PROCESSING ANIMATION */}
          {modalStep === 'PROCESSING' && (
            <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold text-gray-900">
                Processing Your Request
              </h2>

              {/* Animated progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mt-2">
                <div
                  className="h-full bg-[#F16A43] rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${Math.min(processingProgress, 100)}%` }}
                />
              </div>

              <p className="text-xs text-gray-400">
                {processingProgress < 100
                  ? 'Reserving book, please wait...'
                  : 'Almost done...'}
              </p>

              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-[#F16A43] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PROCESS COMPLETED SUCCESS */}
          {modalStep === 'SUCCESS' && (
            <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold text-gray-900">
                Process Completed
              </h2>

              <div className="w-24 h-24 rounded-full bg-[#3EC150] flex items-center justify-center shadow-lg my-2">
                <Check className="w-14 h-14 text-white stroke-[3]" />
              </div>

              <button
                onClick={() => navigate('/shelf')}
                className="w-full bg-[#F16A43] hover:bg-[#e05831] text-white py-3 rounded-xl font-bold text-xs uppercase shadow-md transition-all"
              >
                Go to My Shelf
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}