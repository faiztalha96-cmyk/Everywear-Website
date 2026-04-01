import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X, Loader2, AlertCircle, ChevronDown, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../../components/shop/product-card";
import { getProducts, getCategories } from "../../lib/supabase-service";
import { Product } from "../../types";
import { cn } from "@/utils/utils";

export default function Shop() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const initialParams = new URLSearchParams(searchString);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(initialParams.get("category") || "All");
  const [sortBy, setSortBy] = useState("Featured");
  const [filter, setFilter] = useState(initialParams.get("filter") || "");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const { data: categoriesData = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories
  });

  const categories = useMemo(() => ["All", ...categoriesData.map(c => c.name)], [categoriesData]);

  const { 
    data: productsData, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ["products", currentPage, activeCategory, searchQuery, sortBy, filter],
    queryFn: () => getProducts(currentPage, pageSize, {
      categoryId: activeCategory === "All" ? undefined : categoriesData.find(c => c.name === activeCategory)?.id,
      search: searchQuery,
      sort: sortBy === "Price: Low to High" ? "price-low" : 
            sortBy === "Price: High to Low" ? "price-high" : 
            sortBy === "Newest" ? "newest" : "trending",
    })
  });

  useEffect(() => {
    if (productsData) {
      setProducts(productsData.data);
      setTotalCount(productsData.count);
      setTotalPages(productsData.totalPages);
    }
  }, [productsData]);

  // Handle URL sync robustly using useSearch
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    setSearchQuery(params.get("q") || "");
    setActiveCategory(params.get("category") || "All");
    setFilter(params.get("filter") || "");
  }, [searchString]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeCategory !== "All") {
      result = result.filter(p => p.category_id === activeCategory || p.category === activeCategory);
    }

    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filter === "new") {
      result = result.filter(p => p.isNew);
    } else if (filter === "sale") {
      result = result.filter(p => p.salePrice && p.salePrice < p.price);
    }

    switch (sortBy) {
      case "Price: Low to High":
        result.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        break;
      case "Price: High to Low":
        result.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        break;
      case "Newest":
        result.sort((a, b) => (a.isNew ? -1 : 1));
        break;
      default:
        result.sort((a, b) => (a.isFeatured ? -1 : 1));
    }

    return result;
  }, [products, activeCategory, searchQuery, sortBy, filter]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="section-container py-8 md:py-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 md:mb-16">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight uppercase">Shop</h1>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Explore our collection</p>
              {(activeCategory !== "All" || searchQuery || filter) && (
                <button 
                  onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                    setFilter("");
                    setLocation('/shop');
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-foreground transition-colors flex items-center gap-1.5 py-1"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsFilterDrawerOpen(true)}
              className="lg:hidden flex-1 flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <div className="relative flex-1 md:w-64">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-secondary/50 hover:bg-secondary px-6 py-4 pr-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                aria-label="Sort products"
              >
                <option value="Featured">Featured</option>
                <option value="Newest">Newest</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block space-y-12 sticky top-32 h-fit">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80">Search</h3>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Search products..."
                  aria-label="Search products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary/30 border border-border/50 px-12 py-4 text-xs font-medium rounded-xl focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80">Categories</h3>
              <div className="flex flex-col gap-3">
                {categoriesLoading ? (
                  <div className="flex items-center gap-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Loading...</span>
                  </div>
                ) : categoriesError ? (
                  <div className="flex items-center gap-3 py-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Error loading</span>
                  </div>
                ) : (
                  categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={cn(
                        "text-left text-sm py-2 px-4 rounded-lg transition-all duration-300",
                        activeCategory === category 
                          ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {category}
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            {productsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Curating collection...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-32 space-y-6 bg-red-500/5 rounded-3xl border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <p className="text-sm font-medium text-red-600">Failed to load products. Please try again.</p>
                <button onClick={() => refetchProducts()} className="bg-foreground text-background px-8 py-4 text-[10px] font-bold uppercase tracking-widest rounded-xl">Retry</button>
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-16">
                <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-16">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/50">
                    <button 
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="w-12 h-12 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" 
                      aria-label="Previous page"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button 
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                            currentPage === page 
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                              : "border border-border hover:bg-secondary"
                          )}
                          aria-label={`Page ${page}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className="w-12 h-12 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" 
                      aria-label="Next page"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-32 space-y-6 bg-secondary/10 rounded-3xl border border-dashed border-border/50">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-bold uppercase">No items found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
                </div>
                <button 
                  onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                    setFilter("");
                    setLocation('/shop');
                  }}
                  className="bg-foreground text-background px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all rounded-xl"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsFilterDrawerOpen(false)} 
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative mt-auto w-full bg-background rounded-t-[2.5rem] p-8 flex flex-col shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-border/50 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-serif font-bold uppercase tracking-tight">Filters</h2>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)} 
                  className="p-3 hover:bg-secondary rounded-full transition-colors active:scale-90"
                  aria-label="Close filters"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-10 pb-10">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-secondary/50 px-12 py-5 text-sm font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80">Categories</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={cn(
                          "text-center text-xs font-bold uppercase tracking-widest py-4 px-4 rounded-xl transition-all duration-300",
                          activeCategory === category 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full bg-foreground text-background py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-transform"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
