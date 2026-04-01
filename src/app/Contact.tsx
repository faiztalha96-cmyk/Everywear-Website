import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.subject) newErrors.subject = "Please select a subject";
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
          }
        ]);

      if (error) throw error;

      toast.success("Thank you! We'll get back to you within 24 hours.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email",
      value: "hello@everywear.com",
      description: "Our team will respond within 24 hours."
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: "Phone",
      value: "+1 (555) 123-4567",
      description: "Mon-Fri from 9am to 6pm."
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Address",
      value: "123 Fashion District, New York, NY 10012",
      description: "Visit our flagship showroom."
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Business Hours",
      value: "Mon – Fri, 9am – 6pm",
      description: "Closed on weekends and holidays."
    }
  ];

  return (
    <div className="bg-background min-h-screen selection:bg-primary selection:text-primary-foreground">
      {/* Hero Section */}
      <section className="relative h-[40dvh] sm:h-[50dvh] flex items-center justify-center bg-secondary/30 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
        
        <div className="section-container relative z-10 text-center space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-fluid-h1 font-serif font-bold tracking-tight mb-4 uppercase">Get in Touch</h1>
            <p className="text-muted-foreground text-sm sm:text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
              We'd love to hear from you. Whether you have a question about our collections or need assistance with an order, our team is here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 sm:py-32">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
            {/* Left Column - Contact Info */}
            <div className="lg:col-span-5 space-y-12 sm:space-y-16">
              <div className="space-y-8 sm:space-y-10">
                <h2 className="text-fluid-h2 font-serif font-bold uppercase tracking-widest">Contact Information</h2>
                <div className="grid grid-cols-1 gap-8 sm:gap-10">
                  {contactInfo.map((info, index) => (
                    <motion.div
                      key={info.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="flex gap-6 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                        {info.icon}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{info.title}</h3>
                        <p className="text-base sm:text-lg font-medium tracking-tight">{info.value}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-light uppercase tracking-widest">{info.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Socials */}
              <div className="pt-12 border-t border-border/50 space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Follow Our Journey</h3>
                <div className="flex flex-wrap gap-8">
                  {["Instagram", "Facebook", "Twitter", "Pinterest"].map((social) => (
                    <a 
                      key={social} 
                      href={`https://${social.toLowerCase()}.com/everywear`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-primary transition-colors duration-300 min-h-[44px] flex items-center"
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="bg-secondary/10 p-8 sm:p-12 border border-border/30 rounded-2xl shadow-xl"
              >
                <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Full Name*</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Alexander McQueen"
                        className={`w-full bg-transparent border-b-2 py-3 focus:border-primary outline-none transition-colors duration-300 placeholder:text-muted-foreground/30 text-sm font-light min-h-[44px] ${errors.name ? 'border-destructive' : 'border-border/50'}`}
                      />
                      {errors.name && <p className="text-[10px] text-destructive uppercase tracking-widest font-bold mt-1">{errors.name}</p>}
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Email Address*</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="alexander@luxury.com"
                        className={`w-full bg-transparent border-b-2 py-3 focus:border-primary outline-none transition-colors duration-300 placeholder:text-muted-foreground/30 text-sm font-light min-h-[44px] ${errors.email ? 'border-destructive' : 'border-border/50'}`}
                      />
                      {errors.email && <p className="text-[10px] text-destructive uppercase tracking-widest font-bold mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Subject*</label>
                    <div className="relative">
                      <select 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className={`w-full bg-transparent border-b-2 py-3 focus:border-primary outline-none transition-colors duration-300 appearance-none cursor-pointer text-sm font-light min-h-[44px] ${errors.subject ? 'border-destructive' : 'border-border/50'}`}
                      >
                        <option value="" disabled className="bg-background">Select a subject</option>
                        <option value="General Inquiry" className="bg-background">General Inquiry</option>
                        <option value="Order Support" className="bg-background">Order Support</option>
                        <option value="Returns & Exchanges" className="bg-background">Returns & Exchanges</option>
                        <option value="Wholesale" className="bg-background">Wholesale</option>
                        <option value="Press & Media" className="bg-background">Press & Media</option>
                        <option value="Other" className="bg-background">Other</option>
                      </select>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    {errors.subject && <p className="text-[10px] text-destructive uppercase tracking-widest font-bold mt-1">{errors.subject}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Message*</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Tell us more about your inquiry..."
                      className={`w-full bg-transparent border-b-2 py-3 focus:border-primary outline-none transition-colors duration-300 resize-none placeholder:text-muted-foreground/30 text-sm font-light ${errors.message ? 'border-destructive' : 'border-border/50'}`}
                    />
                    {errors.message && <p className="text-[10px] text-destructive uppercase tracking-widest font-bold mt-1">{errors.message}</p>}
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-foreground text-background py-5 uppercase tracking-[0.3em] text-[10px] font-black hover:bg-primary hover:text-white transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-4 min-h-[56px] rounded-xl shadow-lg shadow-foreground/10"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
