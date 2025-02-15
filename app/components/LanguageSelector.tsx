'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import * as LucideIcons from 'lucide-react'

const MotionButton = motion.div as any;

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { currentLanguage, setLanguage } = useLanguage();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (language: typeof languages[0]) => {
    console.log('Changing language to:', language);
    setLanguage(language);
    setIsOpen(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <MotionButton
        role="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <LucideIcons.Globe className="h-4 w-4 text-black" />
        <span className="text-sm text-black">{currentLanguage.flag}</span>
        <LucideIcons.ChevronDown className={`h-4 w-4 text-black transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </MotionButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
          >
            <div className="py-1">
              {languages.map((language) => (
                <MotionButton
                  key={language.code}
                  role="button"
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  onClick={() => handleLanguageChange(language)}
                  className="w-full px-4 py-2 text-sm text-gray-900 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{language.flag}</span>
                    <span>{language.name}</span>
                  </div>
                  {currentLanguage.code === language.code && (
                    <LucideIcons.Check className="h-4 w-4 text-black" />
                  )}
                </MotionButton>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 