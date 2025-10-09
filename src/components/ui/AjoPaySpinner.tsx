"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface AjoPaySpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  showText?: boolean;
}

export function AjoPaySpinner({ 
  size = "md", 
  className = "", 
  text = "Loading...",
  showText = false 
}: AjoPaySpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base", 
    xl: "text-lg"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg`}
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          },
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <Image
          src="/aj1.png"
          alt="AjoPay Loading"
          fill
          className="object-contain p-1"
          sizes={`${size === 'sm' ? '24px' : size === 'md' ? '32px' : size === 'lg' ? '48px' : '64px'}`}
        />
        
        {/* Glowing effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20"
          animate={{
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {showText && (
        <motion.p
          className={`text-gray-600 dark:text-gray-400 font-medium ${textSizeClasses[size]}`}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

// Compact version for inline use
export function AjoPaySpinnerCompact({ 
  size = "sm", 
  className = "" 
}: Omit<AjoPaySpinnerProps, 'text' | 'showText'>) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-10 h-10"
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 shadow-md ${className}`}
      animate={{ 
        rotate: 360,
        scale: [1, 1.1, 1]
      }}
      transition={{
        rotate: {
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        },
        scale: {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      <Image
        src="/aj1.png"
        alt="AjoPay Loading"
        fill
        className="object-contain p-0.5"
        sizes={`${size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px'}`}
      />
    </motion.div>
  );
}
