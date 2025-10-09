"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { contactInfo } from "@/lib/contact-info";

interface ContactInfoProps {
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export function ContactInfo({ variant = "default", className = "" }: ContactInfoProps) {
  const contactDetails = [
    {
      icon: Mail,
      title: "Email",
      value: contactInfo.email,
      action: `mailto:${contactInfo.email}`,
      description: "Send us an email"
    },
    {
      icon: Phone,
      title: "Phone",
      value: contactInfo.phoneFormatted,
      action: `tel:${contactInfo.phone.replace(/\s/g, '')}`,
      description: "Call us directly"
    },
    {
      icon: MapPin,
      title: "Location",
      value: contactInfo.address,
      action: "#",
      description: "Our office location"
    },
    {
      icon: Clock,
      title: "Hours",
      value: contactInfo.businessHours,
      action: "#",
      description: "When we're available"
    }
  ];

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-4 ${className}`}>
        {contactDetails.slice(0, 2).map((info, index) => (
          <motion.a
            key={info.title}
            href={info.action}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            whileHover={{ x: 2 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <info.icon className="w-4 h-4" />
            <span>{info.value}</span>
          </motion.a>
        ))}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
        {contactDetails.map((info, index) => (
          <motion.a
            key={info.title}
            href={info.action}
            className="group p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
            whileHover={{ y: -2, scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-300">
                <info.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{info.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{info.description}</p>
                <p className="text-gray-800 dark:text-gray-100 font-medium">{info.value}</p>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-3 ${className}`}>
      {contactDetails.map((info, index) => (
        <motion.a
          key={info.title}
          href={info.action}
          className="flex items-center gap-3 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors group"
          whileHover={{ x: 4 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <info.icon className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
          <span className="text-sm">{info.value}</span>
        </motion.a>
      ))}
    </div>
  );
}
