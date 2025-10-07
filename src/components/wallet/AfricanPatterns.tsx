"use client";

import { motion } from "framer-motion";

export function AfricanPatterns() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Adinkra Symbols */}
      <motion.div
        className="absolute top-10 left-10 w-16 h-16 opacity-10"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="currentColor" opacity="0.3"/>
          <circle cx="50" cy="50" r="15" fill="currentColor" opacity="0.5"/>
        </svg>
      </motion.div>

      <motion.div
        className="absolute top-20 right-20 w-12 h-12 opacity-10"
        animate={{
          rotate: [360, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
          <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="currentColor" opacity="0.3"/>
          <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.6"/>
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-20 left-20 w-14 h-14 opacity-10"
        animate={{
          rotate: [0, 360],
          scale: [1, 0.9, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
          <path d="M50 5 Q80 20 80 50 Q80 80 50 95 Q20 80 20 50 Q20 20 50 5" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M35 35 Q50 25 65 35 Q65 50 50 60 Q35 50 35 35" fill="currentColor" opacity="0.4"/>
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-10 right-10 w-10 h-10 opacity-10"
        animate={{
          rotate: [360, 0],
          scale: [1, 1.3, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M50 20 L70 40 L50 60 L30 40 Z" fill="currentColor" opacity="0.3"/>
          <path d="M50 40 L60 50 L50 60 L40 50 Z" fill="currentColor" opacity="0.5"/>
        </svg>
      </motion.div>

      {/* Kente-inspired patterns */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-20 h-4 opacity-5"
        animate={{
          x: [0, 20, 0],
          scaleX: [1, 1.5, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-full"></div>
      </motion.div>

      <motion.div
        className="absolute top-2/3 right-1/3 w-16 h-4 opacity-5"
        animate={{
          x: [0, -15, 0],
          scaleX: [1, 1.3, 1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full"></div>
      </motion.div>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-6 h-6 bg-amber-400/10 rounded-full"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-orange-400/10 rotate-45"
        animate={{
          y: [0, 15, 0],
          x: [0, -8, 0],
          rotate: [45, 225, 45]
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-400/10 rounded-full"
        animate={{
          y: [0, -25, 0],
          x: [0, 12, 0],
          scale: [1, 1.5, 1]
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />
    </div>
  );
}

export function AfricanGlassmorphismCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Background pattern */}
      <AfricanPatterns />
      
      {/* Glassmorphism card */}
      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-orange-400/5 to-red-400/5"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AfricanButton({ 
  children, 
  onClick, 
  className = "",
  variant = "primary"
}: { 
  children: React.ReactNode; 
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
  variant?: "primary" | "secondary" | "accent";
}) {
  const variants = {
    primary: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-gray-800 dark:text-white",
    accent: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
  };

  return (
    <motion.button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}
