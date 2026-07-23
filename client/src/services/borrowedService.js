const STORAGE_KEY = 'readora_borrowed';

export const getBorrowed = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addBorrowed = (bookId) => {
  const borrowed = getBorrowed();
  if (!borrowed.includes(bookId)) {
    borrowed.push(bookId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(borrowed));
  }
  return borrowed;
};

export const removeBorrowed = (bookId) => {
  const borrowed = getBorrowed();
  const index = borrowed.indexOf(bookId);
  if (index !== -1) {
    borrowed.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(borrowed));
  }
  return borrowed;
};

export const isBorrowed = (bookId) => {
  return getBorrowed().includes(bookId);
};