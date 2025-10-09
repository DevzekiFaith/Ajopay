import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <motion.div
        className={cn(
          "relative rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg",
          sizeClasses[size]
        )}
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
      {text && (
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400 font-medium"
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

// Advanced loading spinner with AjoPay logo and rings
export function AdvancedLoadingSpinner({ className, text, size = "lg" }: { className?: string; text?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const logoSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const ringSize = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-20 h-20",
    xl: "w-24 h-24"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6", className)}>
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={cn(
            "border-2 border-amber-200/30 border-t-amber-500 rounded-full",
            ringSize[size]
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {/* Inner ring */}
        <motion.div
          className={cn(
            "absolute border-2 border-orange-200/30 border-r-orange-500 rounded-full",
            size === "sm" ? "top-1 left-1 w-10 h-10" : size === "md" ? "top-1.5 left-1.5 w-13 h-13" : size === "lg" ? "top-2 left-2 w-16 h-16" : "top-2.5 left-2.5 w-19 h-19"
          )}
          animate={{ rotate: -360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {/* AjoPay Logo Center */}
        <motion.div
          className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg",
            logoSize[size]
          )}
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotate: {
              duration: 4,
              repeat: Infinity,
              ease: "linear"
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
        </motion.div>
      </div>
      
      {text && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{text}</p>
          <motion.div
            className="flex space-x-1 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Skeleton loading for cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
      </div>
    </div>
  );
}
