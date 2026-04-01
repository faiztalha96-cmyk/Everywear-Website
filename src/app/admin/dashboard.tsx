import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/auth-context";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  DollarSign,
  Activity,
  ArrowRight,
  MoreVertical,
  RefreshCw
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { getAdminStats } from "../../lib/supabase-service";
import { AdminStats } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { AdminLoading } from "../../components/admin/admin-loading";
import { AdminEmpty } from "../../components/admin/admin-empty";
import { AdminErrorBoundary } from "../../components/admin/admin-error-boundary";

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  const { data: stats, isLoading, error, refetch } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-12">
        <AdminLoading variant="stats" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <AdminLoading variant="table" count={1} className="h-[400px]" />
          </div>
          <div className="lg:col-span-4">
            <AdminLoading variant="table" count={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AdminEmpty 
        title="Dashboard Error" 
        description="Failed to load dashboard data. Please check your connection." 
        icon={Activity}
        action={{
          label: "Try Again",
          onClick: () => refetch(),
          icon: RefreshCw
        }}
      />
    );
  }

  const statCards = [
    { 
      label: "Total Revenue", 
      value: `৳${(stats?.totalRevenue || 0).toLocaleString()}`, 
      change: "+12.5%", 
      trend: "up", 
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    { 
      label: "Total Orders", 
      value: (stats?.totalOrders || 0).toLocaleString(), 
      change: "+8.2%", 
      trend: "up", 
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    { 
      label: "Total Customers", 
      value: (stats?.totalCustomers || 0).toLocaleString(), 
      change: "+24.1%", 
      trend: "up", 
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10"
    },
    { 
      label: "Pending Orders", 
      value: (stats?.pendingOrders || 0).toLocaleString(), 
      change: "-5.4%", 
      trend: "down", 
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ];

  return (
    <AdminErrorBoundary>
      <div className="space-y-12 md:space-y-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Activity className="w-4 h-4" /> Store Overview
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold uppercase tracking-tight">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-md">
              Real-time analytics and performance metrics for your store.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-2xl border border-border">
            <button 
              onClick={() => {
                setTimeRange('7d');
                toast.success("Filter applied: Last 7 Days");
              }}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                timeRange === '7d' 
                  ? "bg-background text-foreground shadow-sm border border-border" 
                  : "text-muted-foreground hover:text-yellow-500"
              )}
            >
              Last 7 Days
            </button>
            <button 
              onClick={() => {
                setTimeRange('30d');
                toast.success("Filter applied: Last 30 Days");
              }}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                timeRange === '30d' 
                  ? "bg-background text-foreground shadow-sm border border-border" 
                  : "text-muted-foreground hover:text-yellow-500"
              )}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => (
            <div key={idx} className="p-8 bg-background rounded-[2.5rem] border border-border space-y-6 hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  stat.trend === "up" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                  {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-serif font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-8 p-8 md:p-10 bg-background rounded-[3rem] border border-border space-y-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-serif font-bold uppercase tracking-tight">Revenue Growth</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily revenue performance</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                <TrendingUp className="w-4 h-4" /> +15% vs Last Week
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.revenueHistory || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }}
                    tickFormatter={(value) => `৳${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#000" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions / Recent Activity */}
          <div className="lg:col-span-4 p-8 md:p-10 bg-secondary/10 rounded-[3rem] border border-border space-y-10">
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold uppercase tracking-tight">Recent Activity</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest store events</p>
            </div>

            <div className="space-y-6">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.slice(0, 5).map((order, idx) => (
                  <div key={idx} className="flex gap-4 group cursor-pointer">
                    <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center border border-border shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold">New Order #{order.id?.slice(0, 6)}</p>
                        <p className="text-[9px] font-bold text-muted-foreground">2m ago</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">৳{order.totalPrice?.toLocaleString()} • {order.items?.length || 0} Items</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No recent activity</p>
                </div>
              )}
            </div>

            <Link 
              href="/admin/orders"
              className="w-full h-14 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              View All Activity <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-background rounded-[3rem] border border-border overflow-hidden">
          <div className="p-8 md:p-10 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold uppercase tracking-tight">Recent Orders</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manage your latest customer purchases</p>
            </div>
            <Link 
              href="/admin/orders"
              className="h-12 px-8 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              View All Orders <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-10 py-6">
                        <span className="text-xs font-bold font-mono">#{order.id?.slice(0, 8)}</span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="space-y-1">
                          <p className="text-xs font-bold">{order.firstName} {order.lastName}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{order.email}</p>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          order.status === "delivered" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          order.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <p className="text-xs font-bold">৳{order.totalPrice?.toLocaleString()}</p>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <Link 
                          href="/admin/orders"
                          className="p-2.5 hover:bg-secondary rounded-lg transition-colors inline-block"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-20 text-center">
                      <AdminEmpty title="No recent orders" description="Orders will appear here once customers start purchasing" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminErrorBoundary>
  );
}
