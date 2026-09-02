import axios from 'axios';

const API_BASE = 'http://localhost/Readora_API';

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const getFavorites = async () => {
  const user = getCurrentUser();
  if (!user) return [];

  try {
    const res = await axios.get(`${API_BASE}/api/favorite.php`, {
      params: { user_id: user.id },
    });
    const favs = res.data.favorites || [];
    console.log('Fetched favorites from API:', favs);
    return favs.map((id) => String(id));
  } catch (err) {
    console.error('Error fetching favorites:', err);
    return [];
  }
};

export const toggleFavorite = async (bookId) => {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, message: 'Please login to add books to your favorites.' };
  }

  try {
    const res = await axios.post(`${API_BASE}/api/favorite.php`, {
      user_id: user.id,
      book_id: bookId,
    });
    return { success: true, favorited: res.data.favorited };
  } catch (err) {
    console.error('Error toggling favorite:', err);
    return { success: false, message: 'Failed to update favorite.' };
  }
};

export const isFavorite = async (bookId) => {
  const favorites = await getFavorites();
  return favorites.includes(bookId);
};