import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { ProductCard } from "../../components/shop/product-card";
import { getProducts, getSettingsData, subscribeToNewsletter, getCategories } from "../../lib/supabase-service";
import { useTheme } from "../../contexts/theme-context";
import toast from "react-hot-toast";
import { InteractiveHero } from "../../components/home/interactive-hero";

export default function Home() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const { data: featuredProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["home-featured-products"],
    queryFn: () => getProducts(1, 4, { isFeatured: true, sort: 'newest' }),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    select: (res) => res.data,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettingsData,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribing(true);
    try {
      await subscribeToNewsletter(email);
      toast.success("Thank you for subscribing!");
      setEmail("");
    } catch (err: any) {
      if (err.code === "23505") {
        toast.error("You are already subscribed!");
      } else {
        toast.error("Failed to subscribe. Please try again.");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="bg-background selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Hero Section */}
      <InteractiveHero settings={settings} settingsLoading={settingsLoading} theme={theme} />

      {/* Brand Story Section */}
      <section className="py-16 md:py-32 bg-background overflow-hidden">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative aspect-[4/5] overflow-hidden bg-secondary/20 rounded-2xl md:rounded-3xl"
            >
              <img 
                src="/assets/philosophy.png" 
                alt="Our Philosophy"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            <div className="space-y-8 md:space-y-10 px-2 md:px-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-4 md:space-y-6"
              >
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">Our Philosophy</span>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold leading-[1.1] tracking-tight uppercase">
                  Crafted for Presence, <br className="hidden sm:block" />
                  Designed for Life.
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-xl tracking-wide">
                  We believe that true luxury is found in the details. Every piece in our collection is a testament to the enduring power of minimal design and exceptional craftsmanship.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Link href="/about" className="group inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:text-primary transition-colors py-2">
                  Discover Our Story
                  <div className="w-8 md:w-12 h-[1px] bg-foreground group-hover:bg-primary group-hover:w-16 md:group-hover:w-20 transition-all duration-500" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Showcase */}
      <section className="py-16 md:py-32 border-t border-border/50">
        <div className="section-container">
          {categoriesLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Loading Categories...</p>
            </div>
          ) : categoriesError ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4 text-destructive">
              <AlertCircle className="w-8 h-8" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Failed to load categories</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
              {categories.slice(0, 3).map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="relative group aspect-[3/4] overflow-hidden bg-secondary/20 rounded-2xl"
                >
                  <Link href={`/shop?category=${category.name}`} className="block w-full h-full">
                    <img 
                      src={category.imageUrl || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"} 
                      alt={category.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
                      <h3 className="text-white text-2xl md:text-3xl font-serif font-bold mb-3 md:mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 uppercase">
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-4 text-white text-[10px] font-bold uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        Explore Collection
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-32 bg-secondary/10">
        <div className="section-container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6 md:gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-3 md:space-y-4"
            >
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">The Selection</span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold tracking-tight uppercase">Curated For You</h2>
            </motion.div>
            <Link href="/shop" className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:text-primary transition-colors py-2">
              View All Products
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Loading Collection...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="relative h-[50vh] sm:h-[60vh] md:h-[80vh] w-full overflow-hidden flex items-center justify-center text-center">
        <img 
          src="/assets/shipping-bg.png" 
          alt="Promo Banner"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/60 z-10" />
        
        <div className="relative z-20 max-w-4xl px-6 space-y-8 md:space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="space-y-6 md:space-y-8"
          >
            <h2 className="text-3xl sm:text-4xl md:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] uppercase">
              Complimentary <br className="hidden sm:block" /> Global Shipping
            </h2>
            <p className="text-white/80 text-sm sm:text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed tracking-wide">
              On all orders above ৳10,000. Experience luxury delivered to your doorstep with our premium worldwide courier service.
            </p>
            <Link href="/shop" className="inline-block bg-white text-black px-8 md:px-12 py-4 md:py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all duration-500 active:scale-95">
              Shop Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-32 bg-background border-t border-border/50">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10 md:space-y-12">
          <div className="space-y-4 md:space-y-6">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">The Newsletter</span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold tracking-tight uppercase">Join The Club</h2>
            <p className="text-muted-foreground font-medium text-sm sm:text-base md:text-lg max-w-2xl mx-auto tracking-wide">Subscribe to receive updates on new collections, exclusive events, and seasonal offers.</p>
          </div>
          
          <form 
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-2xl mx-auto"
          >
            <input 
              type="email" 
              placeholder="EMAIL ADDRESS"
              required
              aria-label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubscribing}
              className="flex-grow bg-secondary/30 border border-border/50 px-6 py-4 md:py-5 text-[10px] font-bold tracking-widest focus:outline-none focus:border-primary transition-colors disabled:opacity-50 rounded-xl sm:rounded-none"
            />
            <button 
              type="submit"
              disabled={isSubscribing}
              className="bg-foreground text-background px-10 md:px-12 py-4 md:py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-primary transition-all duration-500 disabled:opacity-50 active:scale-95 rounded-xl sm:rounded-none"
            >
              {isSubscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
