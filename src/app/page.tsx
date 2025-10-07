"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const [showNewUserMessage, setShowNewUserMessage] = useState(false);

  useEffect(() => {
    // Check if this is a new user
    if (searchParams.get('newUser') === 'true') {
      setShowNewUserMessage(true);
      // Remove the parameter from URL after showing message
      const url = new URL(window.location.href);
      url.searchParams.delete('newUser');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* African-inspired background elements */}
      <motion.div
        aria-hidden
        className="absolute top-20 right-20 h-40 w-40 rounded-full bg-gradient-to-r from-orange-300/40 to-red-300/30 dark:from-orange-600/20 dark:to-red-600/15 blur-2xl"
        animate={reduceMotion ? undefined : {
          y: [0, -30, 0],
          x: [0, 15, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 5, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-32 left-16 h-32 w-32 rounded-full bg-gradient-to-r from-yellow-300/35 to-orange-300/25 dark:from-yellow-600/15 dark:to-orange-600/10 blur-2xl"
        animate={reduceMotion ? undefined : {
          y: [0, 20, 0],
          x: [0, -15, 0],
          scale: [1, 0.8, 1],
          rotate: [0, -5, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/2 left-1/4 h-20 w-20 rounded-full bg-gradient-to-r from-red-300/30 to-orange-300/20 dark:from-red-600/15 dark:to-orange-600/10 blur-xl"
        animate={reduceMotion ? undefined : {
          y: [0, -15, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Additional African-inspired shapes */}
      <motion.div
        aria-hidden
        className="absolute top-1/3 right-1/3 h-16 w-24 rounded-full bg-gradient-to-r from-yellow-200/25 to-orange-200/15 blur-lg"
        animate={reduceMotion ? undefined : {
          y: [0, 10, 0],
          x: [0, -10, 0],
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/4 right-1/4 h-12 w-20 rounded-full bg-gradient-to-r from-red-300/20 to-yellow-300/15 blur-lg"
        animate={reduceMotion ? undefined : {
          y: [0, -8, 0],
          x: [0, 12, 0],
          scale: [1, 1.3, 1]
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-2 sm:px-4 py-12 sm:py-16 md:py-20">
        {/* Enhanced Hero Section with African Images */}
        <div className="w-full max-w-7xl mx-auto mb-8 sm:mb-12 md:mb-16 px-2 sm:px-4">
          {/* Main Hero with A3.jpg Background */}
        <motion.div
            className="relative w-full h-64 sm:h-80 md:h-[500px] lg:h-[600px] xl:h-[700px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <Image
              src="/A3.jpg"
              alt="African excellence and cultural wealth building"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Glassmorphism Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 sm:p-6 md:p-8">
              <motion.div
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.3)] max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2, duration: 0.8 }}
                   >
                <motion.h1
                  className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight mb-3 sm:mb-4 md:mb-6 leading-none"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.4, duration: 0.8 }}
                   >
                  <span className="bg-gradient-to-r from-orange-300 via-yellow-300 to-red-300 bg-clip-text text-transparent">
                    AjoPay
                  </span>
                </motion.h1>

          <motion.div
                  className="mb-4 sm:mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 text-white">
                    Build Your Empire
                  </p>
                  <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-orange-200 font-semibold">
                    Start with ₦200, Rise to Greatness
                  </p>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
          >
                     <motion.a
                    href="/sign-in?mode=signup"
                    className="group relative inline-block px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 md:py-6 bg-gradient-to-r from-orange-500/90 to-red-600/90 backdrop-blur-sm rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl shadow-2xl hover:shadow-orange-900/30 transition-all duration-300 border border-orange-400/30 w-full sm:w-auto"
                    whileHover={{ scale: 1.05, y: -3 }}
                       whileTap={{ scale: 0.95 }}
                     >
                    <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                      Start Your Journey
                      <motion.span
                        className="text-lg sm:text-xl"
                        animate={{ x: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                     </motion.a>

                     <motion.a
                       href="/sign-in?redirectTo=/customer"
                    className="group relative inline-block px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 md:py-6 bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto"
                    whileHover={{ scale: 1.05, y: -3 }}
                       whileTap={{ scale: 0.95 }}
                     >
                    <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                      Enter Dashboard
                      <motion.span
                        className="text-lg sm:text-xl"
                        animate={{ x: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        →
                      </motion.span>
                    </span>
                     </motion.a>
                </motion.div>

                {/* New User Welcome Message */}
                {showNewUserMessage && (
                  <motion.div
                    className="mt-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-400/30 rounded-2xl shadow-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-green-800 mb-2">
                        Welcome to AjoPay! 🎉
                      </h3>
                      <p className="text-green-700 font-medium mb-4">
                        Your account has been created successfully. Choose your plan below to start building your financial empire.
                      </p>
                      <div className="flex justify-center">
                        <motion.button
                          onClick={() => setShowNewUserMessage(false)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Got it!
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Supporting African Images Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* A4.jpg - Innovation */}
            <motion.div
              className="relative h-48 sm:h-56 md:h-64 lg:h-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Image
                src="/A4.jpg"
                alt="Modern African innovation and technology"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/30 backdrop-blur-sm rounded-full flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <h3 className="text-xl font-bold">Tech Innovation</h3>
                </div>
                <p className="text-sm text-blue-200">Modern solutions for digital age</p>
              </div>
        </motion.div>

            {/* l1.jpg - Vision */}
        <motion.div
              className="relative h-48 sm:h-56 md:h-64 lg:h-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
            <Image
                src="/l1.jpg"
                alt="African success and prosperity vision"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/30 backdrop-blur-sm rounded-full flex items-center justify-center text-xl">
                    👁️
                  </div>
                  <h3 className="text-xl font-bold">Future Vision</h3>
                </div>
                <p className="text-sm text-purple-200">See beyond limits</p>
          </div>
        </motion.div>

            {/* fl9.jpg - Heritage */}
            <motion.div
              className="relative h-48 sm:h-56 md:h-64 lg:h-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl group sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Image
                src="/fl9.jpg"
                alt="African cultural heritage and traditional wealth building"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500/30 backdrop-blur-sm rounded-full flex items-center justify-center text-xl">
                    👑
                  </div>
                  <h3 className="text-xl font-bold">Heritage</h3>
                </div>
                <p className="text-sm text-orange-200">Cultural wealth building</p>
              </div>
            </motion.div>
          </div>
        </div>



        {/* Enhanced Key Features */}
        <motion.div
          className="max-w-7xl mx-auto mb-12 sm:mb-16 md:mb-24 px-2 sm:px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-3 md:mb-4">
              Why <span className="text-orange-600 dark:text-orange-400">AjoPay</span>?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg">
              Powerful. Revolutionary. African.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
            {[
              {
                icon: "💰",
                title: "Start Your Empire",
                desc: "Begin with ₦200, Build Wealth",
                color: "from-orange-400 to-red-500",
                bgColor: "from-orange-50 to-red-50",
                image: "/l2.jpg",
                achievement: "₦100K+"
              },
              {
                icon: "📱",
                title: "Lightning Fast",
                desc: "Instant Transactions, Zero Delays",
                color: "from-yellow-400 to-orange-500",
                bgColor: "from-yellow-50 to-orange-50",
                image: "/l3.jpg",
                achievement: "₦75K+"
              },
              {
                icon: "👥",
                title: "Community Power",
                desc: "Unite with Fellow Achievers",
                color: "from-red-400 to-orange-600",
                bgColor: "from-red-50 to-orange-100",
                image: "/l4.jpg",
                achievement: "₦200K+"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)] hover:shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8, scale: 1.03 }}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Feature image */}
                <div className="relative w-full aspect-[4/3] mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-3 right-3 text-white text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 rounded-full shadow-lg">
                    {feature.achievement}
                  </div>
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-base sm:text-lg md:text-2xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Success Bridge Section */}
        <motion.div
          className="max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 px-2 sm:px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <div className="text-center p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_32px_rgba(147,51,234,0.1)]">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4">
              Ready to Join the Champions?
            </h3>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-6">
              Discover the power of African wealth building
            </p>
            <motion.a
              href="/sign-in"
              className="inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-purple-800 text-white font-semibold rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-purple-900 transition-colors duration-300 text-xs sm:text-sm md:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now →
            </motion.a>
          </div>
        </motion.div>

        {/* How It Works - Clean Visual Flow */}
        <motion.div
          className="max-w-6xl mx-auto mb-12 sm:mb-16 md:mb-24 px-2 sm:px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">
              Your path to African prosperity
            </p>
          </div>

          {/* Clean aj1.png showcase without overlay */}
              <motion.div
            className="relative w-full max-w-3xl mx-auto mb-12 sm:mb-16"
            initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] backdrop-blur-sm bg-white/20 border border-white/30">
              <Image
                src="/fl7.jpg"
                alt="African success story"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 text-white">
                <h4 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">African Excellence</h4>
                <p className="text-sm sm:text-lg opacity-90">Building wealth, one step at a time</p>
              </div>
            </div>

            {/* Text below the image for better hierarchy */}
            <div className="text-center mt-6 sm:mt-8">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-3">
                Your African Empire Awaits
              </h3>
              <p className="text-lg sm:text-xl text-orange-600 font-semibold mb-4 sm:mb-6">
                Begin with ₦200, Rise to Royalty
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <span className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 sm:px-4 py-1 sm:py-2 rounded-full border border-orange-200 text-xs sm:text-sm">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  No barriers to entry
                </span>
                <span className="flex items-center gap-2 bg-red-50 text-red-700 px-3 sm:px-4 py-1 sm:py-2 rounded-full border border-red-200 text-xs sm:text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Lightning fast access
                </span>
                <span className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 sm:px-4 py-1 sm:py-2 rounded-full border border-yellow-200 text-xs sm:text-sm">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Fortress security
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>


        {/* Enhanced Subscription Pricing Section */}
        <motion.div
          className="max-w-7xl mx-auto mb-16 sm:mb-20 md:mb-24 px-2 sm:px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.8 }}
        >
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-3 md:mb-4">
              Choose Your <span className="text-orange-600 dark:text-orange-400">Wealth Plan</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto px-2">
              Start your empire today! Pay once, build forever. No hidden fees, no surprises!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto px-2 sm:px-4">
            {/* Free Plan */}
            <motion.div
              className="relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)] hover:shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.6 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">FREE</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Foundation</h3>
                <div className="text-5xl font-black text-gray-800 dark:text-gray-100 mb-2">₦0</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Perfect for beginners</p>

                {/* Feature List */}
                <div className="space-y-3 mb-8 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Basic savings wallet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Daily contribution streaks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Basic savings goals (3 goals)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Join savings circles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Basic gamification</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Email support</span>
                  </div>
                </div>

                <motion.a
                  href="/sign-in"
                  className="block w-full px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Free Now
                </motion.a>
              </div>
            </motion.div>


            {/* King Plan - Most Popular */}
            <motion.div
              className="relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-100/80 to-red-200/80 backdrop-blur-sm border border-orange-300/50 shadow-[12px_12px_24px_rgba(234,88,12,0.2),-12px_-12px_24px_rgba(255,255,255,0.8)] hover:shadow-[16px_16px_32px_rgba(234,88,12,0.3),-16px_-16px_32px_rgba(255,255,255,0.9)] transition-all duration-300 scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.08 }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                  MOST POPULAR!
                </span>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">KING</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Royal Elite</h3>
                <div className="text-5xl font-black text-orange-600 dark:text-orange-400 mb-2">₦1,200</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">One-time payment</p>

                {/* Feature List */}
                <div className="space-y-3 mb-8 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700 font-medium">Everything in Free</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Unlimited savings goals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Advanced gamification & badges</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Peer challenges & competitions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Create & manage savings circles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Personal health dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Advanced analytics & insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Crypto wallet integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Real-time notifications & sounds</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Priority customer support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700">Export data & reports</span>
                  </div>
                </div>

                <motion.a
                  href="/api/payments/initialize?plan=king&amount=1200"
                  className="block w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Pay ₦1,200 & Become King
                </motion.a>
              </div>
            </motion.div>
          </div>

          {/* Payment Security & Benefits - Enhanced UI */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Secure Payments - Glassmorphism */}
            <motion.div
              className="group relative p-8 rounded-3xl backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_32px_rgba(34,197,94,0.1)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.2)] transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.7, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-emerald-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon with neumorphism */}
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-[8px_8px_16px_rgba(34,197,94,0.3),-8px_-8px_16px_rgba(255,255,255,0.8)] group-hover:shadow-[12px_12px_24px_rgba(34,197,94,0.4),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-3 text-lg">Secure Payments</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Bank-level security for all transactions</p>
              </div>
            </motion.div>

            {/* Instant Access - Neumorphism */}
            <motion.div
              className="group relative p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)] hover:shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-yellow-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />

              {/* Icon with neumorphism */}
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-500 shadow-[8px_8px_16px_rgba(251,146,60,0.3),-8px_-8px_16px_rgba(255,255,255,0.8)] group-hover:shadow-[12px_12px_24px_rgba(251,146,60,0.4),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300 flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-3 text-lg">Instant Access</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Features unlock immediately after payment</p>
              </div>
            </motion.div>

            {/* Lifetime Access - Glassmorphism */}
            <motion.div
              className="group relative p-8 rounded-3xl backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_32px_rgba(168,85,247,0.1)] hover:shadow-[0_12px_40px_rgba(168,85,247,0.2)] transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.9, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-violet-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon with neumorphism */}
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 shadow-[8px_8px_16px_rgba(168,85,247,0.3),-8px_-8px_16px_rgba(255,255,255,0.8)] group-hover:shadow-[12px_12px_24px_rgba(168,85,247,0.4),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300 flex items-center justify-center">
                  <span className="text-2xl">💎</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-3 text-lg">Lifetime Access</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Pay once, enjoy forever - no recurring fees</p>
              </div>
              </motion.div>
          </div>

          <motion.div
            className="text-center mt-12 p-6 rounded-2xl backdrop-blur-sm bg-white/20 border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.0, duration: 0.6 }}
          >
            <p className="text-gray-600 text-base sm:text-lg">
              <span className="inline-block w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm flex items-center justify-center mr-2">💡</span>
              <strong>Pro Tip:</strong> Start free, upgrade when you're ready! All payments are secure and instant!
            </p>
          </motion.div>
        </motion.div>

        {/* Enhanced Final CTA */}
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.8 }}
        >
          <div className="relative p-12 rounded-3xl backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_25px_50px_-12px_rgba(147,51,234,0.15)]">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              Ready to Rise?
          </h2>
            <p className="text-gray-600 dark:text-gray-300 text-xl mb-10">
              Join thousands building their empires!
          </p>
          
          <motion.a
            href="/sign-in"
              className="group relative inline-block px-14 py-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl text-white font-bold text-2xl shadow-2xl hover:shadow-orange-900/30 transition-all duration-300 border border-orange-600/20"
              whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
              <span className="relative z-10 flex items-center gap-3">
                Build Your Empire
                <motion.span
                  className="text-xl"
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.a>
          
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-gray-500 text-lg">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Free to start!
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                No commitment!
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Just build!
              </span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}