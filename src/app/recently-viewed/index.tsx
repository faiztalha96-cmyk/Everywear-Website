import { Eye } from "lucide-react";
import { motion } from "motion/react";
import { ProductCard } from "../../components/shop/product-card";
import { useRecentlyViewed } from "../../hooks/use-recently-viewed";
import { Link } from "wouter";

export default function RecentlyViewed() {
  const { recent } = useRecentlyViewed();

  if (recent.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 bg-secondary flex items-center justify-center">
          <Eye className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold">No Browsing History</h1>
          <p className="text-muted-foreground font-light max-w-xs mx-auto">
            You haven't viewed any products recently. Start exploring our collection to see your history here.
          </p>
        </div>
        <Link href="/shop" className="bg-foreground text-background px-10 py-4 text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all">
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="section-container py-12 lg:py-20">
      <div className="space-y-12">
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl font-serif font-bold">Recently Viewed</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Your browsing history</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 xl:gap-10">
          {recent.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
