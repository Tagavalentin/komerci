import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'marketlocal.favorites.v1';
const CHANGE_EVENT = 'marketlocal:favorites-changed';

function readFavorites() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeFavorites(ids) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    /* stockage local indisponible : les favoris restent en mémoire */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const toggleFavorite = useCallback((productId) => {
    const current = readFavorites();
    writeFavorites(
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }, []);

  return { favorites, toggleFavorite, isFavorite: (productId) => favorites.includes(productId) };
}