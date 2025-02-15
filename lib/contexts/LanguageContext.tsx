'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = {
  code: string;
  name: string;
  flag: string;
};

type TranslationValue = string | { [key: string]: string };

type Translations = {
  [key: string]: {
    [key: string]: TranslationValue;
  };
};

const translations: Translations = {
  en: {
    welcome: "مرحباً! I'm Sayih, your personal Dubai Travel Agent. Ready to plan your dream vacation in Dubai? Let's start by getting to know where you're coming from! Which city will you be traveling from?",
    london: "London & UK",
    europe: "Europe",
    americas: "Americas",
    asia_pacific: "Asia Pacific",
    middle_east: "Middle East & GCC",
    india: "India & South Asia",
    dubai_downtown: "Downtown Dubai - Home of Burj Khalifa",
    palm_jumeirah: "Palm Jumeirah - Iconic island paradise",
    dubai_marina: "Dubai Marina - Luxury waterfront living",
    old_dubai: "Old Dubai - Cultural heritage & souks",
    dubai_creek: "Dubai Creek - Historic waterways & culture",
    datePrompt: "Perfect choice! When would you like to experience the wonders of Dubai?",
    pickDate: "Select your dates",
    groupSizePrompt: "How many people will be experiencing Dubai together?",
    soloTraveler: "travelling alone",
    couple: "travelling with my partner",
    family: "travelling with my family",
    group: "travelling with a group",
    durationPrompt: "How many days would you like to spend in Dubai?",
    shortBreak: "City Break (3-4 days)",
    weekTrip: "Dubai Discovery (5-7 days)",
    extendedStay: "Complete Dubai (8-13 days)",
    grandTour: "Ultimate Emirates (14+ days)",
    budgetPrompt: "What's your preferred budget range for your Dubai experience?",
    budgetBasic: "Smart Value",
    budgetMidRange: "Premium Comfort",
    budgetLuxury: "Luxury & Exclusive",
    budgetBasicDesc: "3-star hotels, local dining, public transport (AED 500-1000/day)",
    budgetMidRangeDesc: "4-star hotels, mixed dining, tours included (AED 1000-2500/day)",
    budgetLuxuryDesc: "5-star luxury, fine dining, private transport (AED 2500+/day)",
    interestsPrompt: "What aspects of Dubai interest you most? I'll personalize your experience.",
    cultural: "Heritage & Culture",
    food: "Culinary Experiences",
    nature: "Desert Adventures",
    shopping: "Shopping & Lifestyle",
    relaxation: "Beach & Wellness",
    nightlife: "Nightlife & Entertainment",
    itineraryTab: "Your Dubai Journey",
    hotelTab: "Hotels",
    flightsTab: "Flights",
    tipsTab: "Dubai Tips",
    exportCalendar: "Save to Calendar",
    askSayih: "Ask Sayih about Dubai...",
    selectedAs: "I'm",
    shortBreakDesc: "Perfect for a Dubai city break (3-4 days)",
    weekTripDesc: "Ideal for main Dubai attractions (5-7 days)",
    extendedStayDesc: "Experience Dubai in depth (8-13 days)",
    grandTourDesc: "Complete UAE experience (14+ days)",
    interestedIn: "I'm interested in exploring {destination}",
    travelDate: "I plan to visit on {date}",
    soloTravelerDesc: "Perfect for independent Dubai experiences",
    coupleDesc: "Romantic experiences for two in Dubai",
    familyDesc: "Family-friendly activities in Dubai (3-5 people)",
    groupDesc: "Group activities in Dubai (6+ people)",
    selectedBudget: "My budget is {budget}",
    culturalOption: "Heritage & Culture",
    foodOption: "Emirati Cuisine",
    natureOption: "Desert & Beach",
    shoppingOption: "Malls & Souks",
    relaxationOption: "Spa & Wellness",
    nightlifeOption: "Evening Entertainment",
    culturalDesc: "Explore Old Dubai, museums, and traditional culture",
    foodDesc: "From street food to fine dining experiences",
    natureDesc: "Desert safaris and beach activities",
    shoppingDesc: "World's largest malls and traditional markets",
    relaxationDesc: "Luxury spas and beach clubs",
    nightlifeDesc: "Rooftop lounges and entertainment",
    mainTitle: "Experience Dubai with Sayih AI",
    mainSubtitle: "Your personal AI concierge for discovering the wonders of Dubai",
    footer: "© 2024 Sayih AI - Dubai Department of Economy and Tourism",
    weatherForecast: "Dubai Weather",
    temperature: "Temperature",
    humidity: "Humidity",
    forecastFor: "Forecast for",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    sightseeing: "Sightseeing",
    tour: "Tour",
    visit: "Visit",
    explore: "Explore",
    selectedDateRange: "I want to travel from {startDate} to {endDate} ({days} days)",
    london_desc: "Direct flights from major UK airports",
    europe_desc: "Convenient connections from European cities",
    americas_desc: "Routes from North & South America",
    asia_pacific_desc: "Flights from Asia & Australia",
    middle_east_desc: "Short flights from neighboring countries",
    india_desc: "Multiple daily connections from India",
    datePromptResponses: {
      london: "Ah, from the city of Big Ben! Trading London's rain for Dubai's eternal sunshine? When would you like to visit?",
      paris: "From the City of Lights to the City of Gold! When are you planning your Dubai adventure?",
      manchester: "Trading Manchester's football fever for Dubai's desert fever? When would you like to make this exciting switch?",
      new_york: "From the Big Apple to the Pearl of the Desert! When are you planning to experience Dubai's magic?",
      tokyo: "Konnichiwa! From Tokyo's neon lights to Dubai's Arabian nights - when would you like to visit?",
      sydney: "G'day! Swapping Sydney's beaches for Dubai's golden sands? When are you thinking of visiting?",
      mumbai: "From Mumbai's bustling streets to Dubai's luxurious treats! When would you like to experience the difference?",
      // Add more city responses as needed
    },
    selectedInterest: {
      'Culture': "I would love to explore Dubai's rich cultural heritage and traditions",
      'Food': "I'm excited to experience Dubai's diverse culinary scene",
      'Nature': "I'm looking forward to experiencing Dubai's natural wonders and desert adventures",
      'Shopping': "I'm interested in exploring Dubai's world-class shopping destinations",
      'Adventure': "I'm eager to try Dubai's exciting adventure activities",
      'default': "I'm interested in experiencing this aspect of Dubai"
    },
    selectedInterest_culture_heritage: "I would love to explore Dubai's rich cultural heritage",
    selectedInterest_sports_recreation: "I'm interested in sports and recreational activities",
    selectedInterest_education_learning: "I'm interested in educational experiences",
    selectedInterest_adventure_outdoors: "I'm excited about outdoor adventures",
    selectedInterest_shopping_lifestyle: "I want to explore shopping and lifestyle options",
    selectedInterest_food_dining: "I'm looking forward to experiencing the culinary scene",
    selectedInterest_technology_innovation: "I'm interested in technology and innovation",
    selectedInterest_arts_entertainment: "I want to experience arts and entertainment",
    selectedInterest_wellness_relaxation: "I'm interested in wellness and relaxation activities",
    selectedInterest_business_networking: "I'm interested in business and networking opportunities",
    selectedInterest_family_activities: "I'm looking for family-friendly activities",
    selectedInterest_nature_wildlife: "I want to explore nature and wildlife"
  },
  ar: {
    welcome: "مرحباً! أنا سيّح، وكيل سفرك الشخصي في دبي. هل أنت مستعد لتخطيط عطلتك الحلم في دبي؟ دعنا نبدأ بمعرفة من أين ستأتي! من أي مدينة ستسافر؟",
    london: "لندن والمملكة المتحدة",
    europe: "أوروبا",
    americas: "الأمريكتان",
    asia_pacific: "آسيا والمحيط الهادئ",
    middle_east: "الشرق الأوسط ودول الخليج",
    india: "الهند وجنوب آسيا",
    dubai_downtown: "وسط دبي - موطن برج خليفة",
    palm_jumeirah: "نخلة جميرا - جزيرة الفردوس",
    dubai_marina: "مرسى دبي - الحياة الفاخرة على الواجهة البحرية",
    old_dubai: "دبي القديمة - التراث الثقافي والأسواق",
    dubai_creek: "خور دبي - الممرات المائية التاريخية والثقافة",
    mainTitle: "اكتشف دبي مع سيّح",
    mainSubtitle: "مرشدك الشخصي بالذكاء الاصطناعي لاكتشاف روائع دبي",
    footer: "© 2024 سيّح - دائرة الاقتصاد والسياحة في دبي",
    askSayih: "اسأل سيّح عن دبي...",
    selectedDateRange: "أريد السفر من {startDate} إلى {endDate} ({days} أيام)",
    selectedAs: "أنا",
    soloTraveler: "مسافر وحدي",
    couple: "مسافر مع شريكي",
    family: "مسافر مع عائلتي",
    group: "مسافر مع مجموعة",
    // Add more Arabic translations as needed
    datePromptResponses: {
      london: "من مدينة الضباب إلى مدينة الشمس! متى تود زيارة دبي؟",
      // Add more Arabic city responses
    },
    datePrompt: "موعد رائع! متى ترغب في تجربة عجائب دبي؟",
    pickDate: "اختر التواريخ",
    groupSizePrompt: "كم عدد الأشخاص الذين سيختبرون دبي معًا؟",
    durationPrompt: "كم يومًا تود قضاءها في دبي؟",
    shortBreak: "رحلة قصيرة (3-4 أيام)",
    weekTrip: "اكتشاف دبي (5-7 أيام)",
    extendedStay: "دبي الكاملة (8-13 يوم)",
    grandTour: "الإمارات الشاملة (14+ يوم)",
    budgetPrompt: "ما هو نطاق ميزانيتك المفضل لتجربتك في دبي؟",
    budgetBasic: "القيمة الذكية",
    budgetMidRange: "الراحة المتميزة",
    budgetLuxury: "الفخامة والحصرية",
    budgetBasicDesc: "فنادق 3 نجوم، مطاعم محلية، مواصلات عامة (500-1000 درهم/يوم)",
    budgetMidRangeDesc: "فنادق 4 نجوم، مطاعم متنوعة، جولات مشمولة (1000-2500 درهم/يوم)",
    budgetLuxuryDesc: "فنادق 5 نجوم فاخرة، مطاعم راقية، مواصلات خاصة (2500+ درهم/يوم)",
    interestsPrompt: "ما هي جوانب دبي التي تهمك أكثر؟ سأخصص تجربتك.",
    itineraryTab: "رحلتك في دبي",
    hotelTab: "الفنادق",
    flightsTab: "الرحلات الجوية",
    tipsTab: "نصائح دبي",
    exportCalendar: "حفظ في التقويم",
    weatherForecast: "طقس دبي",
    temperature: "درجة الحرارة",
    humidity: "الرطوبة",
    forecastFor: "توقعات",
    breakfast: "الإفطار",
    lunch: "الغداء",
    dinner: "العشاء",
    sightseeing: "مشاهدة المعالم",
    tour: "جولة",
    visit: "زيارة",
    explore: "استكشاف"
  },
  // Add other languages as needed
};

