import { motion } from "motion/react";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/utils/utils";

const faqs = [
  {
    question: "Where are your garments made?",
    answer: "Our collections are designed in our New York studio and crafted by master artisans in Italy and Japan who specialize in sustainable production and high-end tailoring."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location and will be calculated at checkout."
  },
  {
    question: "How should I care for my EVERYWEAR pieces?",
    answer: "Most of our items are made from delicate, high-quality fabrics. We recommend professional dry cleaning for all tailored pieces. For knitwear, hand wash cold and lay flat to dry."
  },
  {
    question: "Can I cancel or modify my order?",
    answer: "Orders can be modified or cancelled within 2 hours of placement. After this time, we may have already begun processing your shipment."
  },
  {
    question: "Are your materials sustainably sourced?",
    answer: "Sustainability is at the core of EVERYWEAR. We exclusively use certified organic cotton, recycled wool, and eco-friendly dyes in our production process."
  }
];

function FAQItem({ faq, index }: { faq: typeof faqs[0], index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border-b border-border/50"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left group"
      >
        <span className="text-sm md:text-base font-serif font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
          {faq.question}
        </span>
        {isOpen ? <Minus className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-40 pb-6" : "max-h-0"
      )}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {faq.answer}
        </p>
      </div>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <div className="bg-background selection:bg-primary selection:text-primary-foreground min-h-screen pt-24 pb-32">
      <div className="section-container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">Support</span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight">Frequently Asked Questions</h1>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))}
          </div>

          <div className="pt-12 text-center">
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-4">Still have questions?</p>
            <a 
              href="/contact" 
              className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors border-b-2 border-primary/20 hover:border-foreground pb-1"
            >
              Contact Our Support Team
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
