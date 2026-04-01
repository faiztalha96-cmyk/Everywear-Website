import React, { useRef, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AppSettings } from "../../types";

interface InteractiveHeroProps {
  settings: AppSettings | null;
  theme: string;
}

const STATS = [
  { value: "500+", label: "Premium Pieces" },
  { value: "12K+",  label: "Happy Clients"  },
  { value: "100%",  label: "Authentic"       },
];

export const InteractiveHero: React.FC<InteractiveHeroProps> = ({ settings }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { scrollYProgress } = useScroll({
    container: typeof window !== "undefined"
      ? { current: document.documentElement }
      : undefined,
    offset: ["start start", "end start"],
  });

  const imageY   = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const fadeOut  = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const heroImage =
    settings?.hero?.backgroundImage ||
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop&q=85";

  // Smart title: use short lines from DB or a good default
  const rawTitle = settings?.hero?.title || "Quality Craftsmanship Meets Contemporary Design";
  const subtitle = settings?.hero?.subtitle ||
    "Discover premium fashion crafted for comfort, confidence, and everyday luxury.";

  const stagger = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.13, delayChildren: 0.3 } },
  };
  const item = {
    hidden:  { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div
      ref={heroRef}
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* ── FULL-BLEED BACKGROUND IMAGE with parallax ── */}
      <motion.div
        className="absolute inset-0 z-0"
        style={mounted ? { y: imageY, scale: 1.08 } : { scale: 1.08 }}
      >
        <img
          src={heroImage}
          alt="EVERYWEAR Collection"
          fetchPriority="high"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* ── GRADIENT OVERLAYS ── */}
      {/* Left-to-right: heavy dark on left for text, light on right to show image */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      {/* Top & bottom vignette */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      {/* ── CONTENT ── */}
      <div
        className="relative z-20 flex flex-col justify-center"
        style={{ minHeight: "100svh" }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 max-w-5xl space-y-7 md:space-y-9"
        >
          {/* Overline */}
          <motion.div variants={item} className="flex items-center gap-3">
            <span className="block w-7 h-px bg-white/60 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/70">
              New Collection · 2025
            </span>
          </motion.div>

          {/* ── HEADING ──
              Key fix: NOT uppercase (saves ~15-20% width per word),
              font-size uses vw so it scales with screen and never wraps badly,
              leading is tight for the editorial feel. */}
          <motion.h1
            variants={item}
            className="font-serif font-bold text-white leading-[1.08] tracking-tight"
            style={{ fontSize: "clamp(1.9rem, 3vw, 3.2rem)" }}
          >
            {rawTitle}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="text-white/65 text-sm md:text-base lg:text-lg font-medium leading-relaxed tracking-wide max-w-lg"
          >
            {subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="flex flex-wrap gap-4 pt-1">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-black text-[10px] font-black uppercase tracking-[0.35em] hover:bg-white/90 transition-all duration-300 active:scale-95"
            >
              Shop Now
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 border border-white/40 text-white text-[10px] font-black uppercase tracking-[0.35em] hover:border-white/80 hover:bg-white/10 transition-all duration-300 active:scale-95"
            >
              Explore
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={item}
            className="flex flex-wrap gap-10 pt-4 border-t border-white/15"
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
                  {s.value}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── FREE SHIPPING BADGE ── */}
      <motion.div
        className="absolute bottom-10 right-8 z-30 hidden lg:block bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.7, ease: "easeOut" }}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.45em] text-white/60">
          Free Shipping
        </p>
        <p className="text-sm font-serif font-bold text-white mt-0.5">
          On orders over ৳10,000
        </p>
      </motion.div>

      {/* ── SCROLL INDICATOR ── */}
      <motion.div
        style={mounted ? { opacity: fadeOut } : { opacity: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 hidden md:flex flex-col items-center gap-1.5"
      >
        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        </motion.div>
      </motion.div>
    </div>
  );
};
