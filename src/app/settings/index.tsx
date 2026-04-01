import { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  CreditCard, 
  LogOut, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Moon,
  Sun,
  Smartphone,
  Globe,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../../contexts/auth-context";
import { updateUserProfile } from "../../lib/supabase-service";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

type Tab = "profile" | "security" | "notifications" | "preferences";

export default function Settings() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    avatarUrl: profile?.avatarUrl || ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: user?.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        avatarUrl: profile.avatarUrl || ""
      });
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        avatarUrl: formData.avatarUrl
      });
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: SettingsIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 space-y-12 md:space-y-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <SettingsIcon className="w-4 h-4" /> My Account
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tight">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            Manage your personal information, security preferences, and account settings.
          </p>
        </div>
        
        <button 
          onClick={logout}
          className="h-14 px-8 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-4 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-foreground text-background shadow-xl scale-[1.02]" 
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center gap-8 p-8 md:p-10 bg-secondary/10 rounded-[3rem] border border-border">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-secondary/30 border-4 border-background overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <UserIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left space-y-2">
                    <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">{profile?.name}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2">
                      <div className="px-4 py-1.5 bg-background border border-border rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {profile?.orderCount || 0} Orders
                      </div>
                      <div className="px-4 py-1.5 bg-background border border-border rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Elite Member
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleProfileUpdate} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                        <UserIcon className="w-3 h-3" /> Full Name
                      </label>
                      <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email Address
                      </label>
                      <input
                        disabled
                        type="email"
                        name="email"
                        value={formData.email}
                        className="w-full h-14 bg-secondary/10 border border-border rounded-xl px-4 text-sm opacity-50 cursor-not-allowed"
                        placeholder="john@example.com"
                      />
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Email cannot be changed</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                        <Phone className="w-3 h-3" /> Phone Number
                      </label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="+880 1XXX XXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Default Address
                      </label>
                      <input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="Street address, City, Postal Code"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit"
                      disabled={isUpdating}
                      className="w-full sm:w-auto h-16 px-12 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                        </>
                      ) : (
                        <>
                          Save Changes <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">Security Settings</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Keep your account safe and secure</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Password Section */}
                  <div className="p-8 md:p-10 bg-secondary/10 rounded-[3rem] border border-border space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Change Password</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last changed 3 months ago</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="w-full h-14 bg-background border border-border rounded-xl px-4 text-sm"
                            placeholder="••••••••"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">New Password</label>
                          <input type="password" className="w-full h-14 bg-background border border-border rounded-xl px-4 text-sm" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Confirm New Password</label>
                          <input type="password" className="w-full h-14 bg-background border border-border rounded-xl px-4 text-sm" placeholder="••••••••" />
                        </div>
                      </div>
                      <button className="h-14 px-10 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all">
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* 2FA Section */}
                  <div className="p-8 md:p-10 bg-secondary/10 rounded-[3rem] border border-border flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Two-Factor Authentication</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button className="h-12 px-8 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other tabs would follow similar responsive patterns */}
            {activeTab !== "profile" && activeTab !== "security" && (
              <div className="py-20 text-center space-y-6 bg-secondary/10 rounded-[3rem] border border-dashed border-border">
                <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto">
                  <SettingsIcon className="w-8 h-8 text-muted-foreground opacity-30" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-serif font-bold italic">Coming Soon</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">We're working on these settings</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
