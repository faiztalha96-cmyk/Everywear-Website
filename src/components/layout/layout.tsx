import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Search, 
  Menu, 
  X, 
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../../contexts/cart-context";
import { useWishlist } from "../../contexts/wishlist-context";
import { useTheme } from "../../contexts/theme-context";
import { useAuth } from "../../contexts/auth-context";
import { cn } from "@/utils/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // SEO & Page Title
  useEffect(() => {
    const formatPageTitle = (path: string) => {
      if (path === "/") return "Premium Fashion Destination";
      const parts = path.substring(1).split("/");
      return parts
        .map(p => p.charAt(0).toUpperCase() + p.substring(1))
        .join(" | ");
    };

    const pageTitle = formatPageTitle(location);
    const fullTitle = `EVERYWEAR | ${pageTitle}`;
    document.title = fullTitle;
    
    // Update Meta Tags if they exist
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);
    
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);
  }, [location]);

  // Scroll Shadow Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      
      // Auto-close mobile menu on scroll > 50px
      if (window.scrollY > 50 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileMenuOpen]);

  // Close mobile menu on outside tap
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(target) &&
        (!toggleBtnRef.current || !toggleBtnRef.current.contains(target))
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileMenuOpen]);
  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    ...(user ? [{ name: "Orders", href: "/orders" }] : []),
    ...(isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground font-bold">
        Skip to main content
      </a>
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ease-in-out border-b",
          "bg-background text-foreground",
          "h-14 md:h-16 lg:h-18 xl:h-20 2xl:h-24",
          scrolled 
            ? "shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-border/50" 
            : "border-transparent",
          theme === "light" ? "border-gray-200" : "border-white/10"
        )}
      >
        <div className={cn(
          "section-container h-full grid items-center grid-cols-[1fr_auto_1fr]",
          "px-4 md:px-8 xl:px-12 2xl:px-16", // Specific navbar padding override
          "py-3 md:py-4 xl:py-5 2xl:py-6"
        )}>
          {/* Left: Mobile Menu Toggle & Desktop Nav */}
          <div className="flex items-center gap-2 md:gap-4 h-full">
            <button 
              ref={toggleBtnRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-foreground hover:text-primary transition-colors duration-200"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-dropdown"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isMobileMenuOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.div>
              </AnimatePresence>
            </button>
            
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-8 h-full">
              {navLinks.map(link => {
                const isActive = location === link.href;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "uppercase transition-colors duration-200 relative",
                      "text-xs xl:text-sm 2xl:text-base",
                      "tracking-widest",
                      "px-1 py-1",
                      isActive 
                        ? "text-primary font-semibold" 
                        : "text-muted-foreground hover:text-yellow-400 font-bold"
                    )}
                  >
                    {link.name}
                    {isActive && (
                      <motion.span 
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary mx-auto"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Logo — grid auto column, truly centered */}
          <Link href="/" className="flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95">
            <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black tracking-widest sm:tracking-[0.25em] uppercase font-serif text-foreground drop-shadow-sm whitespace-nowrap">
              EVERYWEAR
            </span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-3 h-full">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center justify-center p-2 xl:p-2.5 2xl:p-3 text-muted-foreground hover:text-yellow-400 transition-colors duration-200"
              aria-label={isSearchOpen ? "Close search" : "Open search"}
              aria-expanded={isSearchOpen}
              aria-controls="search-menu-dropdown"
            >
              {isSearchOpen ? (
                <X className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
              ) : (
                <Search className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
              )}
            </button>

            <button 
              onClick={toggleTheme}
              className="hidden sm:flex p-2 xl:p-2.5 2xl:p-3 items-center justify-center text-muted-foreground hover:text-yellow-400 transition-all duration-300 active:scale-90 overflow-hidden"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ y: 20, opacity: 0, rotate: -45 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -20, opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === "light" ? (
                    <Moon className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
                  ) : (
                    <Sun className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
            
            <Link href="/wishlist" className="relative p-2 xl:p-2.5 2xl:p-3 flex items-center justify-center text-muted-foreground hover:text-yellow-400 transition-all duration-300 active:scale-90" aria-label="Wishlist">
              <Heart className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
              <AnimatePresence>
                {wishlist.length > 0 && (
                  <motion.span 
                    key={wishlist.length}
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    exit={{ scale: 0 }}
                    className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-sm"
                    style={{ 
                      width: 'clamp(1rem, 2vw, 1.25rem)', 
                      height: 'clamp(1rem, 2vw, 1.25rem)',
                      fontSize: 'clamp(9px, 1.5vw, 12px)'
                    }}
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link href="/cart" className="relative p-2 xl:p-2.5 2xl:p-3 flex items-center justify-center text-muted-foreground hover:text-yellow-400 transition-all duration-300 active:scale-90" aria-label="Cart">
              <ShoppingBag className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-sm"
                    style={{ 
                      width: 'clamp(1rem, 2vw, 1.25rem)', 
                      height: 'clamp(1rem, 2vw, 1.25rem)',
                      fontSize: 'clamp(9px, 1.5vw, 12px)'
                    }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link href={user ? "/settings" : "/login"} className="hidden sm:flex p-2 xl:p-2.5 2xl:p-3 items-center justify-center text-muted-foreground hover:text-yellow-400 transition-all duration-300 active:scale-90" aria-label="Account">
              <User className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
            </Link>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                id="mobile-menu-dropdown"
                ref={mobileMenuRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={cn(
                  "absolute top-full left-0 w-full bg-background border-b overflow-hidden lg:hidden z-50 shadow-xl",
                  theme === "light" ? "border-gray-200" : "border-white/10"
                )}
              >
                <nav className="flex flex-col py-4">
                  {navLinks.map((link) => {
                    const isActive = location === link.href;
                    return (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "font-bold uppercase tracking-widest flex items-center justify-between transition-colors",
                          "text-base sm:text-base md:text-lg",
                          "px-4 py-4 sm:px-6 sm:py-4 md:px-8 md:py-5",
                          isActive ? "text-primary bg-secondary/50" : "text-muted-foreground hover:text-primary hover:bg-secondary/30"
                        )}
                      >
                        {link.name}
                        {isActive && <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full" />}
                      </Link>
                    );
                  })}
                  
                  {/* Mobile Extra Actions */}
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <button 
                      onClick={() => {
                        toggleTheme();
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full font-bold uppercase tracking-widest flex items-center gap-3 text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors",
                        "text-base sm:text-base md:text-lg",
                        "px-4 py-4 sm:px-6 sm:py-4 md:px-8 md:py-5"
                      )}
                    >
                      {theme === "light" ? <Moon className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" /> : <Sun className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />}
                      {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </button>
                    
                    <Link 
                      href={user ? "/settings" : "/login"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full font-bold uppercase tracking-widest flex items-center gap-3 text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-colors",
                        "text-base sm:text-base md:text-lg",
                        "px-4 py-4 sm:px-6 sm:py-4 md:px-8 md:py-5"
                      )}
                    >
                      <User className="w-5 h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
                      {user ? "My Account" : "Sign In"}
                    </Link>
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Bar Dropdown — Full Width */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                id="search-menu-dropdown"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={cn(
                  "absolute top-full left-0 w-full bg-background border-b overflow-hidden z-50 shadow-xl",
                  theme === "light" ? "border-gray-200" : "border-white/10"
                )}
              >
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      setLocation(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  className="flex items-center gap-3 px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 py-3 md:py-4"
                >
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                  <input 
                    autoFocus
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-grow bg-transparent text-sm md:text-base font-medium focus:outline-none placeholder:text-muted-foreground/60"
                  />
                  <button 
                    type="button" 
                    onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Main Content */}
      <main id="main-content" className={cn("flex-grow outline-none", location !== "/" && "pt-14 md:pt-16 lg:pt-18 xl:pt-20 2xl:pt-24")}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary/20 border-t border-border mt-14 md:mt-16 lg:mt-18 xl:mt-20 2xl:mt-24">
        <div className="section-container py-12 md:py-16 xl:py-20 2xl:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            <div className="space-y-6 md:space-y-8">
              <Link href="/" className="inline-block transition-opacity hover:opacity-80">
                <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-[0.2em] uppercase font-serif text-foreground">
                  EVERYWEAR
                </span>
              </Link>
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs font-medium">
                Premium fashion destination for the modern individual. Quality craftsmanship meets contemporary design.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Shop</h4>
              <ul className="space-y-4">
                <li><Link href="/shop" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
                <li><Link href="/shop?category=new" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">New Arrivals</Link></li>
                <li><Link href="/shop?category=featured" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Featured</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Support</h4>
              <ul className="space-y-4">
                <li><Link href="/shipping" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Shipping Policy</Link></li>
                <li><Link href="/returns" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Returns & Exchanges</Link></li>
                <li><Link href="/faq" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">FAQs</Link></li>
                <li><Link href="/contact" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Connect</h4>
              <ul className="space-y-4">
                <li><a href="https://instagram.com/everywear" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">Instagram</a></li>
                <li><a href="https://facebook.com/everywear" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">Facebook</a></li>
                <li><a href="https://twitter.com/everywear" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">Twitter</a></li>
                <li><a href="https://pinterest.com/everywear" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">Pinterest</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
              © 2026 EVERYWEAR. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              <Link href="/privacy" className="text-[10px] text-muted-foreground hover:text-primary font-bold uppercase tracking-[0.2em] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-[10px] text-muted-foreground hover:text-primary font-bold uppercase tracking-[0.2em] transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
