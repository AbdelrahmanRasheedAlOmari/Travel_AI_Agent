'use client'

import { useRouter } from 'next/navigation';
import { motion } from "framer-motion"
import { Compass } from "lucide-react"
import LanguageSelector from "./LanguageSelector"

const MotionButton = motion.div as any;

export default function Header() {
  const router = useRouter();

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[#C5A059]/20"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center space-x-4">
            <div className="bg-[#C5A059] p-3 rounded-lg">
              <Compass className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#C5A059]">
              Sayih AI
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-12">
            <a 
              onClick={() => router.push('/')} 
              className="text-lg text-gray-600 hover:text-[#C5A059] transition-colors cursor-pointer"
            >
              Home
            </a>
            <a href="#" className="text-lg text-gray-600 hover:text-[#C5A059] transition-colors">Explore Dubai</a>
            <a href="#" className="text-lg text-gray-600 hover:text-[#C5A059] transition-colors">About</a>
            <a href="#" className="text-lg text-gray-600 hover:text-[#C5A059] transition-colors">Contact</a>
          </nav>
          <div className="flex items-center">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </motion.div>
  )
} 