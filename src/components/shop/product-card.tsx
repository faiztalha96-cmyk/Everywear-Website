import React from "react";
import { Link } from "wouter";
import { Heart, Eye, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../../types";
import { cn } from "@/utils/utils";
import { QuickView } from "./quick-view";

import { useCart } from "../../contexts/cart-context";
import { useWishlist } from "../../contexts/wishlist-context";
import { toast } from "react-hot-toast";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const [showQuickView, setShowQuickView] = React.useState(false);
  const isSale = product.salePrice && product.salePrice < product.price;
  const isWishlisted = wishlist.includes(product.id);

  const totalStock = React.useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return product.stockQuantity || 0;
  }, [product]);

  const defaultSize = React.useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const availableVariant = product.variants.find(v => v.stock > 0);
      return availableVariant ? availableVariant.size : (product.sizes?.[0] || "");
    }
    return product.sizes?.[0] || "";
  }, [product]);

  const defaultColor = React.useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const availableVariant = product.variants.find(v => v.stock > 0);
      return availableVariant ? availableVariant.color : (product.colors?.[0]?.name || "");
    }
    return product.colors?.[0]?.name || "";
  }, [product]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, defaultSize, defaultColor);
    toast.success("Added to bag", { id: "add-to-bag" });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative flex flex-col h-full">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 rounded-xl shadow-sm">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <motion.img
            loading="lazy"
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Minimal Badges */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2 z-10">
          {totalStock > 0 && product.isNew && (
            <span className="bg-white text-black px-2 sm:px-3 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm rounded-sm">
              New
            </span>
          )}
          {totalStock > 0 && isSale && (
            <span className="bg-black text-white px-2 sm:px-3 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm rounded-sm">
              Sale
            </span>
          )}
          {totalStock === 0 && (
            <span className="bg-destructive/90 text-destructive-foreground px-2 sm:px-3 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm rounded-sm backdrop-blur-sm">
              Out of Stock
            </span>
          )}
          {totalStock > 0 && totalStock <= 7 && (
            <span className="bg-amber-500 text-black px-2 sm:px-3 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm rounded-sm">
              Low Stock
            </span>
          )}
        </div>

        {/* Wishlist Button - Minimal */}
        <button 
          onClick={handleToggleWishlist}
          className={cn(
            "absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 rounded-full transition-all duration-300 z-20 min-h-[44px] min-w-[44px] flex items-center justify-center",
            isWishlisted 
              ? "bg-primary text-primary-foreground scale-110" 
              : "bg-white/90 text-black hover:bg-white hover:scale-110 shadow-sm"
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
        </button>

        {/* Quick Actions Overlay - Luxury Style (Desktop) */}
        <div className="hidden sm:flex absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1] bg-gradient-to-t from-black/60 to-transparent flex-col gap-3 z-20">
          <button 
            disabled={totalStock === 0}
            onClick={handleQuickAdd}
            className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
          >
            <Plus className="w-3 h-3" />
            {totalStock === 0 ? "Out of Stock" : "Quick Add"}
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
            className="w-full bg-black/40 backdrop-blur-md text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 min-h-[44px]"
          >
            <Eye className="w-3 h-3" />
            Quick View
          </button>
        </div>

        {/* Mobile Quick Add Button */}
        {totalStock > 0 && (
          <div className="sm:hidden absolute bottom-3 right-3 z-20">
            <button 
              onClick={handleQuickAdd}
              className="bg-white/90 text-black p-3 rounded-full shadow-lg active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Quick Add to Bag"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showQuickView && (
          <QuickView product={product} onClose={() => setShowQuickView(false)} />
        )}
      </AnimatePresence>

      <div className="mt-4 sm:mt-6 space-y-2 flex-grow">
        <div className="flex justify-between items-start gap-4">
          <Link href={`/product/${product.slug}`} className="text-[13px] sm:text-[14px] font-medium tracking-tight hover:text-primary transition-colors block leading-tight flex-grow">
            {product.name}
          </Link>
          <div className="flex flex-col items-end shrink-0">
            {isSale ? (
              <div className="flex flex-col items-end">
                <span className="text-[13px] sm:text-[14px] font-bold text-primary">৳{product.salePrice?.toLocaleString()}</span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground line-through opacity-60">৳{product.price.toLocaleString()}</span>
              </div>
            ) : (
              <span className="text-[13px] sm:text-[14px] font-bold">৳{product.price.toLocaleString()}</span>
            )}
          </div>
        </div>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground font-light tracking-wide uppercase">{product.category}</p>
      </div>
    </div>
  );
};
