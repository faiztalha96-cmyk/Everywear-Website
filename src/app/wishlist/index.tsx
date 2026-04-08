import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, ShoppingBag, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../../components/shop/product-card";
import { getProducts } from "../../lib/supabase-service";
import { Product } from "../../types";
import { useWishlist } from "../../contexts/wishlist-context";
import { useCart } from "../../contexts/cart-context";
import toast from "react-hot-toast";

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts(1, 1000); // Fetch a large batch for wishlist
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  const addAllToBag = () => {
    wishlistedProducts.forEach(product => {
      addToCart(product, 1, product.sizes[0], product.colors[0].name);
    });
    toast.success("All items added to bag");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (wishlistedProducts.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 bg-secondary flex items-center justify-center">
          <Heart className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground font-light max-w-xs mx-auto">
            Save your favorite items here to keep track of what you love.
          </p>
        </div>
        <Link href="/shop" className="bg-foreground text-background px-10 py-4 text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all">
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="section-container py-12 lg:py-24 xl:py-32">
      <div className="space-y-16 xl:space-y-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 border-b border-border/50 pb-8 md:pb-10">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary">Your Selection</span>
            <h1 className="text-fluid-h2 font-serif font-bold tracking-tight">My Wishlist</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{wishlistedProducts.length} Items Saved</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={addAllToBag}
              className="flex items-center gap-4 bg-foreground text-background px-8 md:px-10 py-3.5 md:py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground transition-all group w-full md:w-auto justify-center"
            >
              <ShoppingBag className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              Add All to Bag
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8 md:gap-x-10 md:gap-y-20">
          <AnimatePresence mode="popLayout">
            {wishlistedProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  delay: i * 0.05,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
