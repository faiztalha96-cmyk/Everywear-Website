import { useState, useMemo } from "react";
import { useAuth } from "../../contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreVertical,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Calendar,
  CreditCard,
  AlertCircle,
  Loader2
} from "lucide-react";
import { getAllOrders, updateOrderStatus } from "../../lib/supabase-service";
import { downloadCSV } from "../../lib/export-utils";
import { Order } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { AdminErrorBoundary } from "../../components/admin/admin-error-boundary";
import { AdminLoading } from "../../components/admin/admin-loading";
import { AdminEmpty } from "../../components/admin/admin-empty";

function AdminOrdersContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Queries
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: getAllOrders
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: Order['status'] }) => updateOrderStatus(id, status),
    onMutate: () => {
      return toast.loading("Updating order status...");
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(`Order status updated to ${variables.status}`, { id: context });
      if (selectedOrder?.id === variables.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: variables.status, orderStatus: variables.status } : null);
      }
    },
    onError: (error, variables, context) => {
      toast.error("Failed to update status", { id: context });
    }
  });

  const isUpdating = updateStatusMutation.isPending;

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = (order.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${order.firstName || ""} ${order.lastName || ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const matchesDate = 
        dateRange === 'all' ||
        (dateRange === 'today' && orderDate.toDateString() === now.toDateString()) ||
        (dateRange === 'week' && (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000) ||
        (dateRange === 'month' && (now.getTime() - orderDate.getTime()) <= 30 * 24 * 60 * 60 * 1000);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, dateRange]);

  const handleExport = () => {
    const exportData = filteredOrders.map(o => ({
      'Order ID': o.id,
      Customer: `${o.firstName} ${o.lastName}`,
      Email: o.email,
      Phone: o.phone,
      Status: o.status,
      Total: o.totalPrice,
      'Payment Method': o.paymentMethod,
      'Created At': o.createdAt.toLocaleDateString()
    }));
    
    downloadCSV(exportData, 'everywear_orders');
    toast.success(`Exported ${exportData.length} orders`);
  };

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

  if (isLoading) return <AdminLoading variant="table" />;

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <ShoppingBag className="w-4 h-4" /> Order Management
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold uppercase tracking-tight">Orders</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            Manage customer purchases, track shipments, and update order statuses.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-2xl border border-border">
          <button 
            onClick={handleExport}
            className="px-8 py-3 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-background border border-border rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full sm:w-auto h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-background rounded-[3rem] border border-border overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <AdminEmpty 
            title="No orders found" 
            description={searchQuery || statusFilter !== 'all' ? "Try adjusting your search or filters" : "You haven't received any orders yet"}
            icon={Package}
          />
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-secondary/20 z-10">Order ID</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-10 py-8 sticky left-0 bg-background group-hover:bg-secondary/10 z-10">
                      <span className="text-xs font-bold font-mono">#{order.id?.slice(0, 8)}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1">
                        <p className="text-xs font-bold">{order.firstName} {order.lastName}</p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{order.email}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {order.createdAt?.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                        getStatusColor(order.status)
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-xs font-bold">৳{(order.totalPrice || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="p-3 bg-secondary/30 hover:bg-yellow-500/20 hover:text-yellow-600 border border-transparent hover:border-yellow-500/30 transition-all rounded-xl active:scale-95"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id!)}
                            className={cn(
                              "p-3 transition-all rounded-xl active:scale-95 border border-transparent",
                              activeMenu === order.id 
                                ? "bg-foreground text-background" 
                                : "bg-secondary/30 hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20"
                            )}
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {activeMenu === order.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-2xl shadow-2xl z-[50] overflow-hidden p-2"
                              >
                                <div className="px-4 py-3 border-b border-border mb-2">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Quick Status Update</p>
                                </div>
                                <div className="space-y-1">
                                  {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
                                    <button
                                      key={status}
                                      disabled={isUpdating}
                                      onClick={() => {
                                        handleStatusUpdate(order.id!, status);
                                        setActiveMenu(null);
                                      }}
                                      className={cn(
                                        "w-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-left rounded-xl transition-all flex items-center justify-between group/item",
                                        order.status === status 
                                          ? "bg-primary/10 text-primary" 
                                          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        {getStatusIcon(status)}
                                        {status}
                                      </div>
                                      {order.status === status && <CheckCircle2 className="w-3 h-3" />}
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-border">
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setActiveMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-left rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Full Details
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing {filteredOrders.length} of {orders.length} orders</p>
          <div className="flex items-center gap-2">
            <button className="w-12 h-12 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-[10px] font-black">1</button>
            <button className="w-12 h-12 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" disabled>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUpdating && setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-background rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-border flex justify-between items-center shrink-0">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">Order Details</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order #{selectedOrder.id?.slice(0, 8)}</p>
                </div>
                <button 
                  disabled={isUpdating}
                  onClick={() => setSelectedOrder(null)}
                  className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-10 overflow-y-auto no-scrollbar space-y-12">
                {/* Status Update & Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Status Update */}
                  <div className="lg:col-span-2 p-8 bg-secondary/10 rounded-[2rem] border border-border space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest">Update Order Status</p>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                        getStatusColor(selectedOrder.status)
                      )}>
                        Current: {selectedOrder.status}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(selectedOrder.id!, status as any)}
                          className={cn(
                            "h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                            selectedOrder.status === status 
                              ? "bg-foreground text-background border-foreground" 
                              : "bg-background text-muted-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {isUpdating && selectedOrder.status === status && <Loader2 className="w-3 h-3 animate-spin" />}
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-8 bg-secondary/10 rounded-[2rem] border border-border space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-widest">Customer Info</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-border">
                          <UserIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">ID: {selectedOrder.userId?.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-border">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-bold truncate">{selectedOrder.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-border">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-bold">{selectedOrder.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping & Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-secondary/10 rounded-[2rem] border border-border space-y-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Shipping Address</p>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground leading-relaxed">
                      {selectedOrder.address}<br/>
                      {selectedOrder.city}, {selectedOrder.postalCode}
                    </div>
                  </div>
                  <div className="p-8 bg-secondary/10 rounded-[2rem] border border-border space-y-6">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Payment Details</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="uppercase">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={cn(
                          "uppercase",
                          selectedOrder.paymentStatus === 'paid' ? "text-emerald-500" : "text-amber-500"
                        )}>{selectedOrder.paymentStatus || 'Unpaid'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Items ({selectedOrder.items?.length || 0})</p>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-6 p-6 bg-secondary/10 rounded-2xl border border-transparent hover:border-border transition-all">
                        <div className="w-20 h-24 bg-secondary/30 rounded-xl overflow-hidden shrink-0 border border-border/50">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-sm font-bold">৳{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            Size: {item.selectedSize || 'N/A'} / Color: {item.selectedColor || 'N/A'}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest">
                            ৳{(item.price || 0).toLocaleString()} × {item.quantity || 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-10 bg-secondary/20 rounded-[3rem] border border-border space-y-6">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Subtotal</span>
                    <span>৳{((selectedOrder.totalPrice || 0) - 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Shipping Fee</span>
                    <span>৳100</span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-serif font-bold uppercase tracking-tight">Total Revenue</span>
                    <span className="text-4xl font-serif font-bold">৳{(selectedOrder.totalPrice || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-10 border-t border-border flex justify-end shrink-0">
                <button 
                  disabled={isUpdating}
                  onClick={() => setSelectedOrder(null)}
                  className="px-12 py-4 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all disabled:opacity-50 active:scale-95 shadow-lg"
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

export default function AdminOrders() {
  return (
    <AdminErrorBoundary>
      <AdminOrdersContent />
    </AdminErrorBoundary>
  );
}
