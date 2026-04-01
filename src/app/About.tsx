import { motion } from "motion/react";
import { Link } from "wouter";
import { 
  Award, 
  Leaf, 
  Clock, 
  ArrowRight,
  User
} from "lucide-react";
import { cn } from "@/utils/utils";

export default function About() {
  const values = [
    {
      icon: <Award className="w-6 h-6" />,
      title: "Craftsmanship",
      description: "Every stitch tells a story of dedication and skill. We partner with master artisans to bring you pieces that are built to last a lifetime."
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Sustainability",
      description: "We are committed to ethical production and responsible sourcing. Our goal is to minimize our footprint while maximizing the beauty of our creations."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Timeless Style",
      description: "We ignore the fleeting nature of trends in favor of silhouettes that remain relevant. Elegance is not about being noticed, but about being remembered."
    }
  ];

  const team = [
    { name: "Sophia Chen", role: "Creative Director" },
    { name: "Marcus Thorne", role: "Head of Design" },
    { name: "Elena Rossi", role: "Master Tailor" }
  ];

  return (
    <div className="bg-background selection:bg-primary selection:text-primary-foreground">
      {/* 1. HERO SECTION */}
      <section className="relative h-[60dvh] sm:h-[70dvh] w-full overflow-hidden flex items-center justify-center bg-secondary/90">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=2400&h=1200&fit=crop&q=90" 
            alt="Luxury Background"
            className="w-full h-full object-cover opacity-40 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center px-6 max-w-4xl"
        >
          <span className="text-white/70 text-[10px] font-bold uppercase tracking-[0.5em] mb-4 sm:mb-6 block">Our Heritage</span>
          <h1 className="text-fluid-h1 font-serif font-bold text-white tracking-tight leading-[0.9] mb-6 sm:mb-8 uppercase">
            Our Story
          </h1>
          <p className="text-white/80 text-sm sm:text-lg md:text-xl font-light leading-relaxed tracking-wide max-w-2xl mx-auto">
            A journey through elegance, defined by the pursuit of perfection and the celebration of timeless craftsmanship.
          </p>
        </motion.div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* 2. BRAND STORY SECTION */}
      <section className="py-20 sm:py-32 md:py-40">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] bg-secondary/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=1500&fit=crop&q=90" 
                alt="Brand Story"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            <div className="space-y-8 sm:space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <span className="text-primary text-[10px] font-bold uppercase tracking-[0.4em]">The Vision</span>
                <h2 className="text-fluid-h2 font-serif font-bold leading-tight tracking-tight uppercase">
                  Elegance in Every <br className="hidden sm:block" /> Detail.
                </h2>
                <div className="space-y-6 text-muted-foreground text-sm sm:text-base md:text-lg font-light leading-relaxed tracking-wide">
                  <p>
                    Founded on the principles of timeless elegance and uncompromising quality, our brand was born from a desire to redefine the modern wardrobe. We believe that true luxury is not found in excess, but in the careful curation of essentials that speak to the soul.
                  </p>
                  <p>
                    Our artisans combine generational techniques with modern innovation, ensuring that every garment is a masterpiece of form and function. We source only the finest materials from around the globe, honoring the heritage of each fiber.
                  </p>
                  <p className="hidden sm:block">
                    We believe in fashion that transcends trends, focusing on the enduring power of style. Our collections are designed for those who appreciate the subtle nuances of a well-crafted silhouette and the confidence that comes from wearing something truly exceptional.
                  </p>
                  <p className="hidden md:block">
                    Every piece is a testament to our vision of a more refined, conscious wardrobe—one where quality always takes precedence over quantity, and where beauty is found in simplicity.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VALUES SECTION */}
      <section className="py-20 sm:py-32 md:py-40 bg-secondary/20">
        <div className="section-container">
          <div className="text-center mb-12 sm:mb-20 space-y-4">
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.4em]">Our Core</span>
            <h2 className="text-fluid-h2 font-serif font-bold tracking-tight uppercase">What We Stand For</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="p-8 sm:p-10 bg-background border border-border/50 hover:border-primary/30 transition-all duration-500 group rounded-2xl shadow-sm hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-secondary flex items-center justify-center mb-6 sm:mb-8 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500 rounded-xl">
                  {value.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold mb-4 tracking-tight uppercase">{value.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed tracking-wide">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TEAM SECTION */}
      <section className="py-20 sm:py-32 md:py-40">
        <div className="section-container">
          <div className="text-center mb-12 sm:mb-20 space-y-4">
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.4em]">The Minds</span>
            <h2 className="text-fluid-h2 font-serif font-bold tracking-tight uppercase">Our Creative Team</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 sm:gap-16">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-secondary/50 overflow-hidden border border-border/50 shadow-inner">
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                    <User className="w-16 h-16 sm:w-20 sm:h-20" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg sm:text-xl font-serif font-bold tracking-tight uppercase">{member.name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="relative py-24 sm:py-32 md:py-48 overflow-hidden bg-secondary">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=2400&h=1200&fit=crop&q=90" 
            alt="CTA Background"
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="section-container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="max-w-4xl mx-auto space-y-8 sm:space-y-10"
          >
            <h2 className="text-fluid-h1 font-serif font-bold text-white tracking-tight leading-tight uppercase">
              Discover the <br className="hidden sm:block" /> Collection
            </h2>
            <p className="text-white/60 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
              Experience the pinnacle of luxury fashion. Explore our latest arrivals and find your next timeless piece.
            </p>
            <Link href="/shop" className="group relative inline-flex items-center gap-4 bg-white text-black px-12 sm:px-16 py-5 sm:py-6 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all duration-500 min-h-[56px]">
              Shop Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
