import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <motion.div
        className={cn(
          "border-4 border-gray-200 border-t-blue-600 rounded-full",
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {text && (
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

// Advanced loading spinner with multiple elements
export function AdvancedLoadingSpinner({ className, text, size = "lg" }: { className?: string; text?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6", className)}>
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={cn(
            "border-4 border-gray-200 border-t-blue-600 rounded-full",
            size === "sm" ? "w-8 h-8" : size === "md" ? "w-12 h-12" : size === "lg" ? "w-16 h-16" : "w-20 h-20"
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {/* Inner ring */}
        <motion.div
          className={cn(
            "absolute border-4 border-gray-200 border-r-purple-600 rounded-full",
            size === "sm" ? "top-1 left-1 w-6 h-6" : size === "md" ? "top-1.5 left-1.5 w-9 h-9" : size === "lg" ? "top-2 left-2 w-12 h-12" : "top-2.5 left-2.5 w-15 h-15"
          )}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {/* Center dot */}
        <motion.div
          className={cn(
            "absolute top-1/2 left-1/2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transform -translate-x-1/2 -translate-y-1/2",
            size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-2 h-2" : size === "lg" ? "w-3 h-3" : "w-4 h-4"
          )}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
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
