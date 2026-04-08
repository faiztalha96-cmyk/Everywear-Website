import { motion } from "motion/react";

export default function Terms() {
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
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">Legal</span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight">Terms of Service</h1>
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using the EVERYWEAR website, you agree to be bound by these terms and conditions. If you do not agree to all of these terms, do not use this website.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">2. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The content on this website, including but not limited to the text, graphics, designs, and logos, is the property of EVERYWEAR and is protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">3. Product Descriptions</h2>
              <p className="text-muted-foreground leading-relaxed">
                We attempt to be as accurate as possible with our product descriptions and images. However, we do not warrant that product descriptions or other content of this site are accurate, complete, reliable, current, or error-free.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">4. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                EVERYWEAR will not be liable for any damages of any kind arising from the use of this site, including but not limited to direct, indirect, incidental, punitive, and consequential damages.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">5. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which EVERYWEAR is registered, without regard to its conflict of law principles.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
