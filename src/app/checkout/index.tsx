import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ChevronRight, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Lock
} from "lucide-react";
import { useCart } from "../../contexts/cart-context";
import { useAuth } from "../../contexts/auth-context";
import { placeOrder, getSettingsData } from "../../lib/supabase-service";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { CheckoutSummary } from "./components/checkout-summary";

type Step = "shipping" | "payment" | "confirmation";

export default function Checkout() {
  const [location, setLocation] = useLocation();
  const { cart, subtotal, clearCart, appliedCoupons, discountAmount } = useCart();
  const { user, profile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const nameParts = profile?.name?.split(' ') || [];
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(' ') || "",
    email: user?.email || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    postalCode: profile?.postalCode || "",
    notes: "",
    paymentMethod: "cod" as "cod" | "card" | "bkash"
  });

  // Fetch payment settings from Supabase
  const { data: settings } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const data = await getSettingsData();
      return data || ({ paymentMethods: { cod: { enabled: true }, online: { enabled: false } } } as any);
    }
  });

  const isOnlineDisabled = settings?.paymentMethods?.online?.enabled === false;
  const isCodDisabled = settings?.paymentMethods?.cod?.enabled === false;

  // Define payment methods with availability status
  const paymentMethods = [
    { 
      id: "cod", 
      label: "Cash on Delivery", 
      icon: Truck, 
      desc: "Pay when you receive your order",
      isDisabled: isCodDisabled
    },
    { 
      id: "bkash", 
      label: "bKash / Mobile Banking", 
      icon: CreditCard, 
      desc: "Fast and secure mobile payment",
      isDisabled: isOnlineDisabled
    },
    { 
      id: "card", 
      label: "Credit / Debit Card", 
      icon: ShieldCheck, 
      desc: "Visa, Mastercard, Amex",
      isDisabled: isOnlineDisabled
    }
  ];

  // Auto-select first available method if current one is disabled
  useEffect(() => {
    if (settings) {
      const currentMethod = paymentMethods.find(m => m.id === formData.paymentMethod);
      if (!currentMethod || currentMethod.isDisabled) {
        const firstAvailable = paymentMethods.find(m => !m.isDisabled);
        if (firstAvailable) {
          setFormData(prev => ({ ...prev, paymentMethod: firstAvailable.id as any }));
        }
      }
    }
  }, [settings, formData.paymentMethod]);

  useEffect(() => {
    if (cart.length === 0 && currentStep !== "confirmation") {
      setLocation("/shop");
    }
  }, [cart, currentStep, setLocation]);

  useEffect(() => {
    if (!loading && !user && currentStep !== "confirmation") {
      toast.error("Please sign in to place an order");
      setLocation("/login");
    }
  }, [user, loading, currentStep, setLocation]);

  if (loading || (!user && currentStep !== "confirmation")) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep("payment");
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Clear any previous error toasts
    toast.dismiss();
    
    try {
      const orderData = {
        userId: user?.id,
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.salePrice || item.product.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          image: item.product.images?.[0] || ""
        })),
        couponCode: appliedCoupons.map(c => c.code).join(", "),
        status: "pending" as const,
        ...formData,
        createdAt: new Date()
      };

      const id = await placeOrder(orderData as any);
      setOrderId(id);
      setCurrentStep("confirmation");
      clearCart();
      toast.success("Order placed successfully!", {
        duration: 5000,
        icon: '🛍️'
      });
    } catch (err: any) {
      console.error("Order placement error details:", err);
      
      // Determine the error message based on common failure modes
      let errorMessage = "Failed to place order. Please try again.";
      
      if (err.message?.includes("Insufficient stock")) {
        errorMessage = `Stock Error: ${err.message}. Please adjust your bag.`;
      } else if (err.code === "PGRST204" || err.message?.includes("not found")) {
        errorMessage = "One or more products are no longer available.";
      } else if (err.message?.includes("record \"v_coupon_record\" is not assigned yet")) {
        errorMessage = "There was a system error with the coupon logic. Our team has been notified.";
      } else if (err.status === 500) {
        errorMessage = "A server error occurred. Please try again in 1 minute.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, {
        duration: 6000,
        id: "checkout-error", // Prevent duplicate toasts
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (currentStep === "confirmation") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-bold uppercase tracking-tight">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order <span className="font-bold text-foreground">#{orderId?.slice(0, 8)}</span> has been placed and is being processed.
            </p>
          </div>
          <div className="pt-8 flex flex-col gap-4">
            <button 
              onClick={() => setLocation("/orders")}
              className="h-14 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2"
            >
              View Order Status <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
            <button 
              onClick={() => setLocation("/shop")}
              className="h-14 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
        {/* Main Checkout Flow */}
        <div className="lg:col-span-7 space-y-12 md:space-y-20">
          {/* Progress Indicator */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className={cn(
              "flex items-center gap-3 transition-all",
              currentStep === "shipping" ? "text-foreground" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                currentStep === "shipping" ? "border-primary bg-primary text-primary-foreground" : "border-border"
              )}>1</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Shipping</span>
            </div>
            <div className="h-px flex-grow bg-border" />
            <div className={cn(
              "flex items-center gap-3 transition-all",
              currentStep === "payment" ? "text-foreground" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                currentStep === "payment" ? "border-primary bg-primary text-primary-foreground" : "border-border"
              )}>2</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Payment</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === "shipping" ? (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-10"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">Shipping Details</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Where should we send your order?</p>
                </div>

                <form onSubmit={handleShippingSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                        <UserIcon className="w-3 h-3" /> First Name
                      </label>
                      <input
                        required
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                        <UserIcon className="w-3 h-3" /> Last Name
                      </label>
                      <input
                        required
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email Address
                      </label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                        <Phone className="w-3 h-3" /> Phone Number
                      </label>
                      <input
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="+880 1XXX XXXXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Delivery Address
                    </label>
                    <input
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                      placeholder="Street address, Apartment, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">City</label>
                      <input
                        required
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="Dhaka"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Postal Code</label>
                      <input
                        required
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="1212"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Order Notes (Optional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full h-32 bg-secondary/20 border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-primary transition-all resize-none"
                      placeholder="Special instructions for delivery..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full h-16 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3"
                  >
                    Continue to Payment <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="space-y-2">
                  <button 
                    onClick={() => setCurrentStep("shipping")}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Shipping
                  </button>
                  <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">Payment Method</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select your preferred way to pay</p>
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      disabled={method.isDisabled}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id as any }))}
                      className={cn(
                        "w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center gap-6 relative",
                        formData.paymentMethod === method.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/30",
                        method.isDisabled && "opacity-50 cursor-not-allowed border-dashed bg-secondary/10"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        formData.paymentMethod === method.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold flex items-center gap-2">
                          {method.label}
                          {method.isDisabled && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                              Currently unavailable
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        formData.paymentMethod === method.id ? "border-primary bg-primary" : "border-border",
                        method.isDisabled && "border-border/50"
                      )}>
                        {formData.paymentMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-6 bg-secondary/20 rounded-2xl border border-border space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Secure Checkout Guaranteed</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                  </p>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || paymentMethods.every(m => m.isDisabled)}
                  className="w-full h-16 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-foreground/10"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : paymentMethods.every(m => m.isDisabled) ? (
                    <>
                      No payment method available <AlertCircle className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Complete Order <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-5">
          <CheckoutSummary 
            cart={cart as any} 
            subtotal={subtotal} 
            appliedCoupons={appliedCoupons}
            discountAmount={discountAmount}
            contactEmail={settings?.contact?.email}
          />
        </div>
      </div>
    </div>
  );
}
