import React from "react";
import { Package, Search, Plus } from "lucide-react";
import { cn } from "@/utils/utils";

interface AdminEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  className?: string;
}

export function AdminEmpty({ 
  title = "No data found", 
  description = "Try adjusting your filters or search query", 
  icon: Icon = Search,
  action,
  className 
}: AdminEmptyProps) {
  return (
    <div className={cn("py-32 text-center space-y-8 bg-background rounded-[3rem] border border-border", className)}>
      <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mx-auto">
        <Icon className="w-10 h-10 text-muted-foreground opacity-30" />
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-serif font-bold italic">{title}</p>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">{description}</p>
      </div>
      {action && (
        <button 
          onClick={action.onClick}
          className="h-14 px-10 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-3 mx-auto shadow-lg shadow-primary/10 active:scale-95"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
