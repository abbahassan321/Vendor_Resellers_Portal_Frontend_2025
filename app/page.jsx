'use client';
import Navbar from '@/components/Navbar';
import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  // Variant for fade-in + slide-down hierarchy boxes
  const fadeDown = {
    hidden: { opacity: 0, y: -30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.4,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center">
        {/* Hero Section */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold mb-4 text-blue-600"
        >
          Welcome to GloVendor Reseller Portal
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-gray-700 text-lg md:text-xl max-w-2xl leading-relaxed"
        >
          The <strong>GloVendor Reseller Portal</strong> is a digital platform designed for{' '}
          <span className="text-blue-600 font-semibold">Aggregators, Subvendors, and Retailers</span>{' '}
          to manage electronic airtime and data distribution efficiently. It integrates directly
          with the <strong>Glo Electronic Recharge System (ERS)</strong> for fast, secure, and transparent
          transactions.
        </motion.p>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8"
        >
          <img
            src="/Hero.png"
            alt="GloVendor Hero"
            className="w-300 max-w-md mx-auto drop-shadow-lg rounded-2xl"
          />
        </motion.div>

        {/* ERS Hierarchy Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16 bg-white shadow-md rounded-2xl p-6 w-full max-w-3xl"
        >
          <h2 className="text-2xl font-semibold mb-4 text-green-700">
            Glo Electronic Recharge System (ERS) Hierarchy
          </h2>
          <p className="text-gray-600 mb-8">
            The ERS ecosystem connects multiple reseller levels to ensure seamless distribution of
            airtime and data bundles from Glo to end users.
          </p>

          {/* Animated Hierarchy Block Diagram */}
          <div className="flex flex-col items-center space-y-4">
            {[
              { color: 'bg-green-600', label: 'Glo Nigeria (Root ERS)' },
              { color: 'bg-blue-500', label: 'Aggregator / Distributor' },
              { color: 'bg-yellow-500', label: 'Subvendor' },
              { color: 'bg-orange-500', label: 'Retailer / Agent' },
              { color: 'bg-gray-800', label: 'Customer (End User)' },
            ].map((level, index) => (
              <div key={index} className="flex flex-col items-center">
                <motion.div
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={fadeDown}
                  className={`${level.color} text-white px-6 py-3 rounded-xl font-bold shadow-md w-64 text-center`}
                >
                  {level.label}
                </motion.div>

                {/* Animated bouncing arrow (except for the last box) */}
                {index < 4 && (
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: 'easeInOut',
                      delay: 0.2 * index,
                    }}
                  >
                    <ArrowDown className={`mt-2 ${level.color.replace('bg-', 'text-')} w-6 h-6`} />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1 }}
          className="mt-12 text-gray-500 text-sm"
        >
          © {new Date().getFullYear()} GloVendor • Powered by ERS Integration
        </motion.footer>
      </main>
    </div>
  );
}
