import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { 
  Palette, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Save, 
  RefreshCw,
  Plus,
  Trash2,
  Upload,
  Check,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
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

function AdminCustomizationContent() {
  const [activeTab, setActiveTab] = useState<"theme" | "header" | "footer" | "home">("theme");
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const { user, session } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettingsData();
        if (data) setSettings(data);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        toast.error("Failed to load settings from database");
      } finally {
        setLoading(false);
      }
    };

    if (user && session) {
      fetchSettings();
    }
  }, [user, session]);

  const tabs = [
    { id: "theme", label: "Theme & Colors", icon: Palette },
    { id: "header", label: "Header & Nav", icon: Layout },
    { id: "footer", label: "Footer", icon: Layout },
    { id: "home", label: "Home Page", icon: ImageIcon },
  ];

  const handleSave = async () => {
    if (!settings) return;
    setIsSubmitting(true);
    try {
      await updateSettings(settings);
      toast.success("Customization settings saved successfully");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save changes. Your database might need the 'settings' table.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateNestedSetting = (category: keyof AppSettings, field: string, value: any) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [category]: {
          ...(prev[category] as any),
          [field]: value
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
            <Palette className="w-4 h-4" /> Visual Identity
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold uppercase tracking-tight">Customization</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            Personalize your store's appearance and fine-tune the customer experience.
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
              {activeTab === "theme" && (
                <motion.div 
                  key="theme"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-16"
                >
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 border-b border-border pb-4">Brand Colors</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Primary Color</label>
                        <div className="flex items-center gap-4 p-4 bg-secondary/20 rounded-2xl border border-border/50">
                          <div 
                            className="w-10 h-10 rounded-xl shadow-inner border border-black/10" 
                            style={{ backgroundColor: settings?.theme.primaryColor || "#000000" }} 
                          />
                          <input 
                            type="text" 
                            value={settings?.theme.primaryColor || "#000000"} 
                            onChange={(e) => updateNestedSetting('theme', 'primaryColor', e.target.value)}
                            className="bg-transparent text-xs font-bold uppercase tracking-widest focus:outline-none w-full" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 border-b border-border pb-4">Typography</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Headings Font</label>
                        <select className="w-full h-16 bg-secondary/20 border border-border rounded-2xl px-6 text-xs font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-secondary/30 transition-colors">
                          <option>Playfair Display</option>
                          <option>Inter</option>
                          <option>Montserrat</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Body Font</label>
                        <select className="w-full h-16 bg-secondary/20 border border-border rounded-2xl px-6 text-xs font-bold uppercase tracking-widest focus:outline-none appearance-none cursor-pointer hover:bg-secondary/30 transition-colors">
                          <option>Inter</option>
                          <option>Roboto</option>
                          <option>Open Sans</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 border-b border-border pb-4">Visual Style</h3>
                    <div className="flex flex-wrap gap-4">
                      {["Sharp", "Slightly Rounded", "Very Rounded"].map((style) => (
                        <button
                          key={style}
                          className={cn(
                            "px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95",
                            style === "Very Rounded" ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-background text-muted-foreground border-border/50 hover:border-primary/50"
                          )}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

               {activeTab === "home" && (
                <motion.div 
                  key="home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-16"
                >
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 border-b border-border pb-4">Hero Section</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Main Title</label>
                        <input 
                          type="text" 
                          value={settings?.hero.title || ""}
                          onChange={(e) => updateNestedSetting('hero', 'title', e.target.value)}
                          className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Subtitle</label>
                        <textarea 
                          value={settings?.hero.subtitle || ""}
                          onChange={(e) => updateNestedSetting('hero', 'subtitle', e.target.value)}
                          className="w-full h-32 bg-secondary/20 border border-border rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-primary transition-all resize-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Background Image URL</label>
                        <input 
                          type="url" 
                          value={settings?.hero.backgroundImage || ""}
                          onChange={(e) => updateNestedSetting('hero', 'backgroundImage', e.target.value)}
                          className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-all" 
                        />
                      </div>
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

export default function AdminCustomization() {
  return (
    <AdminErrorBoundary>
      <AdminCustomizationContent />
    </AdminErrorBoundary>
  );
}
