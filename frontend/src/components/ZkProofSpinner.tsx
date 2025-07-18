'use client';

import { motion } from 'framer-motion';

export default function ZkProofSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="relative w-24 h-24">
        {/* Outer glowing ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="absolute inset-0 border-4 border-pink-500 rounded-full opacity-40"
        />

        {/* Middle dashed ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="absolute inset-2 border-2 border-dashed border-gray-400 rounded-full"
        />

        {/* Inner pulsating core */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-6 bg-pink-500 rounded-full shadow-xl shadow-pink-500/30"
        />
      </div>

      <div className="text-2xl text-white font-bold animate-pulse">
        Generating zero-knowledge proof...
      </div>
    </div>
  );
}
