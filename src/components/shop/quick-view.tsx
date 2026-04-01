import React, { useState } from "react";
import { X, ShoppingBag, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Product } from "../../types";
import { useCart } from "../../contexts/cart-context";
import { useWishlist } from "../../contexts/wishlist-context";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";

interface QuickViewProps {
  product: Product;
  onClose: () => void;
}

export const QuickView: React.FC<QuickViewProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    addToCart(product, 1, selectedSize, selectedColor);
    toast.success("Added to bag", { id: "add-to-bag" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl bg-background border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-background/50 backdrop-blur-md hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Gallery */}
        <div className="relative w-full md:w-1/2 aspect-[3/4] bg-secondary overflow-hidden">
          <img 
            src={product.images[currentImageIndex]} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          {product.images.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 backdrop-blur-md hover:bg-background transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 backdrop-blur-md hover:bg-background transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Details */}
        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-serif font-bold">{product.name}</h2>
            <div className="flex items-center gap-4">
              {product.salePrice ? (
                <>
                  <span className="text-2xl font-bold text-primary">৳{product.salePrice.toLocaleString()}</span>
                  <span className="text-lg text-muted-foreground line-through">৳{product.price.toLocaleString()}</span>
                </>
              ) : (
                <span className="text-2xl font-bold">৳{product.price.toLocaleString()}</span>
              )}
            </div>
          </div>

          <p className="text-muted-foreground font-light leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-6">
            {/* Size Selector */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest">Select Size</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center text-xs font-bold border transition-all",
                      selectedSize === size 
                        ? "bg-foreground text-background border-foreground" 
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest">Select Color</span>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "group relative w-8 h-8 rounded-full border-2 transition-all",
                      selectedColor === color.name ? "border-primary scale-110" : "border-transparent"
                    )}
                  >
                    <span 
                      className="absolute inset-0.5 rounded-full border border-black/10" 
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleAddToCart}
              className="flex-grow bg-foreground text-background py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center justify-center gap-3"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Bag
            </button>
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={cn(
                "w-16 flex items-center justify-center border transition-all",
                isWishlisted ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
              )}
            >
              <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
