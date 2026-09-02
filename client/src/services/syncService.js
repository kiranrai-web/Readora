import axios from 'axios';

const API_BASE = 'http://localhost/Readora_API';

const getUserId = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('No user data in localStorage');
      return null;
    }
    const user = JSON.parse(userStr);
    console.log('User from localStorage:', user);
    return user.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

export const syncFavoritesFromBackend = async () => {
  const userId = getUserId();
  console.log('syncFavoritesFromBackend - userId:', userId);
  
  if (!userId) {
    console.log('No userId, skipping favorites sync');
    return [];
  }

  try {
    const response = await axios.get(`${API_BASE}/api/favorite.php`, {
      params: { user_id: userId },
    });

    console.log('Favorites API response:', response.data);

    if (response.data.success && Array.isArray(response.data.favorites)) {
      const favs = response.data.favorites.map((id) => String(id));
      console.log('Synced favorites:', favs);
      localStorage.setItem('readora_favorites', JSON.stringify(favs));
      return favs;
    }
  } catch (error) {
    console.error('Error syncing favorites from backend:', error);
  }
  return [];
};

export const syncBorrowedFromBackend = async () => {
  const userId = getUserId();
  console.log('syncBorrowedFromBackend - userId:', userId);
  
  if (!userId) {
    console.log('No userId, skipping borrowed sync');
    return [];
  }

  try {
    const response = await axios.get(`${API_BASE}/api/borrow.php`, {
      params: { user_id: userId },
    });

    console.log('Borrowed API response:', response.data);

    if (response.data.success && Array.isArray(response.data.borrowed)) {
      const borrowed = response.data.borrowed.map((id) => String(id));
      console.log('Synced borrowed:', borrowed);
      localStorage.setItem('readora_borrowed', JSON.stringify(borrowed));
      return borrowed;
    }
  } catch (error) {
    console.error('Error syncing borrowed from backend:', error);
  }
  return [];
};

export const syncAllFromBackend = async () => {
  console.log('Starting syncAllFromBackend');
  await syncFavoritesFromBackend();
  await syncBorrowedFromBackend();
  console.log('Finished syncAllFromBackend');
};
