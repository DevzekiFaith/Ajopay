"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Github,
  Heart,
  ArrowUp,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { contactInfo, companyInfo } from "@/lib/contact-info";
import { AjoPaySpinnerCompact } from "@/components/ui/AjoPaySpinner";

export function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubscribing(true);
    
    try {
      // Call the newsletter subscription API
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold">Welcome to the AjoPay Family! 🎉</div>
              <div className="text-sm opacity-80">You'll receive updates about our latest features and African success stories</div>
            </div>
          </div>,
          {
            duration: 5000,
            className: "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20",
          }
        );
        
        setEmail("");
      } else {
        toast.error(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const footerLinks = {
    "Our Services": [
      { name: "Digital Wallet", href: "/wallet/ngn" },
      { name: "Savings Circles", href: "/dashboard" },
      { name: "Commission Rewards", href: "/dashboard" },
      { name: "Crypto Trading", href: "/wallet/crypto" }
    ],
    "Community": [
      { name: "About AjoPay", href: "/about" },
      { name: "Contact Us", href: "/contact" },
      { name: "Success Stories", href: "/stories" },
      { name: "Learn More", href: "/learn-more" }
    ],
    "Support": [
      { name: "Help Center", href: "/help" },
      { name: "FAQ", href: "/faq" },
      { name: "Live Chat", href: "/chat" },
      { name: "System Status", href: "/status" }
    ],
    "Legal": [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Security", href: "/security" },
      { name: "Compliance", href: "/compliance" }
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: contactInfo.social.twitter, label: "Twitter" },
    { icon: Linkedin, href: contactInfo.social.linkedin, label: "LinkedIn" },
    { icon: Github, href: contactInfo.social.github, label: "GitHub" }
  ];

  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-amber-900/50 to-transparent dark:from-[#0a0218] dark:via-[#1a0b2e]/50 dark:to-transparent" />

      {/* Animated background orbs */}
      <motion.div
        className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -bottom-16 -right-32 h-80 w-80 rounded-full bg-gradient-to-tl from-orange-400/15 to-red-400/10 blur-3xl"
        animate={{
          scale: [1.1, 0.9, 1.1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      <div className="relative">
        {/* Main footer content */}
        <motion.div
          className="border-t border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
              {/* Company info */}
              <motion.div
                className="lg:col-span-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                    <Image
                      src="/aj1.png"
                      alt="AjoPay Logo"
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                    />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-white via-amber-200 to-orange-200 bg-clip-text text-transparent">
                    {companyInfo.name}
                  </span>
                </div>
                <p className="text-white/70 dark:text-white/70 leading-relaxed mb-6 max-w-sm">
                  {companyInfo.description}
                </p>

                {/* Contact info */}
                <div className="space-y-3">
                  <motion.a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors group cursor-pointer"
                    whileHover={{ x: 4 }}
                  >
                    <Mail className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                    <span className="text-sm">{contactInfo.email}</span>
                  </motion.a>
                  <motion.a
                    href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors group cursor-pointer"
                    whileHover={{ x: 4 }}
                  >
                    <Phone className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                    <span className="text-sm">{contactInfo.phoneFormatted}</span>
                  </motion.a>
                  <motion.div
                    className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors group cursor-pointer"
                    whileHover={{ x: 4 }}
                  >
                    <MapPin className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                    <span className="text-sm">{contactInfo.address}</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Footer links */}
              {Object.entries(footerLinks).map(([category, links], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-4 capitalize">
                    {category}
                  </h3>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-white/60 hover:text-white/90 text-sm transition-colors hover:translate-x-1 inline-block duration-200"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Social links and newsletter */}
            <motion.div
              className="mt-12 pt-8 border-t border-white/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                {/* Social links */}
                <div className="flex items-center gap-4">
                  <span className="text-white/60 text-sm mr-2">Follow us:</span>
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-xl transition-all duration-300 group"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={social.label}
                    >
                      <social.icon className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                    </motion.a>
                  ))}
                </div>

                {/* Newsletter signup */}
                <motion.form
                  onSubmit={handleNewsletterSubscribe}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Join our African family"
                    className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                    disabled={isSubscribing}
                  />
                  <motion.button
                    type="submit"
                    disabled={isSubscribing}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    whileHover={{ scale: isSubscribing ? 1 : 1.05 }}
                    whileTap={{ scale: isSubscribing ? 1 : 0.95 }}
                  >
                    {isSubscribing ? (
                      <>
                        <AjoPaySpinnerCompact size="sm" className="text-white" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Join Us
                      </>
                    )}
                  </motion.button>
                </motion.form>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="border-t border-white/10 bg-white/5 dark:bg-black/30 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <span>© 2025 {companyInfo.name}. Made with</span>
                <motion.div
                  animate={{ scale: [1, 1.2] }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <Heart className="w-4 h-4 text-red-400 fill-current" />
                </motion.div>
                <span>in {companyInfo.location} 🇳🇬</span>
              </div>

              <div className="flex items-center gap-4 text-white/60 text-sm">
                <span>{companyInfo.tagline}</span>
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <span>{companyInfo.version}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll to top button */}
      <motion.button
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-2xl border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-lg transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        onClick={scrollToTop}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 text-white/70" />
      </motion.button>
    </footer>
  );
}
