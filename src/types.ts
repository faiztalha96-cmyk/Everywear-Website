export interface ProductColor {
  name: string;
  hex: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: string;
  productCount?: number;
  createdAt: Date;
}

export interface ProductVariant {
  id?: string;
  productId: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  sku?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number | null;
  category_id?: string;
  category?: string;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  description: string;
  stockQuantity: number;
  isFeatured?: boolean;
  isActive?: boolean;
  isNew?: boolean;
  createdAt: Date;
  variants?: ProductVariant[];
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  image: string;
}

export interface Order {
  id?: string;
  userId: string;
  items?: OrderItem[];
  totalPrice?: number;
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  paymentMethod: string;
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  couponCode?: string;
  discountAmount?: number;
  notes?: string;
  createdAt: Date | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  theme?: 'light' | 'dark';
  createdAt: Date;
  orderCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiryDate?: string;
  isActive: boolean;
  isStackable: boolean;
  usageLimitPerUser: number;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: Order[];
  revenueHistory: { date: string; revenue: number }[];
}

export interface AppSettings {
  announcement: {
    enabled: boolean;
    text: string;
  };
  theme: {
    primaryColor: string;
  };
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  paymentMethods: {
    cod: {
      enabled: boolean;
      instructions: string;
    };
    online: {
      enabled: boolean;
      storeId: string;
      storePassword: string;
      sandbox: boolean;
    };
  };
  storeCurrency: string;
  taxRate: number;
}

export interface AbandonedCart {
  id?: string;
  userId?: string;
  userEmail?: string;
  products: any[];
  lastUpdated: Date;
}
