import { Link } from "wouter";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
      <div className="relative max-w-md w-full space-y-8">
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <span className="text-[200px] font-serif font-bold text-foreground/[0.03] select-none">404</span>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-serif font-bold">Page Not Found</h1>
          <p className="text-muted-foreground font-light leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Please check the URL or return to our homepage.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/" className="bg-foreground text-background px-10 py-4 text-xs font-semibold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all">
            Return Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
