import { supabase } from '../lib/supabaseClient';
import { Order, OrderItem, AdminStats } from '../types';

// getSession() reads from local storage — instant vs getUser()'s network call
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function placeOrder(order: Order): Promise<string> {
  // Build the shipping address JSONB
  const shippingAddress = {
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    postalCode: order.postalCode,
    notes: order.notes
  };

  // Build line items JSONB for the RPC
  const items = (order.items || []).map(item => ({
    productId: item.productId,
    variantId: item.variantId || null,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    selectedSize: item.selectedSize || null,
    selectedColor: item.selectedColor || null,
  }));

  // Use the NEW security-hardened RPC
  // We no longer pass totalPrice or discountAmount - the server calculates them
  const { data: orderId, error } = await supabase.rpc('place_order', {
    p_items: items,
    p_address: shippingAddress,
    p_payment_method: order.paymentMethod,
    p_coupon_code: order.couponCode || null,
  });

  if (error) {
    console.error('place_order RPC error:', error);
    throw error;
  }

  return orderId as string;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Security: If not admin, can only fetch own orders
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && user.id !== userId) {
    throw new Error('Unauthorized: You can only access your own orders.');
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, images)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }

  return (data || []).map(mapSupabaseOrderToOrder);
}

export async function getAllOrders(): Promise<Order[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, images)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }

  return (data || []).map(mapSupabaseOrderToOrder);
}

export async function getAdminStats(): Promise<AdminStats> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  // Trigger the abandoned cart detection before fetching stats
  // This ensures the list is up-to-date whenever an admin checks the dashboard.
  await supabase.rpc('detect_abandoned_carts');

  // Call the newly corrected RPC function for stats
  const { data: stats, error: rpcError } = await supabase.rpc('get_admin_stats');
  
  if (rpcError) {
    console.error("RPC Error fetching admin stats:", rpcError);
    throw rpcError;
  }

  // Fetch recent orders separately (limited to 10)
  const { data: recentOrdersData, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (ordersError) {
    console.error("Error fetching recent orders:", ordersError);
    throw ordersError;
  }

  return {
    totalRevenue: stats.total_revenue || 0,
    totalOrders: stats.total_orders || 0,
    totalCustomers: stats.total_customers || 0,
    pendingOrders: stats.pending_orders || 0,
    completedOrders: stats.completed_orders || 0,
    recentOrders: (recentOrdersData || []).map(mapSupabaseOrderToOrder),
    revenueHistory: stats.revenue_history || []
  };
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { error } = await supabase
    .from('orders')
    .update({ status: status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

export function subscribeToNewOrders(callback: (order: Order) => void): () => void {
  const channel = supabase
    .channel('new-orders')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      async (payload) => {
        // Fetch items for the new order
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', payload.new.id);
        
        callback(mapSupabaseOrderToOrder({ ...payload.new, order_items: items }));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Mappers
export function mapSupabaseOrderToOrder(item: any): Order {
  const items: OrderItem[] = (item.order_items || []).map((oi: any) => ({
    id: oi.id,
    orderId: oi.order_id,
    productId: oi.product_id,
    name: oi.products?.name || 'Product',
    price: oi.unit_price,
    quantity: oi.quantity,
    selectedSize: oi.size,
    selectedColor: oi.color,
    variantId: oi.variant_id,
    image: oi.products?.images?.[0] || ''
  }));

  const shippingAddress = item.shipping_address || {};

  return {
    id: item.id,
    userId: item.user_id,
    items,
    totalPrice: item.total_amount,
    status: item.status,
    shippingAddress,
    firstName: shippingAddress.firstName || '',
    lastName: shippingAddress.lastName || '',
    email: shippingAddress.email || '',
    phone: shippingAddress.phone || '',
    address: shippingAddress.address || '',
    city: shippingAddress.city || '',
    postalCode: shippingAddress.postalCode || '',
    paymentMethod: item.payment_method,
    paymentStatus: item.payment_status,
    notes: item.notes,
    createdAt: new Date(item.created_at)
  };
}
