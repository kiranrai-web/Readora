import axios from 'axios';

const API_BASE = 'http://localhost/Readora_API';

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const getBorrowed = async () => {
  const user = getCurrentUser();
  if (!user) return [];

  try {
    const res = await axios.get(`${API_BASE}/api/borrow.php`, {
      params: { user_id: user.id },
    });
    const borrowed = res.data.borrowed || [];
    console.log('Fetched borrowed from API:', borrowed);
    return borrowed.map((id) => String(id));
  } catch (err) {
    console.error('Error fetching borrowed books:', err);
    return [];
  }
};

export const getBorrowedDetails = async () => {
  const user = getCurrentUser();
  if (!user) return [];

  try {
    const res = await axios.get(`${API_BASE}/api/borrow.php`, {
      params: { user_id: user.id },
    });
    return Array.isArray(res.data.borrowed_details) ? res.data.borrowed_details : [];
  } catch (err) {
    console.error('Error fetching borrowed book details:', err);
    return [];
  }
};

export const addBorrowed = async (bookId, loanDays = 7) => {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, message: 'Please login to borrow books.' };
  }

  try {
    const res = await axios.post(`${API_BASE}/api/borrow.php`, {
      user_id: user.id,
      book_id: bookId,
      loan_days: loanDays,
    });

    return {
      success: res.data.success !== false,
      already_borrowed: !!res.data.already_borrowed,
      message: res.data.message || 'Borrow request processed.',
      available: res.data.available,
      borrow_time_left: res.data.borrow_time_left,
      status: res.data.status,
      pickup_expires_at: res.data.pickup_expires_at,
      loan_days: res.data.loan_days,
    };
  } catch (err) {
    const message = err?.response?.data?.message || 'Failed to borrow book.';
    console.error('Error borrowing book:', err);
    return { success: false, message };
  }
};

export const returnBorrowed = async (bookId) => {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, message: 'Please login to return books.' };
  }

  try {
    const res = await axios.post(`${API_BASE}/api/borrow.php`, {
      user_id: user.id,
      book_id: bookId,
      action: 'return',
    });

    return {
      success: res.data.success !== false,
      message: res.data.message || 'Book returned successfully.',
      available: res.data.available,
      returned: !!res.data.returned,
    };
  } catch (err) {
    const message = err?.response?.data?.message || 'Failed to return book.';
    console.error('Error returning book:', err);
    return { success: false, message };
  }
};

export const isBorrowed = async (bookId) => {
  const borrowed = await getBorrowed();
  return borrowed.includes(bookId);
};