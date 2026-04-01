import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Download,
  ChevronLeft,
  ChevronRight,
  Ticket,
  XCircle,
  Loader2,
  Calendar,
  Layers,
  UserCheck,
  CheckCircle2
} from "lucide-react";
import { 
  getCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon 
} from "../../services/couponService";
import { downloadCSV } from "../../lib/export-utils";
import { Coupon } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { AdminErrorBoundary } from "../../components/admin/admin-error-boundary";
import { AdminLoading } from "../../components/admin/admin-loading";
import { AdminEmpty } from "../../components/admin/admin-empty";
import { ConfirmationModal } from "../../components/admin/confirmation-modal";

function AdminPromoCodesContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Queries
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: getCoupons
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success("Promo code created successfully");
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Coupon> }) => updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success("Promo code updated successfully");
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success("Promo code deleted successfully");
      setIsDeleteModalOpen(false);
    }
  });

  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: "",
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    expiryDate: "",
    isActive: true,
    isStackable: false,
    usageLimitPerUser: 1
  });

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : "",
        isActive: coupon.isActive,
        isStackable: coupon.isStackable,
        usageLimitPerUser: coupon.usageLimitPerUser
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 1000,
        expiryDate: "",
        isActive: true,
        isStackable: false,
        usageLimitPerUser: 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.discountValue! <= 0) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSaving(true);
    try {
      if (editingCoupon) {
        updateMutation.mutate({ id: editingCoupon.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save promo code");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    deleteMutation.mutate(couponToDelete);
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && c.isActive) || 
        (statusFilter === 'inactive' && !c.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchQuery, statusFilter]);

  const handleExport = () => {
    const exportData = filteredCoupons.map(c => ({
      Code: c.code,
      Type: c.discountType,
      Value: c.discountValue,
      'Min Order': c.minOrderAmount,
      Stackable: c.isStackable ? 'Yes' : 'No',
      'Usage Limit': c.usageLimitPerUser,
      Expiry: c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never',
      Status: c.isActive ? 'Active' : 'Inactive'
    }));
    downloadCSV(exportData, 'everywear_coupons');
    toast.success(`Exported ${exportData.length} promo codes`);
  };

  if (isLoading) return <AdminLoading variant="table" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-serif font-bold uppercase tracking-tight">Promo Codes</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manage discounts and rewards</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none h-12 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none h-12 px-6 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Code
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search by code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-background border border-border rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-background rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
        {filteredCoupons.length === 0 ? (
          <AdminEmpty 
            title="No promo codes found" 
            description={searchQuery ? "Try a different search term" : "Get started by creating your first discount code"}
            icon={Ticket}
            action={!searchQuery ? { label: "Create Code", onClick: () => handleOpenModal() } : undefined}
          />
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Promo Code</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conditions</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visibility</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black tracking-widest uppercase">{coupon.code}</p>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                              coupon.isStackable ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-secondary text-muted-foreground border-border"
                            )}>
                              {coupon.isStackable ? "Stackable" : "Single Use"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-xl font-serif font-bold">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue.toLocaleString()}`}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                          Off total purchase
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <Layers className="w-3 h-3" />
                          Min Order: ৳{coupon.minOrderAmount.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <UserCheck className="w-3 h-3" />
                          Limit: {coupon.usageLimitPerUser} per user
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Expiry: {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                        coupon.isActive 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : "bg-secondary text-muted-foreground border-border"
                      )}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(coupon)}
                          className="p-3 bg-secondary/30 hover:bg-primary/20 hover:text-primary transition-all rounded-xl"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setCouponToDelete(coupon.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-3 bg-secondary/30 hover:bg-red-500/10 hover:text-red-500 transition-all rounded-xl"
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
      </div>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Promo Code"
        description="Are you sure you want to delete this promo code? This action cannot be undone."
        confirmLabel="Delete Code"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      {/* Promo Code Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)} />
          <form 
            onSubmit={handleSubmit}
            className="relative w-full max-w-2xl bg-background rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
          >
            <div className="p-8 md:p-10 border-b border-border flex justify-between items-center bg-secondary/10">
              <div className="space-y-1">
                <h2 className="text-2xl font-serif font-bold uppercase tracking-tight">{editingCoupon ? "Edit Code" : "Create Code"}</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Configure discount parameters</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg"><XCircle className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 md:p-10 overflow-y-auto no-scrollbar space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Promo Code String *</label>
                <input 
                  type="text" 
                  required
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm font-black tracking-widest" 
                  placeholder="e.g. SUMMER2024" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Discount Type</label>
                  <select 
                    value={formData.discountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as any }))}
                    className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Value *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) }))}
                    className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Min. Order Amount (৳)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) }))}
                    className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Expiry Date</label>
                  <input 
                    type="date" 
                    value={formData.expiryDate || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Usage Limit Per User</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.usageLimitPerUser}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimitPerUser: parseInt(e.target.value) }))}
                  className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm" 
                />
              </div>

              <div className="flex flex-col gap-6 p-6 bg-secondary/10 rounded-2xl border border-border">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest">Is Stackable?</span>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Can this code be used with others?</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={formData.isStackable}
                    onChange={(e) => setFormData(prev => ({ ...prev, isStackable: e.target.checked }))}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest">Status Active</span>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Instantly enable or disable this discount</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>
            
            <div className="p-8 md:p-10 border-t border-border flex justify-end gap-3 bg-secondary/5">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-8 py-4 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-10 py-4 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-2 active:scale-95 shadow-xl"
              >
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {editingCoupon ? "Update Code" : "Create Code"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminPromoCodes() {
  return (
    <AdminErrorBoundary>
      <AdminPromoCodesContent />
    </AdminErrorBoundary>
  );
}
