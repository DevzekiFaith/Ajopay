"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Shield, Users, TrendingUp, Clock, Smartphone, Globe, Heart, Star, CheckCircle, Zap, Target, Award } from "lucide-react";

export default function LearnMorePage() {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bank-Grade Security",
      description: "Your money is protected with enterprise-level encryption and security protocols. We use the same security standards as major banks.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Savings",
      description: "Join traditional Ajo and Esusu groups with friends and family. Build wealth together through collective savings practices.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Smart Analytics",
      description: "Track your savings progress with detailed insights, spending patterns, and growth analytics to optimize your financial habits.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Daily Habits",
      description: "Build consistent saving habits with daily reminders, streak tracking, and gamified challenges that make saving fun.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile First",
      description: "Access your savings anywhere, anytime with our intuitive mobile app designed for the modern Nigerian lifestyle.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Local & Global",
      description: "Support local businesses while building global financial literacy. We're proudly Nigerian with international standards.",
      color: "from-teal-500 to-blue-500"
    }
  ];

  const benefits = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Student-Friendly",
      description: "Start with as little as ₦200 daily. Perfect for students and young professionals building their first savings habits."
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Rewards & Incentives",
      description: "Earn points, badges, and rewards for consistent saving. Turn financial discipline into an engaging experience."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Transfers",
      description: "Send money to friends and family instantly. Built-in social features make sharing and splitting costs effortless."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Goal Setting",
      description: "Set and track multiple savings goals. Whether it's a new phone, vacation, or emergency fund - we've got you covered."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Financial Education",
      description: "Learn about personal finance through our integrated educational content and expert tips from financial advisors."
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "No Hidden Fees",
      description: "Transparent pricing with no surprise charges. What you see is what you pay - simple and honest."
    }
  ];

  const stats = [
    { number: "50,000+", label: "Active Users" },
    { number: "₦2.5B+", label: "Total Savings" },
    { number: "98%", label: "User Satisfaction" },
    { number: "24/7", label: "Customer Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <motion.header 
        className="relative z-10 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          
          <motion.div
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            AjoPay
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-800 via-purple-800 to-slate-800 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Learn More About
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              AjoPay
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Discover how AjoPay is revolutionizing digital savings in Nigeria, combining traditional 
            Ajo and Esusu practices with modern fintech innovation to help you build wealth, 
            one day at a time.
          </motion.p>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="neumorphism-card p-6 text-center"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-20 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Why Choose AjoPay?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              We combine the best of traditional Nigerian savings culture with cutting-edge 
              technology to create a platform that truly understands your financial needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="neumorphism-card p-8 group hover:neumorphism-inset transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section 
        className="py-20 px-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-700"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              What You Get
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Join thousands of Nigerians who are already building their financial future with AjoPay.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                className="neumorphism-card p-6 flex items-start gap-4"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center text-white flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="neumorphism-card p-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Join the AjoPay community today and start building your financial future with 
              the power of consistent daily savings.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/sign-in"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
              </motion.a>
              
              <motion.a
                href="/sign-in?redirectTo=/customer"
                className="px-8 py-4 neumorphism-card text-slate-700 dark:text-slate-300 font-semibold rounded-2xl hover:neumorphism-inset transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Open Dashboard
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="py-12 px-6 border-t border-slate-200 dark:border-slate-700"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-4">
            AjoPay - Thriftly
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Nigeria's Leading Digital Savings Platform
          </p>
          <div className="flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </motion.footer>

      <style jsx global>{`
        .neumorphism-card {
          background: linear-gradient(145deg, #f0f0f0, #cacaca);
          box-shadow: 20px 20px 60px #bebebe, -20px -20px 60px #ffffff;
          border-radius: 20px;
        }
        
        .dark .neumorphism-card {
          background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
          box-shadow: 20px 20px 60px #0f0f0f, -20px -20px 60px #3a3a3a;
        }
        
        .neumorphism-inset {
          box-shadow: inset 20px 20px 60px #bebebe, inset -20px -20px 60px #ffffff;
        }
        
        .dark .neumorphism-inset {
          box-shadow: inset 20px 20px 60px #0f0f0f, inset -20px -20px 60px #3a3a3a;
        }
        
        .neumorphism-card:hover {
          box-shadow: 25px 25px 75px #bebebe, -25px -25px 75px #ffffff;
        }
        
        .dark .neumorphism-card:hover {
          box-shadow: 25px 25px 75px #0f0f0f, -25px -25px 75px #3a3a3a;
        }
      `}</style>
    </div>
  );
}
