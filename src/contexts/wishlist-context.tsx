import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import toast from "react-hot-toast";

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("everywear-wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      localStorage.removeItem("everywear-wishlist");
      return [];
    }
  });

  // Clear wishlist on logout
  const lastUserRef = React.useRef(user);
  useEffect(() => {
    if (lastUserRef.current && !user) {
      clearWishlist();
    }
    lastUserRef.current = user;
  }, [user]);

  useEffect(() => {
    localStorage.setItem("everywear-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = async (productId: string) => {
    const exists = wishlist.includes(productId);
    if (exists) {
      setWishlist(prev => prev.filter(id => id !== productId));
      toast("Removed from wishlist", { icon: "🤍" });
    } else {
      setWishlist(prev => [...prev, productId]);
      toast("Added to wishlist", { icon: "❤️" });
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem("everywear-wishlist");
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
