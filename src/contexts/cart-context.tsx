import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, Coupon } from "../types";
import { useAuth } from "./auth-context";
import toast from "react-hot-toast";
import { validateCoupon } from "../services/couponService";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, size: string, color: string) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  cartCount: number;
  
  // Promo Code Support
  appliedCoupons: Coupon[];
  discountAmount: number;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("everywear-cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      localStorage.removeItem("everywear-cart");
      return [];
    }
  });

  const getStock = (product: Product, size: string, color: string) => {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.size === size && v.color === color);
      return variant ? variant.stock : 0;
    }
    return product.stockQuantity || 0;
  };

  // Clear cart on logout
  const lastUserRef = React.useRef(user);
  useEffect(() => {
    if (lastUserRef.current && !user) {
      clearCart();
    }
    lastUserRef.current = user;
  }, [user]);

  useEffect(() => {
    localStorage.setItem("everywear-cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number, size: string, color: string) => {
    const stock = getStock(product, size, color);
    
    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === product.id && 
        item.selectedSize === size && 
        item.selectedColor === color
      );

      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + quantity > stock) {
        toast.error(`Sorry, only ${stock} items available in this size/color.`);
        return prev;
      }

      if (existing) {
        return prev.map(item => 
          item === existing 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { product, quantity, selectedSize: size, selectedColor: color }];
    });
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart(prev => prev.filter(item => 
      !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
    ));
  };

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(prev => {
      const itemToUpdate = prev.find(item => 
        item.product.id === productId && item.selectedSize === size && item.selectedColor === color
      );
      
      if (!itemToUpdate) return prev;
      
      const stock = getStock(itemToUpdate.product, size, color);
      if (quantity > stock) {
        toast.error(`Sorry, only ${stock} items available.`);
        return prev;
      }
      
      return prev.map(item => 
        (item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
          ? { ...item, quantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupons([]);
    localStorage.removeItem("everywear-cart");
  };

  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.salePrice || item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate cumulative discount
  const discountAmount = appliedCoupons.reduce((total, coupon) => {
    let currentDiscount = 0;
    if (coupon.discountType === 'percentage') {
      currentDiscount = subtotal * (coupon.discountValue / 100);
    } else if (coupon.discountType === 'fixed') {
      currentDiscount = coupon.discountValue;
    }
    return total + currentDiscount;
  }, 0);

  // Ensure discount does not exceed subtotal
  const finalDiscountAmount = Math.min(discountAmount, subtotal);

  const applyCoupon = async (code: string) => {
    if (cart.length === 0) {
      toast.error('Your bag is empty.');
      return;
    }

    if (appliedCoupons.find(c => c.code.toUpperCase() === code.toUpperCase())) {
      toast.error('This code is already applied.');
      return;
    }

    const toastId = toast.loading('Applying code...');
    try {
      const coupon = await validateCoupon(code, subtotal);
      
      // Stackability Logic
      const hasNonStackable = appliedCoupons.some(c => !c.isStackable);
      
      if (hasNonStackable) {
        throw new Error('A non-stackable promo code is already applied. Remove it to use others.');
      }

      if (!coupon.isStackable && appliedCoupons.length > 0) {
        throw new Error('This promo code cannot be stacked with others.');
      }

      setAppliedCoupons(prev => [...prev, coupon]);
      toast.success('Promo code applied!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const removeCoupon = (code: string) => {
    setAppliedCoupons(prev => prev.filter(c => c.code !== code));
    toast.success('Promo code removed.');
  };

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, cartCount,
      appliedCoupons, discountAmount: finalDiscountAmount, applyCoupon, removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

