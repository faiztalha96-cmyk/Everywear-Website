import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-background rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  variant === "danger" ? "bg-red-500/10 text-red-500" :
                  variant === "warning" ? "bg-amber-500/10 text-amber-500" :
                  "bg-blue-500/10 text-blue-500"
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-serif font-bold uppercase tracking-tight">{title}</h2>
              </div>
              <button 
                onClick={onClose} 
                disabled={isLoading}
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={onClose} 
                  disabled={isLoading}
                  className="flex-1 h-12 border-2 border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50 active:scale-95"
                >
                  {cancelLabel}
                </button>
                <button 
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg active:scale-95 ${
                    variant === "danger" ? "bg-red-500 text-white hover:bg-red-600" :
                    variant === "warning" ? "bg-amber-500 text-black hover:bg-amber-600" :
                    "bg-foreground text-background hover:bg-yellow-500 hover:text-black"
                  }`}
                >
                  {isLoading ? "Processing..." : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
