import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Layers,
  ShoppingCart, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Palette, 
  LogOut, 
  Bell, 
  ExternalLink, 
  Menu, 
  X,
  ChevronRight,
  AlertCircle,
  Ticket
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/auth-context";
import { subscribeToNewOrders } from "../../lib/supabase-service";
import { Order } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { AdminErrorBoundary } from "./admin-error-boundary";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Promo Codes", href: "/admin/promo-codes", icon: Ticket },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Abandoned Carts", href: "/admin/abandoned-carts", icon: ShoppingBag },
  { name: "Payment Settings", href: "/admin/payment-settings", icon: CreditCard },
  { name: "Customization", href: "/admin/customization", icon: Palette },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, profile, isAdmin, loading: authLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Order[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const seenIdsRef = useRef<string[]>(JSON.parse(localStorage.getItem("admin-seen-orders") || "[]"));

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAdmin, user, authLoading, setLocation]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const unsubscribe = subscribeToNewOrders((order) => {
      if (order.id && !seenIdsRef.current.includes(order.id)) {
        setNotifications(prev => [order, ...prev]);
        toast.custom((t) => (
          <div className={cn(
            "bg-foreground text-background p-4 flex flex-col gap-2 shadow-2xl transition-all",
            t.visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}>
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold uppercase tracking-widest">New Order Received</p>
              <button onClick={() => toast.dismiss(t.id)}><X className="w-3 h-3" /></button>
            </div>
            <p className="text-sm font-serif font-bold italic">Order #EVW-{order.id?.slice(0, 8).toUpperCase()}</p>
            <p className="text-[10px] font-light">Customer: {order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
          </div>
        ), { duration: 5000 });
      }
    });

    return () => unsubscribe();
  }, [isAdmin, authLoading]);

  useEffect(() => {
    localStorage.setItem("admin-seen-orders", JSON.stringify(seenIdsRef.current));
  }, [notifications]);

  const markAllRead = () => {
    const newIds = notifications.map(n => n.id!).filter(id => !seenIdsRef.current.includes(id));
    seenIdsRef.current = [...seenIdsRef.current, ...newIds];
    setNotifications([]);
    setIsNotificationsOpen(false);
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const currentPageTitle = NAV_ITEMS.find(item => item.href === location)?.name || "Admin Panel";

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-secondary/30">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Loading Admin Panel</p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <AdminErrorBoundary>
      <div className="min-h-screen bg-secondary/30 flex overflow-x-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-[280px] bg-gray-950 text-white sticky top-0 h-screen shrink-0">
          <div className="p-8 space-y-1">
            <span className="text-2xl font-black tracking-[0.25em] uppercase font-serif text-white block drop-shadow-sm">
              EVERYWEAR
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Admin Panel</p>
          </div>

          <nav className="flex-grow px-4 py-8 space-y-2 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all rounded-lg",
                  location === item.href 
                    ? "bg-white/10 text-white border-l-2 border-primary" 
                    : "text-white/60 hover:bg-yellow-500/10 hover:text-yellow-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </div>
                {location === item.href && <ChevronRight className="w-3 h-3" />}
              </Link>
            ))}
          </nav>

          <div className="p-6 border-t border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 flex items-center justify-center font-serif font-bold text-primary rounded-lg">
                {profile?.name?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs font-bold truncate">{profile?.name || "Admin"}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all rounded-lg active:scale-95"
              aria-label="Logout"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col min-w-0">
          {/* Header */}
          <header className="h-20 bg-background border-b border-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 hover:bg-yellow-500/10 hover:text-yellow-600 transition-colors rounded-lg active:scale-90 shrink-0"
                aria-label="Open mobile menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg md:text-xl font-serif font-bold uppercase tracking-widest truncate">{currentPageTitle}</h2>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <Link href="/" target="_blank" className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-yellow-500 transition-colors">
                View Store
                <ExternalLink className="w-3 h-3" />
              </Link>

              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2.5 hover:bg-yellow-500/10 hover:text-yellow-600 transition-colors relative rounded-lg active:scale-90"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-background border border-border shadow-2xl z-50 overflow-hidden rounded-2xl"
                      >
                        <div className="p-4 border-b border-border flex justify-between items-center">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">Notifications</h3>
                          {notifications.length > 0 && (
                            <button onClick={markAllRead} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                          {notifications.length > 0 ? (
                            notifications.map((order) => (
                              <div key={order.id} className="p-4 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                                <p className="text-xs font-bold">New Order #EVW-{order.id?.slice(0, 8).toUpperCase()}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Customer: {order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                                <p className="text-[10px] text-primary font-bold mt-2 uppercase tracking-widest">Pending Confirmation</p>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center space-y-2">
                              <Bell className="w-8 h-8 text-muted-foreground mx-auto opacity-20" />
                              <p className="text-xs text-muted-foreground">No new notifications</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 md:p-8 lg:p-10">
            {children}
          </main>
        </div>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-[100] w-[85%] max-w-xs bg-gray-950 text-white flex flex-col lg:hidden shadow-2xl"
              >
                <div className="p-8 flex justify-between items-center border-b border-white/5">
                  <div className="space-y-1">
                    <span className="text-2xl font-black tracking-[0.25em] uppercase font-serif text-white block drop-shadow-sm">
                      EVERYWEAR
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Admin Panel</p>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-2.5 hover:bg-white/5 transition-colors rounded-lg active:scale-90"
                    aria-label="Close mobile menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav className="flex-grow px-4 py-8 space-y-1 overflow-y-auto no-scrollbar">
                  {NAV_ITEMS.map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4 text-xs font-bold uppercase tracking-widest transition-all rounded-xl",
                        location === item.href 
                          ? "bg-white/10 text-white border-l-2 border-primary" 
                          : "text-white/60 hover:bg-yellow-500/10 hover:text-yellow-400"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="p-8 border-t border-white/10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 flex items-center justify-center font-serif font-bold text-primary rounded-xl">
                      {profile?.name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold truncate">{profile?.name || "Admin"}</p>
                      <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-2 py-4 border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-yellow-500/10 hover:text-yellow-400 transition-all active:scale-95"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AdminErrorBoundary>
  );
}
