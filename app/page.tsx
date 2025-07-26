"use client";

import {
  ArrowRight,
  CheckCircle,
  Users,
  Link,
  FileText,
  MessageCircle,
  Shield,
  Zap,
  Star,
  ChevronDown,
  ChevronRight,
  Play,
  Globe,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Menu,
  X
} from "lucide-react";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import Image from "next/image";
import NextLink from "next/link";
import Script from "next/script";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const slideInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const slideInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const floatingAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Clientlane",
    "description": "Professional client portal system for freelancers and agencies to organize files, updates, and conversations in one link.",
    "url": "https://clientlane.vercel.app",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free plan with 1 client portal"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "500"
    },
    "author": {
      "@type": "Organization",
      "name": "Clientlane"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Clientlane"
    }
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Clientlane",
    "url": "https://clientlane.vercel.app",
    "logo": "https://clientlane.vercel.app/icons/lightTransparentLogo.png",
    "description": "Professional client portal system for freelancers and agencies",
    "sameAs": [
      "https://twitter.com/clientlane",
      "https://linkedin.com/company/clientlane"
    ]
  };
  return (
    <>
      {/* Structured Data for SEO */}
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <Script
        id="organization-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      
      <div className="min-h-screen bg-white dark:bg-gray-900 scroll-smooth overflow-x-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-800/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <a 
                href="#"
                className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Clientlane
              </a>
            </motion.div>
            
            {/* Desktop Navigation */}
            <motion.div 
              className="hidden md:flex items-center gap-8"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.a 
                href="#features" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Features
              </motion.a>
              <motion.a 
                href="#how-it-works" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                How it Works
              </motion.a>
              <motion.a 
                href="#pricing" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Pricing
              </motion.a>
              <NextLink href="/signup">
                <motion.button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl cursor-pointer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  Get Started Free
                </motion.button>
              </NextLink>
              <DarkModeToggle />
            </motion.div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <DarkModeToggle />
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                className="md:hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <motion.div 
                  className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.a 
                    href="#features" 
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    Features
                  </motion.a>
                  <motion.a 
                    href="#how-it-works" 
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    How it Works
                  </motion.a>
                  <motion.a 
                    href="#pricing" 
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    Pricing
                  </motion.a>
                  <NextLink href="/signup" className="block">
                    <motion.button 
                      className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Get Started Free
                    </motion.button>
                  </NextLink>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"></div>
        <motion.div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        ></motion.div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-full px-4 py-2 mb-8"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
              </motion.div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trusted by 500+ freelancers worldwide
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
              variants={fadeInUp}
            >
              Client collaboration
              <br />
              <motion.span 
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                reimagined
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Transform chaotic client communication into organized, 
              professional portals. Share files, updates, and feedback 
              in one beautiful link.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              variants={fadeInUp}
            >
              <NextLink href="/signup">
                <motion.button 
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl cursor-pointer"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  Start Free Trial
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              </NextLink>
              <motion.button 
                className="group border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center gap-3 cursor-pointer"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Play className="w-5 h-5" />
                </motion.div>
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              className="flex flex-col items-center gap-4"
              variants={fadeInUp}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">Loved by freelancers at</p>
              <div className="flex items-center gap-8 opacity-60">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div 
                    key={i}
                    className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                  ></motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-20"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.div 
              className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              ✨ Powerful Features
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
              variants={fadeInUp}
            >
              Everything you need to
              <br />
              <span className="text-blue-600">wow your clients</span>
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              Replace messy email chains and scattered documents with a professional portal 
              that makes you look like the expert you are.
            </motion.p>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {/* Feature 1 */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl hover:shadow-xl transition-all duration-300"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">One Magical Link</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Generate a beautiful, branded portal that contains everything your client needs. No more "where's that file?" emails.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl hover:shadow-xl transition-all duration-300"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="bg-green-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <FileText className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart File Organization</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your files are automatically sorted and searchable, making collaboration effortless.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl hover:shadow-xl transition-all duration-300"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="bg-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <MessageCircle className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Contextual Feedback</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get feedback exactly where it matters. Comments, approvals, and revisions happen right in context.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl hover:shadow-xl transition-all duration-300"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="bg-orange-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Zap className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Live Project Updates</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Keep clients in the loop with real-time progress updates, activity feeds, and milestone notifications.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl hover:shadow-xl transition-all duration-300"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="bg-red-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Shield className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Bank-Level Security</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Enterprise-grade security with role-based access. Your clients see only what they need to see.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl hover:shadow-xl transition-all duration-300"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="bg-teal-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Users className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Instant Client Access</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Clients get instant access with auto-created accounts. Login credentials sent via email for secure, personalized access.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.div 
              className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              🚀 Simple Process
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
              variants={fadeInUp}
            >
              From chaos to clarity
              <br />
              <span className="text-purple-600">in 4 simple steps</span>
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              Setup takes less than 5 minutes. Your clients will think you've hired a team.
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {/* Step 1 */}
            <motion.div 
              className="relative"
              variants={fadeInUp}
            >
              <motion.div 
                className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  1
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Sign Up Free</h3>
                <p className="text-gray-600 dark:text-gray-300 flex-1">
                  Create your account in 30 seconds. No credit card required.
                </p>
              </motion.div>
              {/* Animated Connector Line */}
              <motion.div 
                className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                style={{ transformOrigin: "left" }}
              ></motion.div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              className="relative"
              variants={fadeInUp}
            >
              <motion.div 
                className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  2
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Create Portal</h3>
                <p className="text-gray-600 dark:text-gray-300 flex-1">
                  Add your client details and customize your professional portal.
                </p>
              </motion.div>
              <motion.div 
                className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.7 }}
                style={{ transformOrigin: "left" }}
              ></motion.div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              className="relative"
              variants={fadeInUp}
            >
              <motion.div 
                className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div 
                  className="bg-gradient-to-r from-pink-600 to-red-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  3
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Share Magic Link</h3>
                <p className="text-gray-600 dark:text-gray-300 flex-1">
                  Send one beautiful link. Your client gets instant access.
                </p>
              </motion.div>
              <motion.div 
                className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-pink-600 to-red-600"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.9 }}
                style={{ transformOrigin: "left" }}
              ></motion.div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              variants={fadeInUp}
            >
              <motion.div 
                className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div 
                  className="bg-gradient-to-r from-red-600 to-orange-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  4
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Collaborate</h3>
                <p className="text-gray-600 dark:text-gray-300 flex-1">
                  Share files, get feedback, and deliver projects like a pro.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-12 md:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
              See the magic in action
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A clean, professional interface that both you and your clients will love using every day.
            </p>
          </div>

          {/* Demo Mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl md:rounded-3xl p-1 md:p-2 shadow-xl md:shadow-2xl">
              <div className="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden">
                {/* Browser Bar */}
                <div className="bg-gray-100 dark:bg-gray-800 px-2 md:px-4 py-2 md:py-3 flex items-center gap-1 md:gap-2">
                  <div className="flex gap-1 md:gap-2">
                    <div className="w-2 md:w-3 h-2 md:h-3 bg-red-400 rounded-full"></div>
                    <div className="w-2 md:w-3 h-2 md:h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 md:w-3 h-2 md:h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg px-2 md:px-3 py-1 mx-2 md:mx-4">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">clientlane.com/portal/awesome-project</p>
                  </div>
                </div>
                
                {/* Portal Content */}
                <div className="relative h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden">
                  <Image
                    src="/landing-page-cover.png"
                    alt="Clientlane Portal Preview"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.div 
              className="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              ⭐ Client Love
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
              variants={fadeInUp}
            >
              Why freelancers
              <br />
              <span className="text-yellow-600">choose Clientlane</span>
            </motion.h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {/* Testimonial 1 */}
            <motion.div 
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "My clients actually <strong>thank me</strong> for using Clientlane. No more 'where's that file?' emails. I look so much more professional now."
              </p>
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  JC
                </motion.div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Jessica Chen</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Brand Designer</div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div 
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 ring-2 ring-blue-100 dark:ring-blue-900"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "Complete <strong>game changer</strong> for client communication. Projects move 3x faster, and I've eliminated 90% of email back-and-forth."
              </p>
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  MR
                </motion.div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Mike Rodriguez</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Web Developer</div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div 
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "Our agency looks <strong>10x bigger</strong> now. Clients love the professional portal experience. It's our secret weapon."
              </p>
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  AT
                </motion.div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Alex Thompson</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Agency Owner</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              💰 Simple Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Start free, scale as you grow
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose the perfect plan for your business. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-3xl border-2 border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$0</div>
                <p className="text-gray-600 dark:text-gray-300">Perfect to get started</p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">1 client portal</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">100MB storage</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">5MB per file upload</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Comments & collaboration</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Basic support</span>
                </li>
              </ul>
            </div>

            {/* Pro Plan - Popular */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-3xl border-2 border-blue-200 dark:border-blue-600 relative transform scale-105">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$9</div>
                <p className="text-gray-600 dark:text-gray-300">per month</p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Up to 5 client portals</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">1GB storage</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">25MB per file upload</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Everything in Free</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Priority support</span>
                </li>
              </ul>
            </div>

            {/* Agency Plan */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-3xl border-2 border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Agency</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$29</div>
                <p className="text-gray-600 dark:text-gray-300">per month</p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Unlimited client portals</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Unlimited storage</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">100MB per file upload</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">24/7 priority support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              ❓ Questions
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Frequently asked questions
            </h2>
          </div>
          
          <motion.div 
            className="space-y-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {[
              {
                question: "Is my data secure with Clientlane?",
                answer: "Absolutely. We use enterprise-grade security with encrypted data transmission and storage. Each portal has unique access controls, and you can revoke access at any time. We're SOC 2 compliant."
              },
              {
                question: "Can I revoke access to a shared portal?",
                answer: "Yes, you have complete control. Disable portal links, change permissions, or archive completed projects instantly from your dashboard. Your clients will lose access immediately."
              },
              {
                question: "What happens when I hit my plan limits?",
                answer: "We'll notify you before you reach any limits. You can upgrade anytime with one click, or archive old projects to stay within your current plan. No work is ever lost."
              },
              {
                question: "What's coming next in your roadmap?",
                answer: "We're building client login dashboards, detailed analytics, portal templates for faster setup, custom branding with your logo, API access, and white-label solutions for agencies."
              }
            ].map((faq, index) => (
              <motion.div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.button
                  className="w-full text-left"
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <h3 className="text-lg font-semibold mb-3 flex items-center justify-between text-gray-900 dark:text-white">
                    {faq.question}
                    <motion.div
                      animate={{ rotate: faqOpen === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </h3>
                </motion.button>
                <AnimatePresence>
                  {faqOpen === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed pt-2">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.3, 0.1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1.3, 1, 1.3],
              opacity: [0.1, 0.3, 0.1],
              x: [0, -50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          ></motion.div>
        </div>
        
        <motion.div 
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2 
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            variants={fadeInUp}
          >
            Ready to impress
            <br />
            <motion.span
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: "linear-gradient(90deg, #ffffff, #fbbf24, #ffffff)",
                backgroundSize: "200% 200%",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              your clients?
            </motion.span>
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Join 500+ freelancers and agencies who've transformed their client relationships with Clientlane.
          </motion.p>
          
          {/* Email Signup */}
          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md mx-auto"
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex flex-col gap-4">
              <motion.input
                type="email"
                placeholder="Enter your email"
                className="w-full px-6 py-4 rounded-2xl text-gray-900 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-white/20"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              />
              <NextLink href="/signup" className="w-full">
                <motion.button 
                  className="w-full bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  Start Free Trial
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              </NextLink>
            </div>
            <motion.p 
              className="text-sm text-blue-100 mt-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              Free forever • No credit card required • Setup in 2 minutes
            </motion.p>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-white">Clientlane</span>
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Transform client collaboration with professional portals that organize files, 
                updates, and conversations in one beautiful link.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <div className="space-y-3">
                <a href="#features" className="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="block text-gray-400 hover:text-white transition-colors">Pricing</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Demo</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Roadmap</a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Contact</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Terms</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} Clientlane. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
