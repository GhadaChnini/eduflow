'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { useRef, useState } from 'react';
import {
  FEATURES,
  STATS,
  APP_NAME,
  HERO_TITLE,
  HERO_SUBTITLE,
  CTA_TITLE,
  CTA_SUBTITLE,
} from '@/landing';

const CTA_SLIDES = [
  {
    emoji: '🏆',
    title: 'Earn Badges & Points!',
    subtitle: 'Complete lessons, win badges, and climb the leaderboard with friends!',
    cta: '🎉 Join Now!',
    bg: '#EC4899',
  },
  {
    emoji: '🤖',
    title: 'Your AI Learning Buddy!',
    subtitle: 'Get a personalized learning map built just for you by our smart AI!',
    cta: '🚀 Try It Free!',
    bg: '#F59E0B',
  },
  {
    emoji: '🦸',
    title: CTA_TITLE,
    subtitle: CTA_SUBTITLE,
    cta: '🌟 Start My Journey!',
    bg: '#7C3AED',
  },
];

export default function LandingPage() {
  const { data: session } = authClient.useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollTo = (i: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.children[i] as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActive(i);
  };

  // ─── SLIDE 1: HERO SECTION ───
  const heroSlide = (
    <div key="hero" className="w-full min-w-full h-full flex flex-col justify-center items-center px-6 text-center select-none max-w-xl mx-auto">
      <div className="inline-flex items-center gap-1.5 bg-[#F3E8FF] rounded-full px-4 py-1.5 border-2 border-[#D8B4FE] mb-6">
        <span className="text-sm">🤖</span>
        <span className="text-xs font-extrabold text-[#7C3AED]">AI-Powered Learning for Kids!</span>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-black text-[#3B0764] tracking-tight mb-4">
        {HERO_TITLE}
      </h1>
      
      {/* Precision breaking wrapper to match the design file perfectly */}
      <p className="text-xs md:text-sm text-[#7E22CE] font-bold mb-8 max-w-[290px] sm:max-w-md mx-auto leading-relaxed">
        {HERO_SUBTITLE}
      </p>
      
      {/* Sizing & Borders matched directly from your emulator view */}
      <div className="flex flex-col gap-3 mb-8 w-full max-w-[320px] px-2">
        <Link href="/account/signup" className="w-full">
          <Button className="w-full rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-[15px] py-6 shadow-md transition-all">
            🚀 Start Learning — It's Free!
          </Button>
        </Link>
     <Link href="/teacher" className="w-full">
  <Button variant="outline" className="w-full rounded-full border-2 border-[#4F46E5] text-[#4F46E5] font-black text-[14px] py-[22px] hover:bg-indigo-50/50 bg-white shadow-sm">
    👩‍🏫 Teach on EduFlow
  </Button>
</Link>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border-2 border-[#FAE8FF]">
            <span className="text-sm">{stat.emoji}</span>
            <span className="text-[10px] font-black text-[#7C3AED]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── SLIDES 2: FEATURES SLIDES ───
  const featureSlides = FEATURES.map((f: any, index: number) => (
    <div key={`feature-${index}`} className="w-full min-w-full h-full flex flex-col justify-center items-center px-8 text-center select-none">
      <div className="max-w-md mx-auto flex flex-col items-center">
        <span className="text-[90px] mb-6 block leading-none">{f.emoji}</span>

        <h2 className="text-2xl md:text-3xl font-black text-[#3B0764] mb-3 tracking-tight">
          {f.label}
        </h2>

        <p className="text-sm md:text-base font-semibold text-[#4C1D95] leading-relaxed mb-8 max-w-xs">
          {f.desc}
        </p>

        <Link href="/account/signup">
          <Button className="rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black px-8 py-5 text-sm shadow-md">
            🚀 Try It Free!
          </Button>
        </Link>
      </div>
    </div>
  ));

  // ─── SLIDES 3: CTA SLIDES ───
  const ctaSlides = CTA_SLIDES.map((slide, index) => (
    <div key={`cta-${index}`} className="w-full min-w-full h-full flex flex-col justify-center items-center px-8 text-center select-none">
      <div className="max-w-md mx-auto flex flex-col items-center">
        <span className="text-[80px] mb-5 block leading-none">{slide.emoji}</span>
        
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
          {slide.title}
        </h2>

        <p className="text-sm md:text-base font-bold text-white/90 leading-relaxed mb-8 max-w-xs">
          {slide.subtitle}
        </p>

        <Link href="/account/signup">
          <Button className="rounded-full bg-white hover:bg-neutral-50 text-neutral-900 font-black px-9 py-5 text-sm shadow-lg">
            {slide.cta}
          </Button>
        </Link>
      </div>
    </div>
  ));

  const slides = [heroSlide, ...featureSlides, ...ctaSlides];

  const slideBgs = [
    '#FAF5FF',
    ...FEATURES.map((f: any) => f.bg),
    ...CTA_SLIDES.map((s) => s.bg),
  ];

  const currentBg = slideBgs[active] || '#FAF5FF';
  const isDark = ['#7C3AED', '#EC4899', '#F59E0B'].includes(currentBg);

  return (
    <div 
      className="h-screen w-screen flex flex-col overflow-hidden font-nunito select-none transition-colors duration-500 ease-out" 
      style={{ backgroundColor: currentBg }}
    >
      
      {/* Nav Link Bar */}
      <nav className={`backdrop-blur-md border-b-4 h-20 flex-shrink-0 z-50 transition-colors duration-500 ${isDark ? 'bg-black/10 border-white/10' : 'bg-white/80 border-[#C4B5FD]'}`}>
        <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl shadow-md ${isDark ? 'bg-white' : 'bg-[#7C3AED]'}`}>
              <span className="text-lg sm:text-xl">{isDark ? '🚀' : '🌟'}</span>
            </div>
            <div>
              <span className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#7C3AED]'}`}>{APP_NAME}</span>
              <div className={`text-[9px] sm:text-[10px] font-bold -mt-1 ${isDark ? 'text-white/80' : 'text-[#EC4899]'}`}>Kids Learning ✨</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/forum" className={`hidden md:block text-sm font-bold transition-colors ${isDark ? 'text-white/90 hover:text-white' : 'text-[#7C3AED]'}`}>💬 Community</Link>
            <Link href="/leaderboard" className={`hidden md:block text-sm font-bold transition-colors ${isDark ? 'text-white/90 hover:text-white' : 'text-[#7C3AED]'}`}>🏆 Leaderboard</Link>
            {session ? (
              <Link href="/dashboard">
                <Button className={`rounded-full font-bold px-4 py-2 text-xs sm:text-sm shadow-md ${isDark ? 'bg-white text-neutral-900 hover:bg-neutral-100' : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'}`}>My Dashboard 🚀</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/account/signin" className={`text-xs sm:text-sm font-bold transition-colors px-1 ${isDark ? 'text-white/90' : 'text-[#7C3AED]'}`}>Log In</Link>
                <Link href="/account/signup">
                  <Button className={`rounded-full font-bold px-4 py-2 text-xs sm:text-sm shadow-md ${isDark ? 'bg-white text-neutral-900 hover:bg-neutral-100' : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'}`}>Join Free! 🎉</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Responsive Slider Container */}
      <div 
        ref={scrollRef}
        className="flex flex-1 overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          setActive(Math.min(idx, slides.length - 1));
        }}
      >
        {slides.map((slide, index) => (
          <div 
            key={index} 
            className="w-full min-w-full h-full flex-shrink-0 flex items-center justify-center overflow-y-auto md:overflow-y-hidden py-4 snap-start snap-always"
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Synchronized Indicator Tracker Dots Footer */}
      <div className={`h-14 md:h-16 flex-shrink-0 flex items-center justify-center border-t relative z-40 transition-colors duration-500 ${isDark ? 'bg-black/10 border-white/10' : 'bg-white/40 border-purple-100'}`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active 
                  ? `w-6 md:w-8 ${isDark ? 'bg-white' : 'bg-[#7C3AED]'}` 
                  : `w-2 md:w-2.5 ${isDark ? 'bg-white/40 hover:bg-white/60' : 'bg-[#C4B5FD] hover:bg-[#b29ffc]'}`
              }`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}