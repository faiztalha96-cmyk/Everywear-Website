import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/auth-context";
import { 
  CreditCard, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  Save, 
  RefreshCw,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  DollarSign,
  Lock,
  ExternalLink,
  Loader2
} from "lucide-react";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { AdminErrorBoundary } from "../../components/admin/admin-error-boundary";
import { AdminLoading } from "../../components/admin/admin-loading";
import { AdminEmpty } from "../../components/admin/admin-empty";
import { getSettingsData, updateSettings } from "../../lib/supabase-service";
import { AppSettings } from "../../types";
import { motion, AnimatePresence } from "motion/react";

function AdminPaymentSettingsContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"methods" | "currency" | "security">("methods");
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const { user, session } = useAuth();

  const { data: serverSettings, isLoading: loading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      try {
        return await getSettingsData();
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        toast.error("Failed to load settings from database");
        return null;
      }
    },
    enabled: !!user && !!session,
  });

  useEffect(() => {
    if (serverSettings) {
      setSettings(serverSettings as AppSettings);
    }
  }, [serverSettings]);


  const tabs = [
    { id: "methods", label: "Payment Methods", icon: CreditCard },
    { id: "currency", label: "Currency & Taxes", icon: DollarSign },
    { id: "security", label: "Security & Fraud", icon: ShieldCheck },
  ];

  const [paymentMethods, setPaymentMethods] = useState([
    { id: "bkash", name: "bKash", type: "Mobile Wallet", active: true, icon: Smartphone },
    { id: "nagad", name: "Nagad", type: "Mobile Wallet", active: true, icon: Smartphone },
    { id: "card", name: "Credit/Debit Card", type: "SSLCommerz", active: false, icon: CreditCard },
    { id: "cod", name: "Cash on Delivery", type: "Manual", active: true, icon: Globe },
  ]);

  const toggleMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(m => 
      m.id === id ? { ...m, active: !m.active } : m
    ));
  };

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (_, newSettings) => {
      queryClient.setQueryData(['admin', 'settings'], newSettings);
      toast.success("Payment settings saved successfully");
    },
    onError: (err) => {
      console.error("Save error:", err);
      toast.error("Failed to save changes. Your database might need the 'settings' table.");
    }
  });

  const handleSave = () => {
    if (!settings) return;
    saveMutation.mutate(settings);
  };
  
  const isSubmitting = saveMutation.isPending;

  const updatePaymentSetting = (gateway: 'cod' | 'online', field: string, value: any) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        paymentMethods: {
          ...prev.paymentMethods,
          [gateway]: {
            ...(prev.paymentMethods[gateway] as any),
            [field]: value
          }
        }
      };
    });
  };

  if (loading) return <AdminLoading variant="form" />;

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <CreditCard className="w-4 h-4" /> Financials
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold uppercase tracking-tight">Payment Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            Configure how you receive payments and manage financial compliance.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            disabled={isSubmitting}
            className="h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="h-14 px-8 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Sidebar Tabs */}
        <div className="xl:col-span-3 flex xl:flex-col gap-3 overflow-x-auto no-scrollbar pb-4 xl:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-4 px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap xl:w-full border-2 shrink-0",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20" 
                  : "bg-background text-muted-foreground border-border/50 hover:border-primary/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Form */}
        <div className="xl:col-span-9 space-y-8">
          <div className="bg-background rounded-[3rem] border border-border p-10 md:p-16 space-y-16 shadow-sm">
            <AnimatePresence mode="wait">
              {activeTab === "methods" && (
                <motion.div 
                  key="methods"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-16"
                >
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 border-b border-border pb-4">Active Gateways</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {/* bKash (Online Gateway) */}
                      <div className="p-10 bg-secondary/10 rounded-[2.5rem] border border-border/30 space-y-8 group hover:border-primary/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center border border-border shadow-md transition-transform group-hover:scale-110">
                            <Smartphone className="w-7 h-7 text-primary" />
                          </div>
                          <button 
                            onClick={() => updatePaymentSetting('online', 'enabled', !settings?.paymentMethods.online.enabled)}
                            className={cn(
                              "w-14 h-7 rounded-full transition-all relative",
                              settings?.paymentMethods.online.enabled ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                              settings?.paymentMethods.online.enabled ? "left-8" : "left-1"
                            )} />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-bold uppercase tracking-widest">SSLCommerz (Online)</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Supports bKash, Nagad, Card</p>
                        </div>
                      </div>

                      {/* COD */}
                      <div className="p-10 bg-secondary/10 rounded-[2.5rem] border border-border/30 space-y-8 group hover:border-primary/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center border border-border shadow-md transition-transform group-hover:scale-110">
                            <Globe className="w-7 h-7 text-primary" />
                          </div>
                          <button 
                            onClick={() => updatePaymentSetting('cod', 'enabled', !settings?.paymentMethods.cod.enabled)}
                            className={cn(
                              "w-14 h-7 rounded-full transition-all relative",
                              settings?.paymentMethods.cod.enabled ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                              settings?.paymentMethods.cod.enabled ? "left-8" : "left-1"
                            )} />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-bold uppercase tracking-widest">Cash on Delivery</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Manual fulfillment</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 border-b border-border pb-4">General Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-8 bg-secondary/10 rounded-[2rem] border border-border/30 hover:border-primary/30 transition-colors">
                        <div className="space-y-2">
                          <p className="text-sm font-bold uppercase tracking-widest">Enable Sandbox Mode</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Test payments without real money transactions</p>
                        </div>
                        <button 
                          onClick={() => updatePaymentSetting('online', 'sandbox', !settings?.paymentMethods.online.sandbox)}
                          className={cn(
                            "w-14 h-7 rounded-full transition-all relative",
                            settings?.paymentMethods.online.sandbox ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all",
                            settings?.paymentMethods.online.sandbox ? "left-8" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "currency" && (
                <motion.div 
                  key="currency"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-16"
                >
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Store Currency</label>
                      <select 
                        value={settings?.storeCurrency || "BDT"}
                        onChange={(e) => setSettings(prev => prev ? ({ ...prev, storeCurrency: e.target.value }) : null)}
                        className="w-full h-16 bg-secondary/20 border border-border rounded-2xl px-6 text-xs font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-secondary/30 transition-colors"
                      >
                        <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tax Rate (%)</label>
                      <input 
                        type="number" 
                        value={settings?.taxRate || 0} 
                        onChange={(e) => setSettings(prev => prev ? ({ ...prev, taxRate: Number(e.target.value) }) : null)}
                        className="w-full h-16 bg-secondary/20 border border-border rounded-2xl px-6 text-xs font-bold uppercase tracking-widest focus:outline-none hover:bg-secondary/30 transition-colors" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPaymentSettings() {
  return (
    <AdminErrorBoundary>
      <AdminPaymentSettingsContent />
    </AdminErrorBoundary>
  );
}
