import { motion } from "motion/react";

export default function Returns() {
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
            <h1 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight">Returns & Exchanges</h1>
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">1. Return Window</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you're not completely satisfied with your purchase, you may return it within 14 days from the date of delivery for a full refund or an exchange.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">2. Requirements for Return</h2>
              <p className="text-muted-foreground leading-relaxed">
                Items must be returned in their original condition: unworn, unwashed, and with all tags attached. Returns that do not meet these criteria will not be accepted.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">3. Return Process</h2>
              <p className="text-muted-foreground leading-relaxed">
                To initiate a return, please contact our support team at <span className="font-bold text-foreground underline decoration-primary">returns@everywear.com</span> with your order number and the reason for the return. We will provide instructions for shipping the item back to our facility.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">4. Refund & Timing</h2>
              <p className="text-muted-foreground leading-relaxed">
                Once we receive and inspect your item, we will process your refund back to the original payment method within 5-7 business days. It may take longer for the credit to appear on your bank statement, depending on your financial institution.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
