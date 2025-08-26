"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-48px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-purple-50 to-white dark:from-[#0a0218] dark:to-[#0b0614]">
      {/* Decorative blurred orbs with slow float */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
      />

      <main className="relative w-full max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          className="relative mx-auto rounded-3xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl p-6 sm:p-10 md:p-12 shadow-[8px_8px_24px_rgba(0,0,0,0.35),_-8px_-8px_24px_rgba(255,255,255,0.06)]"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* subtle sheen */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_40%,transparent_60%)]">
            <div className="absolute -top-10 left-0 right-0 h-32 bg-gradient-to-b from-white/30 to-transparent dark:from-white/6" />
          </div>
          <motion.h1
            className="text-center text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-700 to-violet-500 dark:from-violet-200 dark:to-fuchsia-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
          >
            Thriftly
          </motion.h1>
          <motion.p
            className="text-center mt-3 text-base sm:text-lg text-neutral-700 dark:text-neutral-300"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
          >
            Save small. Grow Big.
          </motion.p>

          {/* Content grid with hero image */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              className="order-2 md:order-1 text-center md:text-left"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row gap-3 md:justify-start justify-center">
                <motion.a
                  whileTap={{ scale: 0.98 }}
                  className="px-5 h-12 sm:h-11 inline-flex items-center justify-center rounded-xl bg-purple-700 text-white hover:bg-purple-800 shadow-sm"
                  href="/sign-in"
                >
                  Sign in
                </motion.a>
                <motion.a
                  whileTap={{ scale: 0.98 }}
                  className="px-5 h-12 sm:h-11 inline-flex items-center justify-center rounded-xl border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 text-purple-900 dark:text-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  href="/sign-in"
                >
                  Open dashboard →
                </motion.a>
              </div>
              <motion.div
                className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left"
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } }}
              >
                {["Customers", "Agents"].map((title, idx) => (
                  <motion.div
                    key={title}
                    className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 p-4 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)] dark:shadow-[6px_6px_20px_rgba(0,0,0,0.5),_-6px_-6px_20px_rgba(255,255,255,0.1)]"
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20, mass: 0.6 }}
                  >
                    <h3 className="font-medium text-purple-800 dark:text-white">{title}</h3>
                    <p className="text-sm text-purple-900/70 dark:text-white/70 mt-1">
                      {idx === 0 && "Mark daily ₦200+ contributions. Track wallet and streaks."}
                      {idx === 1 && "Create customers, record cash, and manage your cluster."}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="order-1 md:order-2 relative w-full h-72 sm:h-80 md:h-full"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.5 }}
            >
              <Image
                src="/aj1.png"
                alt="Ajopay savings illustration"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-contain drop-shadow-2xl"
                priority
              />
            </motion.div>
          </div>

          {/* Keep Admin note below */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 p-4 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)] text-left">
              <h3 className="font-medium text-purple-800 dark:text-white">Admins</h3>
              <p className="text-sm text-purple-900/70 dark:text-white/70 mt-1">Cluster totals, CSV export, alerts. Minimal and fast.</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
