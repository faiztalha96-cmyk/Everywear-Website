import React from "react";
import { Link } from "wouter";
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../../contexts/cart-context";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";

export default function Cart() {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    cartCount,
    appliedCoupons, 
    discountAmount, 
    applyCoupon, 
    removeCoupon 
  } = useCart();
  const [promoCodeInput, setPromoCodeInput] = React.useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (cartCount === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 bg-secondary flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold">Your Bag is Empty</h1>
          <p className="text-muted-foreground font-light max-w-xs mx-auto">
            Looks like you haven't added anything to your bag yet. Explore our collection and find something you love.
          </p>
        </div>
        <Link href="/shop" className="bg-foreground text-background px-10 py-4 text-xs font-semibold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="section-container py-12 lg:py-24 xl:py-32">
      <div className="flex flex-col lg:flex-row gap-16 xl:gap-24">
        {/* Cart Items */}
        <div className="flex-grow space-y-12">
          <div className="flex justify-between items-end border-b border-border/50 pb-8">
            <div className="space-y-2">
              <h1 className="text-fluid-h2 font-serif font-bold tracking-tight">Shopping Bag</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Review your selection</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{cartCount} Items</span>
          </div>

          <div className="divide-y divide-border/30">
            <AnimatePresence mode="popLayout">
              {cart.map((item, idx) => (
                <motion.div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-8 py-10 first:pt-0"
                >
                  <Link href={`/product/${item.product.slug}`} className="w-28 md:w-40 aspect-[3/4] flex-shrink-0 bg-secondary/30 overflow-hidden group">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </Link>

                  <div className="flex-grow flex flex-col justify-between py-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <Link href={`/product/${item.product.slug}`} className="text-xl md:text-2xl font-serif font-bold hover:text-primary transition-colors block leading-tight">
                          {item.product.name}
                        </Link>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Color: <span className="text-foreground">{item.selectedColor}</span>
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Size: <span className="text-foreground">{item.selectedSize}</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          removeFromCart(item.product.id, item.selectedSize, item.selectedColor);
                          toast.success("Removed from bag");
                        }}
                        className="p-2 hover:bg-secondary/50 text-muted-foreground hover:text-destructive transition-all rounded-full"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between items-end pt-6">
                      <div className="flex items-center border border-border/50 h-12">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                          className="px-4 hover:bg-secondary/50 transition-colors h-full"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                          className="px-4 hover:bg-secondary/50 transition-colors h-full"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Subtotal</p>
                        <span className="text-lg font-bold">
                          {formatPrice((item.product.salePrice || item.product.price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="pt-12 border-t border-border/50">
            <Link href="/shop" className="group inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:text-primary transition-colors">
              <div className="w-8 h-[1px] bg-current transition-all group-hover:w-12" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[450px] flex-shrink-0">
          <div className="bg-secondary/20 p-10 xl:p-12 space-y-10 sticky top-[120px] border border-border/30">
            <h2 className="text-2xl font-serif font-bold uppercase tracking-[0.2em]">Summary</h2>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Promo Code</p>
                </div>
                
                {/* Coupon Input - Only show if current coupons allow stacking or no coupons exist */}
                {(!appliedCoupons.some(c => !c.isStackable)) && (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Enter code"
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon(promoCodeInput.trim())}
                      className="flex-grow bg-background border border-border/50 px-6 py-4 text-xs font-bold focus:outline-none focus:border-primary uppercase tracking-widest"
                    />
                    <button 
                      onClick={() => applyCoupon(promoCodeInput.trim())}
                      className="bg-foreground text-background px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Applied Coupons List */}
                <div className="space-y-2">
                  {appliedCoupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between bg-primary/10 border border-primary/20 px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          {coupon.code}
                        </span>
                        <span className="text-[9px] font-bold text-primary/70 uppercase">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `৳${coupon.discountValue} OFF`}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeCoupon(coupon.code)}
                        className="text-[9px] text-destructive uppercase font-bold tracking-widest hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5 pt-6 border-t border-border/30">
                <div className="flex justify-between text-xs uppercase tracking-widest">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupons.length > 0 && (
                  <div className="flex justify-between text-xs uppercase tracking-widest text-primary">
                    <span>Discount</span>
                    <span className="font-bold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs uppercase tracking-widest">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-primary font-bold">Complimentary</span>
                </div>
                <div className="flex justify-between text-xs uppercase tracking-widest">
                  <span className="text-muted-foreground">Estimated Tax</span>
                  <span className="font-bold">৳0</span>
                </div>
                <div className="flex justify-between text-2xl font-serif font-bold pt-8 border-t border-border/30">
                  <span>Total</span>
                  <span>{formatPrice(subtotal - discountAmount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/checkout" className="w-full bg-foreground text-background py-6 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-primary hover:text-primary-foreground transition-all group">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest opacity-60">
                Secure checkout powered by SSL encryption
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 pt-6 grayscale opacity-30">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
