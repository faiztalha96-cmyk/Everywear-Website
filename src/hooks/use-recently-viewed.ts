import { useState, useEffect, useCallback } from "react";
import { Product } from "../types";
import { useAuth } from "../contexts/auth-context";
import { updateRecentlyViewed, getRecentlyViewed } from "../lib/supabase-service";

export function useRecentlyViewed() {
  const { user } = useAuth();
  const storageKey = user ? `everywear-recent-${user.id}` : "everywear-recent-guest";
  
  const [recent, setRecent] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      localStorage.removeItem(storageKey);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(recent));
    if (user) {
      updateRecentlyViewed(user.id, recent);
    }
  }, [recent, user, storageKey]);

  useEffect(() => {
    const loadRecent = async () => {
      if (user) {
        const remote = await getRecentlyViewed(user.id);
        if (remote.length > 0) {
          setRecent(remote);
        }
      }
    };
    loadRecent();
  }, [user]);

  const addRecent = useCallback((product: Product) => {
    setRecent(prev => {
      // Don't update if it's already the most recent to avoid unnecessary renders
      if (prev.length > 0 && prev[0].id === product.id) return prev;
      
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 8);
    });
  }, []);

  return { recent, addRecent };
}
