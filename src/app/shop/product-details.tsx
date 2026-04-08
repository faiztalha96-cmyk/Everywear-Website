import { useState, useEffect, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "motion/react";
import { 
  ShoppingBag, 
  Heart, 
  Truck, 
  RefreshCw, 
  Ruler, 
  Minus,
  Plus,
  X,
  Loader2,
  Star,
  MessageSquare,
  User as UserIcon,
  Edit2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "../../types";
import { getProductBySlug } from "../../lib/supabase-service";
import { useCart } from "../../contexts/cart-context";
import { useWishlist } from "../../contexts/wishlist-context";
import { useAuth } from "../../contexts/auth-context";
import { useRecentlyViewed } from "../../hooks/use-recently-viewed";
import { getReviews, submitReview } from "../../services/reviewService";
import { ProductCard } from "../../components/shop/product-card";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";

export default function ProductDetails() {
  const [match, params] = useRoute<{ slug: string }>("/product/:slug");
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addRecent } = useRecentlyViewed();

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: product, isLoading: loading } = useQuery({
    queryKey: ['product', params?.slug],
    queryFn: () => getProductBySlug(params!.slug),
    enabled: !!params?.slug,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => getReviews(product!.id),
    enabled: !!product?.id
  });

  const userReview = useMemo(() => 
    reviews.find(r => r.userId === user?.id),
    [reviews, user?.id]
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const reviewMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) => 
      submitReview(product!.id, data.rating, data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', product?.id] });
      toast.success(isEditing ? "Review updated!" : "Review submitted!");
      setIsEditing(false);
      setReviewComment("");
      setReviewRating(5);
    },
    onError: (err) => {
      console.error("Review submission error:", err);
      toast.error("Failed to submit review");
    }
  });

  useEffect(() => {
    if (userReview && !isEditing) {
      setReviewRating(userReview.rating);
      setReviewComment(userReview.comment || "");
    }
  }, [userReview, isEditing]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Please select a rating between 1 and 5");
      return;
    }
    reviewMutation.mutate({ rating: reviewRating, comment: reviewComment });
  };

  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => 
        v.size === selectedSize && v.color === selectedColor
      );
      return variant ? variant.stock : 0;
    }
    return product.stockQuantity || 0;
  }, [product, selectedSize, selectedColor]);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || "");
      setSelectedColor(product.colors?.[0]?.name || "");
      setActiveImage(0);
      setQuantity(1);
      addRecent(product);
      window.scrollTo(0, 0);
    }
  }, [product, addRecent]);

  // Adjust quantity if it exceeds current stock when selection changes
  useEffect(() => {
    if (currentStock > 0 && quantity > currentStock) {
      setQuantity(currentStock);
    } else if (currentStock === 0 && quantity !== 1) {
      setQuantity(1);
    }
  }, [currentStock, quantity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background section-container py-8 md:py-16">
        <div className="animate-pulse space-y-10 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-20">
          <div className="space-y-6">
            <div className="bg-secondary/50 rounded-2xl md:rounded-3xl aspect-[3/4] w-full" />
            <div className="hidden md:grid grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl aspect-[3/4]" />
              ))}
            </div>
          </div>
          <div className="space-y-10 md:space-y-12">
            <div className="space-y-6">
              <div className="h-4 bg-secondary/50 w-24 rounded-full" />
              <div className="h-12 md:h-16 bg-secondary/50 w-3/4 rounded-xl" />
              <div className="h-8 bg-secondary/50 w-1/3 rounded-xl mt-6" />
              <div className="space-y-3 mt-8">
                <div className="h-4 bg-secondary/50 w-full rounded-md" />
                <div className="h-4 bg-secondary/50 w-5/6 rounded-md" />
                <div className="h-4 bg-secondary/50 w-4/6 rounded-md" />
              </div>
            </div>
            <div className="space-y-8 pt-4">
              <div className="flex gap-4">
                <div className="h-14 bg-secondary/50 w-1/2 md:w-1/3 rounded-xl" />
                <div className="h-14 bg-secondary/50 w-1/2 md:w-2/3 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-10 border-t border-border/50">
                <div className="h-16 bg-secondary/50 w-full rounded-xl" />
                <div className="h-16 bg-secondary/50 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!match || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
          <X className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold uppercase">Product Not Found</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">The item you're looking for might have been removed or moved to a different collection.</p>
        </div>
        <Link href="/shop" className="bg-foreground text-background px-10 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary transition-all active:scale-95">
          Back to Shop
        </Link>
      </div>
    );
  }

  const isSale = product.salePrice && product.salePrice < product.price;
  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    const finalSize = selectedSize || (product.sizes?.length > 0 ? product.sizes[0] : "One Size");
    const finalColor = selectedColor || (product.colors?.length > 0 ? product.colors[0].name : "Default");
    addToCart(product, quantity, finalSize, finalColor);
    toast.success("Added to bag", { id: "add-to-bag" });
  };

  const nextImage = () => setActiveImage((prev) => (prev + 1) % product.images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="section-container py-8 md:py-16">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[150px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          {/* Images Section */}
          <div className="space-y-6">
            <div className="relative aspect-[3/4] bg-secondary/30 rounded-2xl md:rounded-3xl overflow-hidden group">
              <img 
                src={product.images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Mobile Image Navigation */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:hidden">
                <button 
                  onClick={prevImage}
                  className="w-10 h-10 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextImage}
                  className="w-10 h-10 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Image Indicators */}
              <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2 md:hidden">
                {product.images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      activeImage === idx ? "w-6 bg-primary" : "w-1.5 bg-white/50"
                    )} 
                  />
                ))}
              </div>
            </div>

            {/* Thumbnails - Hidden on small mobile, shown on md+ */}
            <div className="hidden md:grid grid-cols-4 lg:grid-cols-5 gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-300",
                    activeImage === idx ? "border-primary shadow-lg shadow-primary/20 scale-105" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-10 md:space-y-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">{product.category}</span>
                  {product.isNew && <span className="bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">New</span>}
                  {currentStock === 0 && (
                    <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Out of Stock</span>
                  )}
                  {currentStock > 0 && currentStock <= 7 && (
                    <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Low Stock - Only {currentStock} left</span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight uppercase leading-[1.1]">{product.name}</h1>
              </div>

              <div className="flex items-center gap-4 text-2xl md:text-3xl">
                {isSale ? (
                  <>
                    <span className="text-primary font-bold">৳{product.salePrice?.toLocaleString()}</span>
                    <span className="text-muted-foreground line-through opacity-40 text-xl md:text-2xl">৳{product.price.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="font-bold">৳{product.price.toLocaleString()}</span>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Description</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium tracking-wide">{product.description}</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Color: <span className="text-primary">{selectedColor}</span></label>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map(color => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all duration-300 relative p-1",
                          selectedColor === color.name ? "border-primary scale-110 shadow-lg shadow-primary/20" : "border-border/50 hover:border-primary/50"
                        )}
                        aria-label={`Select color ${color.name}`}
                      >
                        <div className="w-full h-full rounded-full" style={{ backgroundColor: color.hex }} />
                        {selectedColor === color.name && (
                          <motion.div layoutId="color-ring" className="absolute -inset-1.5 border border-primary rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Size: <span className="text-primary">{selectedSize}</span></label>
                  <button className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors">
                    <Ruler className="w-3 h-3" /> Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "min-w-[56px] h-12 flex items-center justify-center text-[10px] font-black uppercase tracking-widest border-2 rounded-xl transition-all duration-300 active:scale-95",
                        selectedSize === size 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                          : "bg-background text-foreground border-border/50 hover:border-primary/50"
                      )}
                      aria-label={`Select size ${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex items-center bg-secondary/50 rounded-xl overflow-hidden h-14 sm:w-36">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                    className="flex-1 h-full flex items-center justify-center hover:bg-secondary transition-colors active:scale-90"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-black text-sm">{currentStock === 0 ? 0 : quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(currentStock, q + 1))} 
                    disabled={quantity >= currentStock || currentStock === 0}
                    className="flex-1 h-full flex items-center justify-center hover:bg-secondary transition-colors active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  className="flex-grow bg-foreground text-background h-14 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary transition-all duration-500 shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {currentStock === 0 ? "Out of Stock" : "Add to Bag"}
                </button>
                
                <button 
                  onClick={() => toggleWishlist(product.id)}
                  className={cn(
                    "h-14 w-14 sm:w-14 flex items-center justify-center border-2 rounded-xl transition-all duration-300 active:scale-90",
                    isWishlisted ? "bg-primary/10 border-primary text-primary" : "border-border/50 hover:border-primary/50"
                  )}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-10 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 bg-secondary/20 rounded-2xl text-center sm:text-left">
                <Truck className="w-5 h-5 text-primary" />
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest">Free Shipping</p>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-widest">On orders over ৳10,000</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 bg-secondary/20 rounded-2xl text-center sm:text-left">
                <RefreshCw className="w-5 h-5 text-primary" />
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest">Easy Returns</p>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-widest">14-day exchange policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 md:mt-32 pt-16 border-t border-border/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">
            {/* Summary & Form */}
            <div className="space-y-10">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight uppercase">Customer Reviews</h2>
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center text-primary">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={cn(
                            "w-5 h-5", 
                            star <= Math.round(Number(averageRating)) ? "fill-current" : "opacity-20"
                          )} 
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{reviews.length} Verified Reviews</p>
                  </div>
                  <div className="text-5xl font-serif font-bold">{averageRating}</div>
                </div>
              </div>

              {user ? (
                (!userReview || isEditing) ? (
                  <form onSubmit={handleSubmitReview} className="space-y-8 bg-secondary/20 p-8 rounded-[2rem] border border-border/50">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">
                        {isEditing ? "Edit your review" : "Write a review"}
                      </h3>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 transition-transform active:scale-90"
                            aria-label={`Rate ${star} stars`}
                          >
                            <Star 
                              className={cn(
                                "w-7 h-7 transition-all duration-300",
                                star <= reviewRating ? "fill-primary text-primary scale-110" : "text-muted-foreground opacity-20"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Your Experience</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your thoughts about this product..."
                        className="w-full h-40 bg-background border border-border/50 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-primary transition-all resize-none placeholder:text-muted-foreground/30"
                        required
                        aria-label="Review comment"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={reviewMutation.isPending}
                        className="flex-grow bg-foreground text-background py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-50 active:scale-95"
                      >
                        {reviewMutation.isPending ? "Submitting..." : (isEditing ? "Update Review" : "Submit Review")}
                      </button>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-8 py-5 border-2 border-border/50 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-secondary transition-all active:scale-95"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Your Review</h3>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                    <div className="flex text-primary gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={cn("w-4 h-4", star <= userReview.rating ? "fill-current" : "opacity-20")} />
                      ))}
                    </div>
                    <p className="text-base font-serif italic text-foreground/80 leading-relaxed">"{userReview.comment}"</p>
                  </div>
                )
              ) : (
                <div className="bg-secondary/20 p-10 rounded-[2rem] text-center space-y-6 border border-dashed border-border/50">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-muted-foreground">Log in to share your experience with this product.</p>
                  </div>
                  <Link href="/login" className="inline-block bg-foreground text-background px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95">
                    Log In Now
                  </Link>
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-12">
              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fetching reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-12">
                  {reviews.map((review) => (
                    <div key={review.id} className="space-y-6 pb-12 border-b border-border/50 last:border-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center overflow-hidden border border-border/50">
                            {review.profiles?.avatar_url ? (
                              <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black uppercase tracking-tight">{review.profiles?.full_name || "Anonymous"}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                              {new Date(review.createdAt).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex text-primary gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={cn("w-3.5 h-3.5", star <= review.rating ? "fill-current" : "opacity-20")} />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium tracking-wide">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center space-y-6 border-2 border-dashed border-border/50 rounded-[2rem] bg-secondary/5">
                  <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-muted-foreground opacity-30" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-serif font-bold italic">No reviews yet</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Be the first to share your thoughts</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
