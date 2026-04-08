import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/auth-context";
import { CartProvider } from "./contexts/cart-context";
import { WishlistProvider } from "./contexts/wishlist-context";
import { ThemeProvider } from "./contexts/theme-context";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { Layout } from "./components/layout/layout";
import { AdminLayout } from "./components/admin/admin-layout";
import { AdminGuard } from "./components/admin/admin-guard";
import { AdminLoading } from "./components/admin/admin-loading";

// Store Pages (Lazy Loaded)
const Home = React.lazy(() => import("./app/home"));
const Shop = React.lazy(() => import("./app/shop"));
const ProductDetails = React.lazy(() => import("./app/shop/product-details"));
const Cart = React.lazy(() => import("./app/cart"));
const Checkout = React.lazy(() => import("./app/checkout"));
const Login = React.lazy(() => import("./app/login"));
const Register = React.lazy(() => import("./app/login/register"));
const AuthCallback = React.lazy(() => import("./app/auth/callback"));
const ResetPassword = React.lazy(() => import("./app/auth/reset-password"));
const RecentlyViewed = React.lazy(() => import("./app/recently-viewed"));
const Wishlist = React.lazy(() => import("./app/wishlist"));
const Contact = React.lazy(() => import("./app/contact"));
const About = React.lazy(() => import("./app/about"));
const Orders = React.lazy(() => import("./app/orders"));
const Settings = React.lazy(() => import("./app/settings"));
const Shipping = React.lazy(() => import("./app/policy/shipping"));
const Returns = React.lazy(() => import("./app/policy/returns"));
const FAQ = React.lazy(() => import("./app/policy/faq"));
const Privacy = React.lazy(() => import("./app/policy/privacy"));
const Terms = React.lazy(() => import("./app/policy/terms"));
const NotFound = React.lazy(() => import("./app/not-found"));

// Admin Pages (Lazy Loaded)
const AdminDashboard = React.lazy(() => import("./app/admin/dashboard"));
const AdminProducts = React.lazy(() => import("./app/admin/products"));
const AdminCategories = React.lazy(() => import("./app/admin/categories"));
const AdminOrders = React.lazy(() => import("./app/admin/orders"));
const AdminCustomers = React.lazy(() => import("./app/admin/customers"));
const AdminAbandonedCarts = React.lazy(() => import("./app/admin/abandoned-carts"));
const AdminPaymentSettings = React.lazy(() => import("./app/admin/payment-settings"));
const AdminPromoCodes = React.lazy(() => import("./app/admin/promo-codes"));
const AdminCustomization = React.lazy(() => import("./app/admin/customization"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,       // 5 min — don't re-fetch if data is fresh
      gcTime: 30 * 60 * 1000,          // keep unused cache 30 min
      refetchOnWindowFocus: false,
      refetchOnMount: false,            // use cached data when navigating back
      refetchOnReconnect: true,         // but do refresh on reconnect
    },
  },
});

/** Thin shimmer bar shown while a lazy page chunk loads.
 *  Keeps the visual weight identical to the real layout so there's no layout shift. */
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* header placeholder */}
      <div className="h-16 border-b border-border/40 bg-background" />
      {/* content shimmer */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );
}

function AdminRouter() {
  return (
    <AdminGuard>
      <AdminLayout>
        <React.Suspense fallback={<AdminLoading variant="table" count={5} className="mt-8" />}>
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/products" component={AdminProducts} />
            <Route path="/admin/categories" component={AdminCategories} />
            <Route path="/admin/promo-codes" component={AdminPromoCodes} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/customers" component={AdminCustomers} />
            <Route path="/admin/abandoned-carts" component={AdminAbandonedCarts} />
            <Route path="/admin/payment-settings" component={AdminPaymentSettings} />
            <Route path="/admin/customization" component={AdminCustomization} />
          </Switch>
        </React.Suspense>
      </AdminLayout>
    </AdminGuard>
  );
}

function StoreRouter() {
  return (
    <Layout>
      <React.Suspense fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/product/:slug" component={ProductDetails} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/auth/callback" component={AuthCallback} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/recently-viewed" component={RecentlyViewed} />
          <Route path="/wishlist" component={Wishlist} />
          <Route path="/contact" component={Contact} />
          <Route path="/about" component={About} />
          <Route path="/orders" component={Orders} />
          <Route path="/settings" component={Settings} />
          <Route path="/shipping" component={Shipping} />
          <Route path="/returns" component={Returns} />
          <Route path="/faq" component={FAQ} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route component={NotFound} />
        </Switch>
      </React.Suspense>
    </Layout>
  );
}

import { ScrollToTop } from "./components/layout/scroll-to-top";

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/admin/:rest* " component={AdminRouter} />
        <Route path="/admin" component={AdminRouter} />
        <Route component={StoreRouter} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <WouterRouter>
                  <React.Suspense fallback={<PageSkeleton />}>
                    <Router />
                  </React.Suspense>
                </WouterRouter>
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: "hsl(var(--foreground))",
                      color: "hsl(var(--background))",
                      borderRadius: "0px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      padding: "16px",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    },
                  }}
                />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
