'use client';
import { useEffect, useState } from 'react';

export function useFavourites(storageKey = 'favourites') {
  const [ids, setIds] = useState([]);

  // Load once from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setIds(Array.isArray(saved) ? saved.map(String) : []);
    } catch (e) {
      console.error('Bad favourites in localStorage', e);
      setIds([]);
    }
  }, [storageKey]);

  // Helpers
  const isFav = (id) => ids.includes(String(id));

  const toggle = (id) => {
    const s = String(id);
    setIds(prev => {
      const next = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return { favouriteIds: ids, isFav, toggle };
}
