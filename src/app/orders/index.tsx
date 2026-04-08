import { useState, useEffect } from "react";
import { 
  Package, 
  ChevronRight, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingBag
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "../../contexts/auth-context";
import { getUserOrders } from "../../lib/supabase-service";
import { Order } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("Please sign in to view your orders");
        setLocation("/login");
      } else {
        fetchOrders();
      }
    }
  }, [user, authLoading, setLocation]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getUserOrders(user!.id);
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to load your orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.items?.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'confirmed': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case 'confirmed': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'shipped': return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case 'delivered': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case 'cancelled': return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 space-y-12 md:space-y-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <ShoppingBag className="w-4 h-4" /> My Account
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tight">Orders</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            Track your recent purchases and manage your order history.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search by Order ID or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-secondary/20 border border-border rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <button className="h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Retrieving your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-32 text-center space-y-8 bg-secondary/10 rounded-[3rem] border border-dashed border-border">
            <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-10 h-10 text-muted-foreground opacity-30" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-serif font-bold italic">No orders found</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Ready to start your collection?</p>
            </div>
            <button 
              onClick={() => setLocation("/shop")}
              className="h-14 px-10 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all inline-flex items-center gap-2"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={order.id}
                className="group bg-background rounded-[2.5rem] border border-border overflow-hidden hover:border-primary/30 transition-all"
              >
                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                  {/* Order Info */}
                  <div className="flex-grow space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-secondary px-4 py-1.5 rounded-full">
                        #{order.id?.slice(0, 8)}
                      </span>
                      <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                        getStatusColor(order.status)
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-bold">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {order.createdAt?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="w-4 h-4" />
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Order Preview Images */}
                  <div className="flex -space-x-4 overflow-hidden">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-16 h-20 rounded-xl border-2 border-background overflow-hidden bg-secondary shadow-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div className="w-16 h-20 rounded-xl border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                        +{(order.items?.length || 0) - 3}
                      </div>
                    )}
                  </div>

                  {/* Order Total & Action */}
                  <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-serif font-bold">
                        ৳{order.totalPrice?.toLocaleString()}
                        {order.discountAmount && order.discountAmount > 0 && (
                          <span className="block text-[9px] text-primary font-bold line-through opacity-50">
                            ৳{(order.totalPrice! + order.discountAmount).toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="w-full md:w-auto h-12 px-8 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2"
                    >
                      View Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-background rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-12 border-b border-border flex justify-between items-center shrink-0">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">Order Details</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order #{selectedOrder.id?.slice(0, 8)}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 md:p-12 overflow-y-auto no-scrollbar space-y-12">
                {/* Status Timeline Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4 p-6 bg-secondary/20 rounded-[2rem] border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Shipping Address</p>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground leading-relaxed">
                      {selectedOrder.firstName} {selectedOrder.lastName}<br/>
                      {selectedOrder.address}<br/>
                      {selectedOrder.city}, {selectedOrder.postalCode}<br/>
                      {selectedOrder.phone}
                    </div>
                  </div>

                  <div className="space-y-4 p-6 bg-secondary/20 rounded-[2rem] border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Payment Info</p>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground leading-relaxed">
                      Method: {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : selectedOrder.paymentMethod.toUpperCase()}<br/>
                      Status: <span className="uppercase">{selectedOrder.paymentStatus || 'Pending'}</span><br/>
                      {selectedOrder.couponCode && (
                        <>Coupon: <span className="text-primary">{selectedOrder.couponCode}</span><br/></>
                      )}
                      Total: ৳{selectedOrder.totalPrice?.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-4 p-6 bg-secondary/20 rounded-[2rem] border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Order Status</p>
                    </div>
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                      getStatusColor(selectedOrder.status)
                    )}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </div>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                      Last updated: {selectedOrder.createdAt?.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Items</p>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-6 p-4 hover:bg-secondary/10 rounded-2xl transition-colors border border-transparent hover:border-border">
                        <div className="w-20 h-24 bg-secondary/30 rounded-xl overflow-hidden shrink-0 border border-border/50">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-grow space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-sm font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            Size: {item.selectedSize} / Color: {item.selectedColor}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest">
                            ৳{item.price.toLocaleString()} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-8 bg-secondary/10 rounded-[2rem] border border-border space-y-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Subtotal</span>
                    <span>৳{(selectedOrder.totalPrice! - 100 + (selectedOrder.discountAmount || 0)).toLocaleString()}</span>
                  </div>
                  {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                      <span>Discount ({selectedOrder.couponCode})</span>
                      <span>-৳{selectedOrder.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Shipping</span>
                    <span>৳100</span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-serif font-bold uppercase tracking-tight">Total Paid</span>
                    <span className="text-3xl font-serif font-bold">৳{selectedOrder.totalPrice?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 md:p-12 border-t border-border flex justify-end shrink-0">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="px-10 py-4 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
