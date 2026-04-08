import { motion } from "motion/react";

export default function Shipping() {
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
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">Policy</span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight">Shipping Information</h1>
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">1. Global Delivery</h2>
              <p className="text-muted-foreground leading-relaxed">
                EVERYWEAR offers premium global shipping to over 50 countries. We partner with leading international couriers to ensure your order arrives safely and promptly.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">2. Shipping Rates</h2>
              <ul className="list-none space-y-2 text-muted-foreground p-0">
                <li className="flex justify-between border-b border-border/50 py-2">
                  <span>Standard Shipping (Local)</span>
                  <span className="font-bold text-foreground">৳200</span>
                </li>
                <li className="flex justify-between border-b border-border/50 py-2">
                  <span>Express Shipping (Local)</span>
                  <span className="font-bold text-foreground">৳500</span>
                </li>
                <li className="flex justify-between border-b border-border/50 py-2">
                  <span>International Shipping (Global)</span>
                  <span className="font-bold text-foreground">Calculated at Checkout</span>
                </li>
              </ul>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-4">
                Free standard shipping on orders over ৳10,000.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">3. Processing Times</h2>
              <p className="text-muted-foreground leading-relaxed">
                Orders are processed within 1-2 business days. During peak seasons or sale periods, processing may take up to 4 business days. You will receive a confirmation email with tracking details once your order has shipped.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">4. Tracking Your Order</h2>
              <p className="text-muted-foreground leading-relaxed">
                Once dispatched, you can track your shipment using the link provided in your shipping confirmation email. Please allow up to 24 hours for the tracking information to update.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
