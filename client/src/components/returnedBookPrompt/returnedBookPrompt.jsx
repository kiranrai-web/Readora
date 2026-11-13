import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost/Readora_API';

const getSignedInUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const getDismissedBookIds = (userId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(`dismissed-return-reviews-${userId}`) || '[]');
    return Array.isArray(saved) ? saved.map(String) : [];
  } catch {
    return [];
  }
};

export default function ReturnedBookPrompt() {
  const location = useLocation();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  useEffect(() => {
    let active = true;
    const user = getSignedInUser();
    setBook(null);

    if (!user?.id || user.role === 'admin') return () => {
      active = false;
    };

    axios.get(`${API_BASE}/api/reviews.php`, {
      params: { pending_returns: '1', user_id: user.id },
    })
      .then(({ data }) => {
        if (!active) return;
        const books = Array.isArray(data.books) ? data.books : [];
        const dismissed = getDismissedBookIds(user.id);
        setBook(books.find((returnedBook) => !dismissed.includes(String(returnedBook.book_id))) || null);
      })
      .catch((error) => {
        console.error('Error checking for returned books to review:', error);
      });

    return () => {
      active = false;
    };
  }, [location.pathname, location.key]);

  const dismiss = () => {
    const user = getSignedInUser();
    if (!user?.id || !book) return;
    const dismissed = getDismissedBookIds(user.id);
    if (!dismissed.includes(String(book.book_id))) {
      localStorage.setItem(
        `dismissed-return-reviews-${user.id}`,
        JSON.stringify([...dismissed, String(book.book_id)])
      );
    }
    setBook(null);
  };

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="returned-book-title"
        className="relative w-full max-w-md rounded-3xl border border-orange-100 bg-white p-7 text-center shadow-2xl"
      >
        <button
          type="button"
          aria-label="Close review invitation"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 id="returned-book-title" className="mt-4 text-xl font-bold text-gray-900">
          Thanks for returning your book!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          We hope you enjoyed <span className="font-semibold text-gray-800">{book.book_title}</span>.
          Share what you thought with other readers.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              navigate(`/book/${book.book_id}`, { state: { activeTab: 'Reviews' } });
            }}
            className="rounded-xl bg-[#F16A43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e05831]"
          >
            Review this book
          </button>
        </div>
      </section>
    </div>
  );
}
