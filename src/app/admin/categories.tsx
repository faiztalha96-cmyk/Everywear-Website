import { useState, useMemo } from "react";
import { useAuth } from "../../contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Layers, 
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowRight,
  Image as ImageIcon,
  XCircle,
  X
} from "lucide-react";
import { getCategories, deleteCategory, addCategory, updateCategory } from "../../lib/supabase-service";
import { Category } from "../../types";
import { cn } from "@/utils/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { AdminErrorBoundary } from "../../components/admin/admin-error-boundary";
import { AdminLoading } from "../../components/admin/admin-loading";
import { AdminEmpty } from "../../components/admin/admin-empty";
import { ConfirmationModal } from "../../components/admin/confirmation-modal";

function AdminCategoriesContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Queries
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getCategories
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success("Category created successfully");
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success("Category updated successfully");
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success("Category deleted successfully");
      setIsDeleteModalOpen(false);
    }
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    imageUrl: ""
  });

  // Handle Editing Category State Sync
  useMemo(() => {
    if (editingCategory && isModalOpen) {
      setFormData({
        name: editingCategory.name || "",
        slug: editingCategory.slug || "",
        imageUrl: editingCategory.imageUrl || ""
      });
    } else if (!editingCategory && isModalOpen) {
      setFormData({
        name: "",
        slug: "",
        imageUrl: ""
      });
    }
  }, [editingCategory, isModalOpen]);

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    deleteMutation.mutate(categoryToDelete);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, data: formData });
      } else {
        createMutation.mutate(formData as any);
      }
    } catch (err) {
      console.error("Form error:", err);
      toast.error(editingCategory ? "Failed to update category" : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    let result = categories.filter(c => 
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.slug || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" 
          ? (a.name || "").localeCompare(b.name || "")
          : (b.name || "").localeCompare(a.name || "");
      } else {
        return sortOrder === "asc"
          ? (a.productCount || 0) - (b.productCount || 0)
          : (b.productCount || 0) - (a.productCount || 0);
      }
    });

    return result;
  }, [categories, searchQuery, sortBy, sortOrder]);

  const toggleSort = (field: "name" | "count") => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    toast.success(`Sorting by ${field === 'name' ? 'category name' : 'product count'} (${sortOrder === 'asc' ? 'descending' : 'ascending'})`);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name)
    }));
  };

  if (isLoading) return <AdminLoading variant="table" />;

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Layers className="w-4 h-4" /> Organization
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold uppercase tracking-tight">Categories</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            Manage your product collections and organizational structure.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="h-14 px-8 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-background border border-border rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button 
          onClick={() => toggleSort(sortBy === 'name' ? 'count' : 'name')}
          className="h-14 px-6 bg-background border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Filter className="w-4 h-4" /> 
          Sort: {sortBy === 'name' ? 'Name' : 'Count'} ({sortOrder === 'asc' ? '↑' : '↓'})
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-background rounded-[3rem] border border-border overflow-hidden shadow-sm">
        {filteredCategories.length === 0 ? (
          <AdminEmpty 
            title="No categories found" 
            description={searchQuery ? "Try adjusting your search query" : "Start by creating your first product category"}
            icon={Layers}
            action={!searchQuery ? {
              label: "Add Category",
              onClick: () => {
                setEditingCategory(null);
                setIsModalOpen(true);
              }
            } : undefined}
          />
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-secondary/20">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-secondary/20 z-10">Category</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Slug</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Products</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-10 py-8 sticky left-0 bg-background group-hover:bg-secondary/10 z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-secondary/30 rounded-xl overflow-hidden shrink-0 border border-border/50 transition-transform group-hover:scale-105">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-bold truncate max-w-[250px]">{category.name}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <code className="text-[10px] bg-secondary/50 px-3 py-1.5 rounded-lg font-mono text-muted-foreground">
                        {category.slug}
                      </code>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2">
                        <Package className="w-3 h-3 text-primary" />
                        <span className="text-xs font-bold">{category.productCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingCategory(category);
                            setIsModalOpen(true);
                          }}
                          className="p-3 bg-secondary/30 hover:bg-yellow-500/20 hover:text-yellow-600 border border-transparent hover:border-yellow-500/30 transition-all rounded-xl active:scale-90"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)}
                          className="p-3 bg-secondary/30 hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20 transition-all rounded-xl active:scale-90"
                          title="Delete Category"
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
        <div className="p-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing {filteredCategories.length} of {categories.length} categories</p>
          <div className="flex items-center gap-2">
            <button className="w-12 h-12 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-[10px] font-black">1</button>
            <button className="w-12 h-12 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30" disabled>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This might affect products using it."
        confirmLabel="Delete Category"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-background rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-border flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">
                    {editingCategory ? "Edit Category" : "New Category"}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {editingCategory ? "Update existing category details" : "Create a new product collection"}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Category Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      disabled={isSubmitting}
                      className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-all" 
                      placeholder="e.g. Summer Collection" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Slug (URL Path)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      disabled={isSubmitting}
                      className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm font-mono text-muted-foreground focus:outline-none focus:border-primary transition-all" 
                      placeholder="e.g. summer-collection" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Image URL (Optional)</label>
                    <input 
                      type="url" 
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      disabled={isSubmitting}
                      className="w-full h-14 bg-secondary/20 border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-all" 
                      placeholder="https://images.unsplash.com/..." 
                    />
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)} 
                    disabled={isSubmitting}
                    className="flex-1 h-16 border-2 border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/20 transition-all disabled:opacity-50 active:scale-95"
                  >
                    Cancel
                  </button>
                   <button 
                    type="submit"
                    disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                    className="flex-1 h-16 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg active:scale-95"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingCategory ? "Update Category" : "Save Category"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminCategories() {
  return (
    <AdminErrorBoundary>
      <AdminCategoriesContent />
    </AdminErrorBoundary>
  );
}
