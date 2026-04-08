import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/auth-context";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Mail, 
  Trash2, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  User as UserIcon,
  ShoppingBag,
  ArrowRight,
  XCircle,
  Package
} from "lucide-react";
import { getAllAbandonedCarts, deleteAbandonedCart } from "../../lib/supabase-service";
import { AbandonedCart } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { AdminErrorBoundary } from "../../components/admin/admin-error-boundary";
import { AdminLoading } from "../../components/admin/admin-loading";
import { AdminEmpty } from "../../components/admin/admin-empty";

function AdminAbandonedCartsContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  const { user, session } = useAuth();

  const { data: carts = [], isLoading: loading } = useQuery({
    queryKey: ['admin', 'abandoned-carts'],
    queryFn: async () => {
      try {
        return await getAllAbandonedCarts();
      } catch (err) {
        console.error("Failed to fetch abandoned carts:", err);
        toast.error("Failed to load abandoned carts. Your database might need the abandoned_carts table.");
        return [];
      }
    },
    enabled: !!user && !!session,
  });

  const removeMutation = useMutation({
    mutationFn: deleteAbandonedCart,
    onSuccess: (_, id) => {
      queryClient.setQueryData(['admin', 'abandoned-carts'], (old: AbandonedCart[] | undefined) => {
        if (!old) return [];
        return old.filter(c => c.id !== id);
      });
      if (selectedCart?.id === id) setSelectedCart(null);
      toast.success("Cart removed successfully");
    },
    onError: (err) => {
      console.error("Failed to delete cart:", err);
      toast.error("Failed to delete cart");
    }
  });

  const handleRemove = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this abandoned cart?")) return;
    removeMutation.mutate(id);
  };

  const handleSendRecovery = async (cart: AbandonedCart) => {
    const toastId = toast.loading(`Sending recovery email to ${cart.userEmail}...`);
    // Mocking the email delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Recovery email sent to ${cart.userEmail}!`, { id: toastId });
  };

  const filteredCarts = useMemo(() => {
    return carts.filter(cart => 
      (cart.userEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cart.id || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [carts, searchQuery]);

  const getTimeSince = (date: Date | string) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (loading) return <AdminLoading variant="table" />;

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <ShoppingCart className="w-4 h-4" /> Recovery Center
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold uppercase tracking-tight">Abandoned Carts</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            Track and recover potential lost sales from incomplete checkouts.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-2xl border border-border">
          <div className="px-6 py-3 bg-background rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm">
            {carts.length} Total Carts
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search by customer email or cart ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-background border border-border rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button className="h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Carts Table */}
      <div className="bg-background rounded-[3rem] border border-border overflow-hidden shadow-sm">
        {filteredCarts.length === 0 ? (
          <AdminEmpty 
            title="No abandoned carts" 
            description={searchQuery ? "Try adjusting your search or filters" : "All customers are completing their orders!"}
            icon={ShoppingCart}
          />
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-secondary/20 z-10">Customer</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Items</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Activity</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCarts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-10 py-8 sticky left-0 bg-background group-hover:bg-secondary/10 z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/30 rounded-xl flex items-center justify-center border border-border/50">
                          <UserIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold">{cart.userEmail || "Guest Customer"}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">ID: {cart.id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {(cart.products || []).slice(0, 3).map((item, idx) => (
                            <div key={idx} className="w-10 h-12 rounded-lg border-2 border-background overflow-hidden bg-secondary">
                              <img src={item.image || item.product?.images?.[0]} alt="Product" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          ))}
                        </div>
                        <span className="text-xs font-bold">{(cart.products || []).length} Items</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {getTimeSince(cart.lastUpdated)}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-500 border-amber-500/20">
                        Abandoned
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedCart(cart)}
                          className="p-3 hover:bg-yellow-500/20 hover:text-yellow-600 transition-all rounded-xl active:scale-95"
                          title="View Details"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSendRecovery(cart)}
                          className="p-3 hover:bg-blue-500/10 hover:text-blue-500 transition-all rounded-xl active:scale-95" 
                          title="Send Recovery Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemove(cart.id!)}
                          className="p-3 hover:bg-red-500/10 hover:text-red-500 transition-all rounded-xl active:scale-95" 
                          title="Delete Cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing {filteredCarts.length} of {carts.length} abandoned carts</p>
          <div className="flex items-center gap-2">
            <button className="w-12 h-12 border border-border rounded-xl flex items-center justify-center hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all disabled:opacity-30 active:scale-95" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-[10px] font-black">1</button>
            <button className="w-12 h-12 border border-border rounded-xl flex items-center justify-center hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all disabled:opacity-30 active:scale-95" disabled>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cart Details Modal */}
      <AnimatePresence>
        {selectedCart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCart(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-background rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-10 border-b border-border flex justify-between items-center shrink-0">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">Cart Details</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Abandoned {getTimeSince(selectedCart.lastUpdated)}</p>
                </div>
                <button 
                  onClick={() => setSelectedCart(null)}
                  className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center hover:bg-yellow-500/20 hover:text-yellow-600 transition-colors active:scale-90"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto no-scrollbar space-y-10">
                {/* Customer Info */}
                <div className="p-8 bg-secondary/10 rounded-[2rem] border border-border space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{selectedCart.userEmail || "Guest Customer"}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer Email</p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Items in Cart ({(selectedCart.products || []).length})</p>
                  <div className="space-y-4">
                    {(selectedCart.products || []).map((item, idx) => (
                      <div key={idx} className="flex gap-6 p-4 bg-secondary/10 rounded-2xl border border-transparent hover:border-border transition-all">
                        <div className="w-20 h-24 bg-secondary/30 rounded-xl overflow-hidden shrink-0 border border-border/50">
                          <img src={item.image || item.product?.images?.[0]} alt="Product" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-grow space-y-2">
                          <p className="text-sm font-bold">{item.name || item.product?.name || "Product"}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            Size: {item.selectedSize || item.size || 'N/A'} / Color: {item.selectedColor || item.color || 'N/A'}
                          </p>
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-bold">৳{(item.price || item.product?.price || 0).toLocaleString()} × {item.quantity || 1}</p>
                            <p className="text-sm font-bold text-primary">৳{((item.price || item.product?.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-10 border-t border-border flex flex-col sm:flex-row gap-4 shrink-0">
                <button 
                  onClick={() => handleSendRecovery(selectedCart)}
                  className="flex-1 h-16 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Mail className="w-4 h-4" /> Send Recovery Email
                </button>
                <button 
                  onClick={() => setSelectedCart(null)}
                  className="flex-1 h-16 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminAbandonedCarts() {
  return (
    <AdminErrorBoundary>
      <AdminAbandonedCartsContent />
    </AdminErrorBoundary>
  );
}
