'use client';

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { useAuth } from '@/utils/auth/useAuth';
import {
  FEATURES,
  STATS,
  APP_NAME,
  APP_TAGLINE,
  HERO_TITLE,
  HERO_SUBTITLE,
  CTA_TITLE,
  CTA_SUBTITLE,
} from '@/constants/landing';
import { authFetch } from '@/utils/auth/getSession';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef, useState } from 'react';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export let isTeacherAuthIntent = false;

const { width: W, height: H } = Dimensions.get('window');

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

export default function MobileDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { auth, isReady, signIn, signUp, teacherSignIn } = useAuth();
  
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef<FlatList>(null);

  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await authFetch('/api/profile');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!auth,
  });

  if (!fontsLoaded || !isReady) return null;

  // ─── HERO SLIDE CONTAINER ───
  const heroSlide = (
    <View
      key="hero"
      style={{ 
        width: W, 
        height: H - insets.top - insets.bottom, 
        backgroundColor: 'transparent', 
        paddingHorizontal: 24, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: insets.top
      }}
    >
      {/* Absolute Top Branding Navigation Row */}
      <View style={{ position: 'absolute', top: 10, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🌟</Text>
          </View>
          <View>
            <Text style={{ fontSize: 15, fontFamily: 'Nunito_900Black', color: '#7C3AED' }}>{APP_NAME}</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Nunito_700Bold', color: '#EC4899' }}>{APP_TAGLINE}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => signIn()}
          style={{ backgroundColor: '#EDE9FE', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 2, borderColor: '#C4B5FD' }}
        >
          <Text style={{ fontSize: 12, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' }}>Log In</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: '#EDE9FE', borderRadius: 100, borderWidth: 2, borderColor: '#C4B5FD', paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 45 }}>
        <Text style={{ fontSize: 12 }}>🤖</Text>
        <Text style={{ fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#7C3AED' }}>AI-Powered Learning for Kids!</Text>
      </View>

      <Text style={{ fontSize: 26, fontFamily: 'Nunito_900Black', color: '#3B0764', textAlign: 'center', lineHeight: 32, marginBottom: 8 }}>{HERO_TITLE}</Text>
      <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: '#6B21A8', textAlign: 'center', lineHeight: 18, marginBottom: 16, paddingHorizontal: 10 }}>{HERO_SUBTITLE}</Text>

      {/* Main Actions Container - Setting up separate operational targets natively */}
      <View style={{ width: '100%', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => signUp()}
          style={{ width: '100%', backgroundColor: '#7C3AED', borderRadius: 100, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 15, fontFamily: 'Nunito_900Black', color: '#FFFFFF' }}>🚀 Start Learning — It's Free!</Text>
        </TouchableOpacity>

        {/* 👩‍🏫 Custom Dynamic Trigger Point */}
        <TouchableOpacity
          onPress={() => teacherSignIn()} 
          style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 100, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: '#6366F1' }}
        >
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_800ExtraBold', color: '#4F46E5' }}>👩‍🏫 Teach on EduFlow</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {STATS.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 2, borderColor: '#E9D5FF', paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12 }}>{s.emoji}</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Nunito_800ExtraBold', color: '#6D28D9' }}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const featureSlides = FEATURES.map((f) => (
    <View
      key={f.label}
      style={{ width: W, height: H, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
    >
      <Text style={{ fontSize: 75, marginBottom: 16 }}>{f.emoji}</Text>
      <Text style={{ fontSize: 24, fontFamily: 'Nunito_900Black', color: '#3B0764', textAlign: 'center', marginBottom: 8 }}>{f.label}</Text>
      <Text style={{ fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#4C1D95', textAlign: 'center', lineHeight: 20 }}>{f.desc}</Text>

      <TouchableOpacity
        onPress={() => signUp()}
        style={{ marginTop: 24, backgroundColor: '#7C3AED', borderRadius: 100, paddingHorizontal: 28, paddingVertical: 12 }}
      >
        <Text style={{ fontSize: 14, fontFamily: 'Nunito_900Black', color: '#FFFFFF' }}>🚀 Try It Free!</Text>
      </TouchableOpacity>
    </View>
  ));

  const ctaSlides = CTA_SLIDES.map((slide) => (
    <View
      key={slide.title}
      style={{ width: W, height: H, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
    >
      <Text style={{ fontSize: 70, marginBottom: 16 }}>{slide.emoji}</Text>
      <Text style={{ fontSize: 22, fontFamily: 'Nunito_900Black', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 }}>{slide.title}</Text>
      <Text style={{ fontSize: 14, fontFamily: 'Nunito_700Bold', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>{slide.subtitle}</Text>

      <TouchableOpacity
        onPress={() => signUp()}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 100, paddingHorizontal: 28, paddingVertical: 14 }}
      >
        <Text style={{ fontSize: 14, fontFamily: 'Nunito_900Black', color: slide.bg }}>{slide.cta}</Text>
      </TouchableOpacity>
    </View>
  ));

  const allSlides = [heroSlide, ...featureSlides, ...ctaSlides];
  
  const slideBgs = [
    '#FAF5FF',
    ...FEATURES.map(f => f.bg),
    ...CTA_SLIDES.map(s => s.bg),
  ];

  const scrollXMapped = scrollX.interpolate({
    inputRange: allSlides.map((_, i) => i * W),
    outputRange: slideBgs,
    extrapolate: 'clamp',
  });

  const currentBg = slideBgs[activeSlide] || '#FAF5FF';
  const isDark = ['#7C3AED', '#EC4899', '#F59E0B'].includes(currentBg);

  return (
    <Animated.View style={{ flex: 1, backgroundColor: scrollXMapped }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Animated.FlatList
        ref={flatRef}
        data={allSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <View style={{ width: W, height: H }}>{item}</View>}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: false,
            listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / W);
              if (idx !== activeSlide) {
                setActiveSlide(idx);
              }
            }
          }
        )}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
      />

      {/* Top Page Progress Indicator */}
      <View style={{ position: 'absolute', top: insets.top + 6, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        {allSlides.map((_, i) => (
          <View 
            key={i} 
            style={{ 
              width: i === activeSlide ? 14 : 5, 
              height: 5, 
              borderRadius: 2.5, 
              backgroundColor: i === activeSlide ? (isDark ? '#FFFFFF' : '#7C3AED') : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(124,58,237,0.2)') 
            }} 
          />
        ))}
      </View>
    </Animated.View>
  );
}