'use client';

import { useRouter } from 'next/navigation';
import { motion } from "framer-motion"

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/dubai.mp4" type="video/mp4" />
        </video>
        {/* Overlay to make text more readable */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-6xl font-bold mb-6 text-white">
            Welcome to Sayih
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Your personal AI travel companion for discovering the wonders of Dubai. 
            Let me help you plan your perfect Dubai experience.
          </p>
          
          <button
            onClick={() => router.push('/plan')}
            className="bg-[#C5A059] text-white px-8 py-4 rounded-full text-lg font-semibold 
                     shadow-lg hover:shadow-xl transition-all duration-300 
                     hover:bg-[#B48D4C] focus:outline-none focus:ring-2 
                     focus:ring-[#C5A059] focus:ring-opacity-50
                     transform hover:scale-105 active:scale-95"
          >
            Get Started
          </button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl"
        >
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-2 text-[#C5A059]">Smart Planning</h3>
            <p className="text-white/80">AI-powered itineraries tailored to your preferences and schedule</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-2 text-[#C5A059]">Local Expertise</h3>
            <p className="text-white/80">Insider tips and recommendations for an authentic Dubai experience</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-2 text-[#C5A059]">24/7 Support</h3>
            <p className="text-white/80">Always here to help with your travel questions and needs</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