type LanguageContextType = {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
};

const defaultLanguage: Language = {
  code: 'en',
  name: 'English',
  flag: '🇬🇪'  // Changed to UAE flag
};

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: defaultLanguage,
  setLanguage: () => {},
  t: (key: string, params?: Record<string, any>) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);

  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setCurrentLanguage(JSON.parse(savedLanguage));
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('selectedLanguage', JSON.stringify(language));
  }, []);

  const t = useCallback((key: string, params?: Record<string, any>): string => {
    // Get the translation value
    const translationValue = translations[currentLanguage.code]?.[key] || 
                            translations.en[key] || 
                            key;
    
    // If it's a nested object (like datePromptResponses), handle it differently
    if (typeof translationValue === 'object') {
      // If we're looking for a specific city response
      if (params?.city) {
        return translationValue[params.city] || translationValue.default || key;
      }
      // Return the default or first value if no specific key is requested
      return Object.values(translationValue)[0] || key;
    }
    
    // Handle string translations with parameters
    let finalTranslation = String(translationValue);
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        const searchStr = `{${param}}`;
        finalTranslation = finalTranslation.split(searchStr).join(String(value));
      });
    }
    
    return finalTranslation;
  }, [currentLanguage.code]);

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider 
      value={{
        currentLanguage,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext); 