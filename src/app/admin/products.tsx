import { useState, useMemo, useRef } from "react";
import { useAuth } from "../../contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  Image as ImageIcon,
  XCircle,
  Upload,
  Loader2
} from "lucide-react";
import { 
  getProducts, 
  deleteProduct, 
  addProduct, 
  updateProduct, 
  getCategories,
  uploadProductImage 
} from "../../lib/supabase-service";
import { downloadCSV } from "../../lib/export-utils";
import { Product, Category } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { AdminErrorBoundary } from "../../components/admin/admin-error-boundary";
import { AdminLoading } from "../../components/admin/admin-loading";
import { AdminEmpty } from "../../components/admin/admin-empty";
import { ConfirmationModal } from "../../components/admin/confirmation-modal";

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free"];

function AdminProductsContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedStock, setSelectedStock] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [newColorName, setNewColorName] = useState("");
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await getProducts();
      return data;
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getCategories
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Product deleted successfully");
      setIsDeleteModalOpen(false);
    },
    onError: () => toast.error("Failed to delete product. It might be linked to existing orders.")
  });

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Product created successfully");
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Product updated successfully");
      setIsModalOpen(false);
    }
  });

  const loading = productsLoading || categoriesLoading;

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    price: 0,
    salePrice: 0,
    stockQuantity: 0,
    description: "",
    images: [] as string[],
    sizes: [] as string[],
    colors: [] as { name: string, hex: string }[],
    isFeatured: false,
    isActive: true,
    isNew: false
  });

  const confirmDelete = async () => {
    if (!productToDelete) return;
    deleteMutation.mutate(productToDelete);
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        category_id: product.category_id || "",
        price: product.price || 0,
        salePrice: product.salePrice || 0,
        stockQuantity: product.stockQuantity || 0,
        description: product.description || "",
        images: product.images || [],
        sizes: product.sizes || [],
        colors: product.colors || [],
        isFeatured: product.isFeatured || false,
        isActive: product.isActive || false,
        isNew: product.isNew || false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        slug: "",
        category_id: categories[0]?.id || "",
        price: 0,
        salePrice: 0,
        stockQuantity: 0,
        description: "",
        images: [],
        sizes: [],
        colors: [],
        isFeatured: false,
        isActive: true,
        isNew: true
      });
    }
    setIsModalOpen(true);
  };

  const toggleSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const addColor = (name: string, hex: string) => {
    if (!name || !hex) return;
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name, hex }]
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const toastId = toast.loading("Uploading image...");
    try {
      const url = await uploadProductImage(file);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
      toast.success("Image uploaded", { id: toastId });
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image", { id: toastId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || formData.price <= 0) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        ...formData,
        slug: formData.slug || slugify(formData.name),
        salePrice: formData.salePrice > 0 ? formData.salePrice : undefined
      };

      if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, data: productData });
      } else {
        addMutation.mutate(productData);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    updateMutation.mutate({ id: product.id, data: { isFeatured: !product.isFeatured } });
  };

  const handleToggleActive = async (product: Product) => {
    updateMutation.mutate({ id: product.id, data: { isActive: !product.isActive } });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchesStock = 
        selectedStock === 'all' || 
        (selectedStock === 'in' && (p.stockQuantity || 0) > 10) ||
        (selectedStock === 'low' && (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= 10) ||
        (selectedStock === 'out' && (p.stockQuantity || 0) <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, selectedStock]);

  const handleExport = () => {
    const exportData = filteredProducts.map(p => ({
      ID: p.id,
      Name: p.name,
      Category: p.category || 'Uncategorized',
      'Base Price': p.price,
      'Sale Price': p.salePrice || '-',
      Stock: p.stockQuantity,
      'Featured': p.isFeatured ? 'Yes' : 'No',
      'Active': p.isActive ? 'Yes' : 'No',
      'Created At': p.createdAt.toLocaleDateString()
    }));
    
    downloadCSV(exportData, 'everywear_products');
    toast.success(`Exported ${exportData.length} products`);
  };

  if (loading) return <AdminLoading variant="table" />;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-serif font-bold uppercase tracking-tight">Products</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manage your store inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none h-12 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none h-12 px-6 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-background border border-border rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-all"
            aria-label="Search products"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select 
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value as any)}
            className="w-full sm:w-auto h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
          >
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-background rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
        {filteredProducts.length === 0 ? (
          <AdminEmpty 
            title="No products found" 
            description={searchQuery ? "Try adjusting your search or filters" : "Get started by adding your first product"}
            icon={Package}
            action={!searchQuery ? { label: "Add Product", onClick: () => handleOpenModal() } : undefined}
          />
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-secondary/20 z-10">Product</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inventory</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status & Visibility</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/30 rounded-xl overflow-hidden shrink-0 border border-border/50 transition-transform group-hover:scale-105">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold truncate max-w-[200px]">{product.name}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">SKU: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">{product.category || "Uncategorized"}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold">৳{(product.price || 0).toLocaleString()}</p>
                        {product.salePrice && product.salePrice > 0 && (
                          <p className="text-[9px] text-muted-foreground line-through font-bold">৳{product.salePrice.toLocaleString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          (product.stockQuantity || 0) > 10 ? "bg-emerald-500" : (product.stockQuantity || 0) > 0 ? "bg-amber-500" : "bg-red-500"
                        )} />
                        <span className="text-xs font-bold">{product.stockQuantity || 0}</span>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                          {(product.stockQuantity || 0) > 10 ? "In Stock" : (product.stockQuantity || 0) > 0 ? "Low Stock" : "Out of Stock"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleActive(product)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                            product.isActive 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" 
                              : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                          )}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                        <button 
                          onClick={() => handleToggleFeatured(product)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                            product.isFeatured 
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20" 
                              : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                          )}
                        >
                          {product.isFeatured ? "Featured" : "Regular"}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-3 bg-secondary/30 hover:bg-yellow-500/20 hover:text-yellow-600 border border-transparent hover:border-yellow-500/30 transition-all rounded-xl active:scale-90"
                          aria-label="Edit product"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-3 bg-secondary/30 hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20 transition-all rounded-xl active:scale-90"
                          aria-label="Delete product"
                          title="Delete Product"
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

        {/* Pagination */}
        <div className="p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing {filteredProducts.length} of {products.length} products</p>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" disabled aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-[10px] font-black" aria-label="Page 1">1</button>
            <button className="w-10 h-10 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" disabled aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone and might affect existing orders."
        confirmLabel="Delete Product"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)} />
          <form 
            onSubmit={handleSubmit}
            className="relative w-full max-w-4xl bg-background rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
          >
            <div className="p-8 md:p-10 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-serif font-bold uppercase tracking-tight">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button 
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 md:p-10 overflow-y-auto no-scrollbar flex-grow space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Product Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData(prev => ({ 
                          ...prev, 
                          name,
                          slug: editingProduct ? prev.slug : slugify(name)
                        }));
                      }}
                      className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all" 
                      placeholder="e.g. Classic White Tee" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Slug (URL Path) *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm font-mono focus:outline-none focus:border-primary transition-all" 
                      placeholder="e.g. classic-white-tee" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Category *</label>
                    <select 
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Price (৳) *</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all" 
                        placeholder="0.00" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Stock Quantity *</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                        className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-all" 
                        placeholder="0" 
                      />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">Featured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">Active</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full h-32 bg-secondary/20 border border-border rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-primary transition-all" 
                      placeholder="Product details..."
                    ></textarea>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Available Sizes (Standard)</label>
                      <div className="flex flex-wrap gap-2">
                        {STANDARD_SIZES.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={cn(
                              "h-10 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                              formData.sizes.includes(size)
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-secondary/20 border-border text-muted-foreground hover:border-primary/50"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Product Colors</label>
                      <div className="flex flex-wrap gap-3">
                        {formData.colors.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-secondary/10 border border-border rounded-xl group pr-3">
                            <div className="w-5 h-5 rounded-lg border border-black/10 shadow-sm" style={{ backgroundColor: color.hex }} />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/80">{color.name}</span>
                            <button 
                              type="button" 
                              onClick={() => removeColor(idx)}
                              className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <input 
                            type="color" 
                            className="w-10 h-10 rounded-xl bg-transparent border border-border cursor-pointer p-1 shrink-0"
                            ref={colorInputRef}
                            defaultValue="#000000"
                          />
                          <input 
                            type="text"
                            placeholder="Color Name"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            className="h-10 px-3 bg-secondary/10 border border-border rounded-xl text-[9px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary transition-all w-28"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (!newColorName.trim()) {
                                toast.error("Please enter a color name");
                                return;
                              }
                              const hex = colorInputRef.current?.value || "#000000";
                              addColor(newColorName.trim(), hex);
                              setNewColorName("");
                            }}
                            className="h-10 px-4 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Images</label>
                    <div className="grid grid-cols-4 gap-3">
                      {formData.images.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                          <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square bg-secondary/20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center hover:bg-secondary transition-all cursor-pointer">
                        <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 md:p-10 border-t border-border flex justify-end gap-4 shrink-0">
              <button 
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)} 
                className="px-8 py-4 border-2 border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="px-10 py-4 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95 shadow-lg"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                {editingProduct ? "Update Product" : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminProducts() {
  return (
    <AdminErrorBoundary>
      <AdminProductsContent />
    </AdminErrorBoundary>
  );
}
