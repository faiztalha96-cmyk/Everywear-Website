import { motion } from "motion/react";

export default function Privacy() {
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
            <h1 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight">Privacy Policy</h1>
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                At EVERYWEAR, we are committed to protecting your privacy and ensuring your personal data is handled with care. This policy describes how we collect, use, and protect your information when you visit our website.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">2. Information Collection</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us: your name, email address, shipping address, and payment information. We also collect data about your browsing behavior on our site to improve your experience.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">3. How We Use Data</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is used to process your orders, communicate with you about your purchases, and send you marketing communications if you have opted in. We also use data to improve our products and services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement a variety of security measures to maintain the safety of your personal information. Your sensitive data is encrypted using Secure Socket Layer (SSL) technology and is only accessible by persons authorized with special access rights to such systems.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-foreground">5. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, update, or delete your personal information at any time. To exercise these rights, please contact our privacy officer at <span className="font-bold text-foreground">privacy@everywear.com</span>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
