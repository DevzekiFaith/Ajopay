"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorBoundary, useErrorHandler } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Home() {
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const [showNewUserMessage, setShowNewUserMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const errorHandler = useErrorHandler();

  useEffect(() => {
    try {
    // Check if this is a new user
    if (searchParams.get('newUser') === 'true') {
      setShowNewUserMessage(true);
      // Remove the parameter from URL after showing message
      const url = new URL(window.location.href);
      url.searchParams.delete('newUser');
      window.history.replaceState({}, '', url.toString());
    }
      
      // Simulate loading for better UX
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    } catch (error) {
      errorHandler(error as Error);
      setIsLoading(false);
    }
  }, [searchParams, errorHandler]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading AjoPay..." />
      </div>
    );
  }
  return (
    <ErrorBoundary>
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
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="relative"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">
                Why <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent">AjoPay</span>?
              </h2>
              
              {/* African decorative elements */}
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="w-8 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                <div className="w-8 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-lg sm:text-xl md:text-2xl font-semibold">
                Powerful. Revolutionary. <span className="text-orange-600 font-bold">African.</span>
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {[
              {
                icon: "💰",
                title: "Start Your Empire",
                desc: "Begin with ₦200, Build Wealth",
                color: "from-orange-400 to-red-500",
                bgColor: "from-orange-50 to-red-50",
                image: "/l2.jpg",
                achievement: "₦100K+",
                pattern: "african-geometric-1"
              },
              {
                icon: "📱",
                title: "Lightning Fast",
                desc: "Instant Transactions, Zero Delays",
                color: "from-yellow-400 to-orange-500",
                bgColor: "from-yellow-50 to-orange-50",
                image: "/l3.jpg",
                achievement: "₦75K+",
                pattern: "african-geometric-2"
              },
              {
                icon: "👥",
                title: "Community Power",
                desc: "Unite with Fellow Achievers",
                color: "from-red-400 to-orange-600",
                bgColor: "from-red-50 to-orange-100",
                image: "/l4.jpg",
                achievement: "₦200K+",
                pattern: "african-geometric-3"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)] hover:shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-500 overflow-hidden min-h-[400px] sm:min-h-[450px] md:min-h-[500px] lg:min-h-[550px] xl:min-h-[600px] w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.8 }}
                whileHover={{ y: -12, scale: 1.05, rotateY: 2 }}
              >
                {/* African Pattern Background */}
                <div className={`absolute inset-0 rounded-4xl bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* African Geometric Pattern Overlay */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(234,88,12,0.3)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(251,146,60,0.3)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.2)_0%,transparent_50%)]" />
                </div>

                {/* Feature image with enhanced height and mobile responsiveness */}
                <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] lg:aspect-[3/4] xl:aspect-[4/5] mb-3 sm:mb-4 md:mb-6 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* African-inspired achievement badge - mobile responsive */}
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 md:bottom-4 md:right-4 text-white text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 px-1.5 py-0.5 sm:px-3 sm:py-1.5 md:px-4 md:py-3 rounded-md sm:rounded-lg md:rounded-2xl shadow-lg border border-orange-300/30 backdrop-blur-sm">
                    <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
                      <span className="text-xs sm:text-sm md:text-lg">👑</span>
                      <span className="hidden sm:inline">{feature.achievement}</span>
                      <span className="sm:hidden">{feature.achievement.replace('K+', 'K')}</span>
                    </div>
                  </div>
                  
                  {/* African pattern overlay on image - mobile responsive */}
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 md:top-4 md:left-4 w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <span className="text-sm sm:text-lg md:text-2xl">{feature.icon}</span>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    {/* Enhanced icon with African styling - mobile responsive */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl mb-2 sm:mb-3 md:mb-4 lg:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl border-2 border-white/30`}>
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 md:mb-3 lg:mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed font-medium">
                      {feature.desc}
                    </p>
                  </div>
                  
                  {/* African-inspired decorative element */}
                  <div className="mt-3 sm:mt-4 md:mt-6 flex justify-center">
                    <div className="w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 rounded-full group-hover:w-16 sm:group-hover:w-24 md:group-hover:w-28 transition-all duration-500" />
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


        {/* African-Inspired Minimalist Subscription Section */}
        
        <motion.div
          className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4 sm:px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.8 }}
        >
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
              Start Your Wealth Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg md:text-xl lg:text-2xl px-2">
              Join the African wealth-building revolution
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* African Image */}
            <motion.div
              className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-lg overflow-hidden shadow-lg order-2 lg:order-1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.3, duration: 0.8 }}
            >
              <Image
                src="/A2.jpg"
                alt="African wealth building"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">African Excellence</h3>
                <p className="text-sm sm:text-base md:text-lg opacity-90">Building wealth, one step at a time</p>
              </div>
            </motion.div>

            {/* Minimalist Card */}
            <motion.div
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 md:p-8 shadow-sm order-1 lg:order-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.4, duration: 0.6 }}
              whileHover={{ y: -2 }}
            >
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  King Elite
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Ultimate African wealth building experience
                </p>
              </div>
              
              {/* Pricing */}
              <div className="text-center mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  FREE
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                  for 4 days
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Then ₦4,250 one-time
                </div>
              </div>

              {/* Features */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-center text-sm sm:text-base">
                  What&apos;s included
                </h4>
                <div className="space-y-2">
                  {[
                    "Unlimited savings goals",
                    "Advanced analytics",
                    "Peer challenges",
                    "Savings circles"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                      <span className="leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <motion.a
                  href="/sign-up?plan=king_elite_trial"
                  className="inline-block w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm sm:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Free Trial
                </motion.a>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3">
                  No credit card required
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>


        {/* African-Inspired Final CTA - Mobile Responsive */}
        <motion.div
          className="text-center max-w-4xl mx-auto px-4 sm:px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.8 }}
        >
          <div className="relative overflow-hidden rounded-2xl shadow-xl h-64 sm:h-80 md:h-96 lg:h-[500px]">
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/fl9.jpg"
                alt="African success and prosperity"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 80vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-6 sm:p-8 lg:p-12 text-white h-full flex flex-col justify-center items-center">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                  Ready to build your empire?
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed px-2">
                  Join thousands of Africans building their wealth and creating lasting legacies
                </p>
                
                <motion.a
                  href="/sign-in"
                  className="inline-block bg-white text-gray-900 font-bold px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base shadow-lg"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started Now
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
    </ErrorBoundary>
  );
}