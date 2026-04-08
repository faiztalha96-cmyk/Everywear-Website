import React, { useRef, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { AppSettings } from "../../types";

interface InteractiveHeroProps {
  settings: AppSettings | null;
  settingsLoading?: boolean;
  theme: string;
}

const STATS = [
  { value: "500+", label: "Premium Pieces" },
  { value: "12K+",  label: "Happy Clients"  },
  { value: "100%",  label: "Authentic"       },
];

export const InteractiveHero: React.FC<InteractiveHeroProps> = ({ settings, settingsLoading }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Only show content once both the image AND settings data have loaded
  // This prevents the fallback text from flashing before the admin-configured text arrives
  const contentReady = imgLoaded && !settingsLoading;

  useEffect(() => { 
    setMounted(true); 
    // Fallback timer to prevent infinite loading shimmer if image onLoad fails
    const timer = setTimeout(() => setImgLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    container: typeof window !== "undefined"
      ? { current: document.documentElement }
      : undefined,
    offset: ["start start", "end start"],
  });

  const fadeOut  = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Premium Local Fallback Image (updated to the high-end t-shirt collection)
  const heroImage = "/assets/images/hero-premium.png";

  const rawTitle = settings?.hero?.title || "Quality Craftsmanship Meets Contemporary Design";
  const subtitle = settings?.hero?.subtitle || "Discover premium fashion crafted for comfort, confidence, and everyday luxury.";

  // Staggered word animation variants
  const wordVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } }
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } }
  };
  
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } }
  };

  return (
    <div ref={heroRef} className="relative w-full overflow-hidden bg-black" style={{ minHeight: "100svh" }}>
      
      {/* ── PREMIUM LOADING SHIMMER ── */}
      <AnimatePresence>
        {!contentReady && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black"
          >
            <div className="relative w-64 h-[1px] bg-white/10 overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-white/40"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute mt-8 text-[8px] font-black uppercase tracking-[1em] text-white/40"
            >
              Loading Experience
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BACKGROUND IMAGE with Ken Burns and Reveal ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={heroImage}
          initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          animate={{ 
            opacity: contentReady ? 1 : 0, 
            scale: contentReady ? 1.05 : 1.1,
            filter: contentReady ? "blur(0px)" : "blur(10px)"
          }}
          transition={{ 
            opacity: { duration: 2, ease: "easeInOut" },
            scale: { duration: 2, ease: "easeOut" },
            filter: { duration: 1.5, ease: "easeOut" }
          }}
          className="absolute inset-0 z-0"
        >
          <motion.div
            animate={{ scale: [1, 1.1] }}
            transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            className="w-full h-full"
          >
            <img
              src={heroImage}
              alt="EVERYWEAR Collection"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
              fetchPriority="high"
              className="w-full h-full object-cover object-center sm:object-[center_20%]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      
      {/* ── LUXURY VIGNETTE GRADIENTS ── */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/40 to-black/10 mix-blend-multiply" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-transparent to-black/40" />

      {/* ── CONTENT ── */}
      <div className="relative z-20 flex flex-col justify-center" style={{ minHeight: "100svh" }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 max-w-5xl z-20"
        >
          {/* Overline */}
          <motion.div variants={fadeUpVariant} className="flex items-center gap-4 mb-8">
            <span className="block w-10 h-[1px] bg-white/80 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/90">
              New Collection · 2026
            </span>
          </motion.div>

          {/* ── STAGGERED HEADING ── */}
          <motion.h1 
            className="font-serif font-bold text-white leading-[1.05] tracking-tight flex flex-wrap gap-x-4 gap-y-2 mb-10"
            style={{ fontSize: "clamp(2rem, 4vw, 4.5rem)" }}
          >
            {rawTitle.split(" ").map((word, idx) => (
              <motion.span key={idx} variants={wordVariants} className="inline-block overflow-hidden pb-1">
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUpVariant}
            className="text-white/70 text-sm md:text-base lg:text-lg font-medium leading-relaxed tracking-wide max-w-lg border-l-2 border-white/20 pl-6 mb-12"
          >
            {subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-start gap-4 mb-16">
            <Link
              href="/shop"
              className="group relative flex items-center justify-center gap-3 px-8 py-3.5 bg-white text-black text-[9px] font-bold uppercase tracking-[0.3em] overflow-hidden rounded-sm"
            >
              <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10">Shop The Look</span>
              <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="/about"
              className="flex items-center justify-center gap-3 px-8 py-3.5 border border-white/20 text-white text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white/40 transition-all duration-300 rounded-sm"
            >
              Discover
            </Link>
          </motion.div>

          {/* Glassmorphism Stats */}
          <motion.div
            variants={fadeUpVariant}
            className="flex flex-wrap gap-8 md:gap-14 pt-8 border-t border-white/10"
          >
            {STATS.map((s) => (
              <div key={s.label} className="relative group">
                <p className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
                  {s.value}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mt-2 flex items-center gap-2">
                  <span className="w-2 h-[1px] bg-white/30 group-hover:w-4 transition-all" />
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── GLASSMORPHISM FREE SHIPPING BADGE ── */}
      <motion.div
        className="absolute bottom-10 right-8 z-30 hidden lg:flex items-center gap-5 bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-2xl shadow-2xl"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6, duration: 0.8, ease: "easeOut" }}
      >
        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
           <ArrowRight className="w-4 h-4 text-white -rotate-45" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.45em] text-white/60">
            Complimentary Transit
          </p>
          <p className="text-sm font-serif font-bold text-white mt-1">
            For orders over ৳10,000
          </p>
        </div>
      </motion.div>

      {/* ── SCROLL INDICATOR ── */}
      <motion.div
        style={mounted ? { opacity: fadeOut } : { opacity: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 hidden md:flex flex-col items-center gap-3"
      >
        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/50" style={{ writingMode: 'vertical-rl' }}>
          Explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </motion.div>
    </div>
  );
};

