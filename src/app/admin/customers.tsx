import { useState, useMemo } from "react";
import { useAuth } from "../../contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Filter, 
  Download, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowRight,
  ShieldCheck,
  Clock,
  XCircle
} from "lucide-react";
import { getAllUsers } from "../../lib/supabase-service";
import { downloadCSV } from "../../lib/export-utils";
import { UserProfile } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { AdminErrorBoundary } from "../../components/admin/admin-error-boundary";
import { AdminLoading } from "../../components/admin/admin-loading";
import { AdminEmpty } from "../../components/admin/admin-empty";

function AdminCustomersContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);

  // Queries
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: getAllUsers
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const handleExport = () => {
    const exportData = filteredCustomers.map(c => ({
      ID: c.id,
      Name: c.name || 'Anonymous',
      Email: c.email,
      Phone: c.phone || 'N/A',
      Address: c.address || 'N/A',
      'Order Count': c.orderCount || 0,
      'Created At': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'
    }));
    
    downloadCSV(exportData, 'everywear_customers');
    toast.success(`Exported ${exportData.length} customers`);
  };

  if (isLoading) return <AdminLoading variant="table" />;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-serif font-bold uppercase tracking-tight">Customers</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manage your customer relationships</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none h-12 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-background border border-border rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-all"
            aria-label="Search customers"
          />
        </div>
        <button className="h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-background rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
        {filteredCustomers.length === 0 ? (
          <AdminEmpty 
            title="No customers found" 
            description={searchQuery ? "Try adjusting your search or filters" : "No customers have registered yet"}
            icon={User}
          />
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-secondary/20 z-10">Customer</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joined</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orders</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-8 py-6 sticky left-0 bg-background group-hover:bg-secondary/10 z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-[10px] font-bold">
                          {(customer.name?.[0] || customer.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold truncate max-w-[200px]">{customer.name || "Anonymous"}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">#{customer.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-medium text-muted-foreground">{customer.email}</span>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold text-muted-foreground">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3 h-3 text-primary" />
                        <span className="text-xs font-bold">{customer.orderCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-2.5 hover:bg-yellow-500/20 hover:text-yellow-600 transition-all rounded-lg active:scale-90"
                          aria-label="View customer details"
                        >
                          <ArrowRight className="w-4 h-4" />
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
        <div className="p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing {filteredCustomers.length} of {customers.length} customers</p>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" disabled aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-[10px] font-black" aria-label="Page 1">1</button>
            <button className="w-10 h-10 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" disabled aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-2xl bg-background rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-xl font-bold">
                  {(selectedCustomer.name?.[0] || selectedCustomer.email?.[0] || "?").toUpperCase()}
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-serif font-bold uppercase tracking-tight">{selectedCustomer.name || "Anonymous"}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Customer since {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 md:p-10 max-h-[70vh] overflow-y-auto no-scrollbar space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Contact Info</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-primary" />
                      <p className="text-xs font-bold">{selectedCustomer.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-primary" />
                      <p className="text-xs font-bold">{selectedCustomer.phone || "No phone provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Default Address</h3>
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest">
                      {selectedCustomer.address || "No address provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Customer Stats</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-6 bg-secondary/20 rounded-2xl space-y-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <p className="text-lg font-serif font-bold">{selectedCustomer.orderCount || 0}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total Orders</p>
                  </div>
                  <div className="p-6 bg-secondary/20 rounded-2xl space-y-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <p className="text-lg font-serif font-bold">৳--</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total Spent</p>
                  </div>
                  <div className="p-6 bg-secondary/20 rounded-2xl space-y-2 col-span-2 sm:col-span-1">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <p className="text-lg font-serif font-bold">{selectedCustomer.isAdmin ? "Admin" : "Customer"}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Account Type</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10 border-t border-border flex justify-end gap-4">
              <button onClick={() => setSelectedCustomer(null)} className="px-8 py-4 border-2 border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all active:scale-95">Close</button>
              <button 
                onClick={() => toast.success("Redirecting to full profile...")}
                className="px-10 py-4 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all active:scale-95"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomers() {
  return (
    <AdminErrorBoundary>
      <AdminCustomersContent />
    </AdminErrorBoundary>
  );
}
