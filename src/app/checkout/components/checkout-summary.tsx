import { ShieldCheck, Lock } from "lucide-react";
import { CartItem } from "@/contexts/cart-context";
import { Coupon } from "@/types";

interface CheckoutSummaryProps {
  cart: CartItem[];
  subtotal: number;
  appliedCoupons?: Coupon[];
  discountAmount?: number;
}

export function CheckoutSummary({ 
  cart, 
  subtotal, 
  appliedCoupons = [], 
  discountAmount = 0 
}: CheckoutSummaryProps) {
  const finalTotal = subtotal - discountAmount + 100;
  return (
    <div className="sticky top-32 space-y-8">
      <div className="bg-background rounded-[2.5rem] border border-border p-8 md:p-10 space-y-10">
        <div className="space-y-2">
          <h3 className="text-xl font-serif font-bold uppercase tracking-tight">Order Summary</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cart.length} Items in bag</p>
        </div>

        {/* Items List */}
        <div className="space-y-6 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
          {cart.map((item, idx) => (
            <div key={`${item.product.id}-${idx}`} className="flex gap-4">
              <div className="w-20 h-24 bg-secondary/30 rounded-xl overflow-hidden shrink-0 border border-border/50">
                <img 
                  src={item.product.images[0]} 
                  alt={item.product.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-grow space-y-1">
                <p className="text-xs font-bold line-clamp-1">{item.product.name}</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                  {item.selectedSize} / {item.selectedColor} × {item.quantity}
                </p>
                <p className="text-xs font-bold">৳{(item.product.salePrice || item.product.price).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-border/50" />

        {/* Totals */}
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Subtotal</span>
            <span>৳{subtotal.toLocaleString()}</span>
          </div>
          {appliedCoupons.map((coupon) => (
            <div key={coupon.id} className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
              <span>Discount ({coupon.code})</span>
              <span>-৳{(coupon.discountType === 'percentage' ? (subtotal * (coupon.discountValue / 100)) : coupon.discountValue).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Shipping</span>
            <span>৳100</span>
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-serif font-bold uppercase tracking-tight">Total</span>
            <span className="text-2xl font-serif font-bold">৳{finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-[8px] font-bold uppercase tracking-widest leading-tight">Secure Payment</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border">
            <Lock className="w-5 h-5 text-primary" />
            <span className="text-[8px] font-bold uppercase tracking-widest leading-tight">Data Privacy</span>
          </div>
        </div>
      </div>

      {/* Need Help? */}
      <div className="p-8 md:p-10 bg-secondary/10 rounded-[2.5rem] border border-dashed border-border text-center space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Need help with your order?</p>
        <p className="text-xs font-medium">Contact our support team at <br/> <span className="font-bold">support@everywear.com</span></p>
      </div>
    </div>
  );
}
