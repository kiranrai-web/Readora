const STORAGE_KEY = 'readora_favorites';

export const getFavorites = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const toggleFavorite = (bookId) => {
  const favorites = getFavorites();
  const index = favorites.indexOf(bookId);
  if (index === -1) {
    favorites.push(bookId);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return favorites;
};

export const isFavorite = (bookId) => {
  return getFavorites().includes(bookId);
};