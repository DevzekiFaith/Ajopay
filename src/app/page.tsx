"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-48px)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-[#0a0218] dark:via-[#1a0b2e] dark:to-[#0b0614]">
      {/* Enhanced animated background orbs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-violet-400/40 to-fuchsia-400/20 blur-3xl"
        initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
        animate={{ 
          opacity: [0.3, 0.6, 0.3], 
          scale: [0.8, 1.1, 0.8],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-fuchsia-400/30 to-purple-400/15 blur-3xl"
        initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
        animate={{ 
          opacity: [0.2, 0.5, 0.2], 
          scale: [0.9, 1.2, 0.9],
          rotate: [0, -180, -360]
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-400/10 blur-2xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0.1, 0.3, 0.1], 
          scale: [0.5, 1.3, 0.5]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 5
        }}
      />

      <main className="relative w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          className="relative mx-auto rounded-3xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-3xl p-8 sm:p-12 md:p-16 shadow-[0_8px_32px_rgba(0,0,0,0.3),_0_0_0_1px_rgba(255,255,255,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),_0_0_0_1px_rgba(255,255,255,0.05),_inset_0_1px_0_rgba(255,255,255,0.1)]"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
        >
          {/* Enhanced glass reflection effect */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute -top-16 left-0 right-0 h-32 bg-gradient-to-b from-white/30 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_40%,transparent_70%)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent dark:from-transparent dark:via-white/2 dark:to-transparent" />
          </div>

          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.h1
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-fuchsia-200 dark:from-violet-200 dark:via-white dark:to-fuchsia-300 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              Thriftly
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl lg:text-2xl text-white/80 dark:text-neutral-300 font-medium"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Save small. Grow Big.
            </motion.p>
          </motion.div>

          {/* Enhanced content grid */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="order-2 lg:order-1 text-center lg:text-left space-y-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <div className="flex flex-col sm:flex-row gap-4 lg:justify-start justify-center">
                <motion.a
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold shadow-[0_8px_24px_rgba(147,51,234,0.4)] hover:shadow-[0_12px_32px_rgba(147,51,234,0.6)] transition-all duration-300"
                  href="/sign-in"
                >
                  <span className="relative z-10">Sign in</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 inline-flex items-center justify-center rounded-2xl border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-xl text-white font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
                  href="/sign-in"
                >
                  Open dashboard →
                </motion.a>
              </div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                initial="hidden"
                animate="show"
                variants={{ 
                  hidden: { opacity: 0 }, 
                  show: { 
                    opacity: 1, 
                    transition: { 
                      staggerChildren: 0.1,
                      delayChildren: 0.6
                    } 
                  } 
                }}
              >
                {[
                  { title: "Customers", desc: "Mark daily ₦200+ contributions. Track wallet and streaks.", icon: "👥" },
                  { title: "Agents", desc: "Create customers, record cash, and manage your cluster.", icon: "🏢" }
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    className="group rounded-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-300"
                    variants={{ 
                      hidden: { opacity: 0, y: 20, scale: 0.9 }, 
                      show: { opacity: 1, y: 0, scale: 1 } 
                    }}
                    whileHover={{ 
                      y: -4, 
                      scale: 1.02,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{item.icon}</span>
                      <h3 className="font-semibold text-white dark:text-white text-lg">{item.title}</h3>
                    </div>
                    <p className="text-white/70 dark:text-white/70 leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="order-1 lg:order-2 relative"
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="relative w-full h-80 sm:h-96 lg:h-[28rem]">
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 blur-2xl"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
                <Image
                  src="/aj1.png"
                  alt="Ajopay savings illustration"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain drop-shadow-2xl relative z-10"
                  priority
                />
              </div>
            </motion.div>
          </div>

          {/* Enhanced admin section */}
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚡</span>
                <h3 className="font-semibold text-white dark:text-white text-xl">Admins</h3>
              </div>
              <p className="text-white/70 dark:text-white/70 text-lg leading-relaxed">
                Cluster totals, CSV export, alerts. Minimal and fast.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
