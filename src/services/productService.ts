import { supabase } from '../lib/supabaseClient';
import { Product, Category } from '../types';

export async function getProducts(
  page: number = 1, 
  pageSize: number = 20,
  options?: {
    categoryId?: string,
    search?: string,
    sort?: 'newest' | 'price-low' | 'price-high' | 'trending',
    minPrice?: number,
    maxPrice?: number
  }
): Promise<{ data: Product[], count: number, totalPages: number }> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(name),
        product_variants(*)
      `, { count: 'exact' });

    if (options?.categoryId && options.categoryId !== 'all') {
      query = query.eq('category_id', options.categoryId);
    }

    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    if (options?.minPrice !== undefined) {
      query = query.gte('price', options.minPrice);
    }
    
    if (options?.maxPrice !== undefined) {
      query = query.lte('price', options.maxPrice);
    }

    // Apply Sorting
    switch (options?.sort) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'trending':
        query = query.order('is_featured', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const products = (data || []).map(item => ({
      ...mapSupabaseProductToProduct(item),
      category: item.categories?.name,
      variants: (item.product_variants || []).map(mapSupabaseVariantToVariant)
    }));

    return {
      data: products,
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (err) {
    console.error('getProducts failed:', err);
    throw err;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_variants (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data ? {
    ...mapSupabaseProductToProduct(data),
    variants: (data.product_variants || []).map(mapSupabaseVariantToVariant)
  } : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name),
      product_variants (*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }

  return data ? {
    ...mapSupabaseProductToProduct(data),
    category: data.categories?.name,
    variants: (data.product_variants || []).map(mapSupabaseVariantToVariant)
  } : null;
}

export async function addProduct(product: Partial<Product> & { variants?: any[] }): Promise<Product> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { variants, ...productOnly } = product;
  const supabaseData = mapProductToSupabase(productOnly);
  
  const { data, error } = await supabase
    .from('products')
    .insert([supabaseData])
    .select()
    .single();

  if (error) {
    console.error('PRODUCT INSERT FAILED:', error);
    throw error;
  }

  if (variants && variants.length > 0) {
    const variantsToInsert = variants.map(v => ({
      product_id: data.id,
      size: v.size,
      color: v.color,
      price: v.price,
      stock: v.stock,
      sku: v.sku
    }));

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert);

    if (variantError) {
      console.error('VARIANT INSERT FAILED:', variantError);
      // Rollback: Delete the product we just created to avoid "ghost" products
      await supabase.from('products').delete().eq('id', data.id);
      throw new Error(`Failed to add product variants: ${variantError.message}`);
    }
  }

  const createdProduct = await getProductById(data.id);
  if (!createdProduct) throw new Error('Product created but could not be retrieved.');
  
  return createdProduct;
}

export async function updateProduct(id: string, product: Partial<Product> & { variants?: any[] }): Promise<Product> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { variants, ...productOnly } = product;
  const supabaseData = mapProductToSupabase(productOnly);
  
  const { error } = await supabase
    .from('products')
    .update(supabaseData)
    .eq('id', id);

  if (error) {
    console.error('PRODUCT UPDATE FAILED:', error);
    throw error;
  }

  if (variants) {
    // 1. Get existing variant IDs from DB to identify which ones to delete
    const { data: existingVariants, error: fetchError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', id);
    
    if (fetchError) {
      console.error('Error fetching existing variants:', fetchError);
      throw fetchError;
    }

    const existingIds = existingVariants?.map(v => v.id) || [];
    const incomingVariantIds = variants.filter(v => v.id).map(v => v.id);

    // 2. Delete variants that are no longer in the updated list
    const idsToDelete = existingIds.filter(exId => !incomingVariantIds.includes(exId));
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('id', idsToDelete);
      
      if (deleteError) {
        console.error('Error deleting removed variants:', deleteError);
      }
    }

    // 3. Upsert (update or insert) the remaining and new variants
    if (variants.length > 0) {
      const variantsToUpsert = variants.map(v => ({
        ...(v.id ? { id: v.id } : {}), // Only include id if it exists
        product_id: id,
        size: v.size,
        color: v.color,
        price: v.price,
        stock: v.stock,
        sku: v.sku
      }));

      const { error: upsertError } = await supabase
        .from('product_variants')
        .upsert(variantsToUpsert);

      if (upsertError) {
        console.error('VARIANT UPSERT FAILED:', upsertError);
      }
    }
  }

  return getProductById(id) as Promise<Product>;
}

export async function deleteProduct(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function getRelatedProducts(categoryId: string, excludeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .limit(4);
  
  if (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
  
  return (data || []).map(mapSupabaseProductToProduct);
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(count)')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...mapSupabaseCategoryToCategory(item),
    productCount: item.products?.[0]?.count || 0
  }));
}

export async function addCategory(category: Partial<Category>): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { data, error } = await supabase
    .from('categories')
    .insert([{
      name: category.name,
      slug: category.slug,
      image_url: category.imageUrl,
      parent_id: category.parentId
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding category:', error);
    throw error;
  }

  return mapSupabaseCategoryToCategory(data);
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: category.name,
      slug: category.slug,
      image_url: category.imageUrl,
      parent_id: category.parentId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }

  return mapSupabaseCategoryToCategory(data);
}

export async function deleteCategory(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// Mappers
export function mapSupabaseCategoryToCategory(item: any): Category {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    imageUrl: item.image_url,
    parentId: item.parent_id,
    createdAt: new Date(item.created_at)
  };
}

export function mapSupabaseProductToProduct(item: any): Product {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    price: item.price,
    salePrice: item.sale_price,
    discountType: item.discount_type,
    discountValue: item.discount_value,
    category_id: item.category_id,
    images: item.images || [],
    sizes: item.sizes || [],
    colors: item.colors || [],
    description: item.description || '',
    stockQuantity: item.stock_quantity || 0,
    isFeatured: item.is_featured || false,
    isActive: item.is_active || false,
    isNew: item.is_new || false,
    createdAt: new Date(item.created_at)
  };
}

export function mapSupabaseVariantToVariant(item: any): any {
  return {
    id: item.id,
    productId: item.product_id,
    size: item.size,
    color: item.color,
    price: item.price,
    stock: item.stock,
    sku: item.sku,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at)
  };
}

export function mapProductToSupabase(product: Partial<Product>): any {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    sale_price: product.salePrice,
    discount_type: product.discountType,
    discount_value: product.discountValue,
    category_id: product.category_id,
    images: product.images,
    sizes: product.sizes,
    colors: product.colors,
    stock_quantity: product.stockQuantity,
    is_featured: product.isFeatured,
    is_active: product.isActive,
    is_new: product.isNew
  };
}
