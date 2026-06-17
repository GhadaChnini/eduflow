import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  Nunito_600SemiBold,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';

const { width: W, height: H } = Dimensions.get('window');

const BADGE_LIST = [
  { emoji: '🌟', label: 'Star Learner' },
  { emoji: '🚀', label: 'Rocket Kid' },
  { emoji: '📚', label: 'Bookworm' },
  { emoji: '💪', label: 'Go-Getter' },
];

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
    title: CTA_TITLE, // "Ready to become a learning hero?"
    subtitle: CTA_SUBTITLE,
    cta: '🌟 Start My Journey!',
    bg: '#7C3AED',
  },
];

function Dots({ total, active }: { total: number; active: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          style={{
            width: i === active ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
          }}
        />
      ))}
    </View>
  );
}

export default function MobileDashboard() {
  const insets = useSafeAreaInsets();
  const { auth, isReady, signIn, signUp } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
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

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const res = await authFetch('/api/enrollments');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!auth,
  });

  if (!fontsLoaded || !isReady) return null;

  // ─── SLIDE 1: HERO SLIDE (With Integrated Teacher Access Button) ───
  const heroSlide = (
    <View
      key="hero"
      style={{ width: W, height: H, backgroundColor: '#FAF5FF', paddingTop: insets.top, paddingBottom: insets.bottom + 40, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ position: 'absolute', top: insets.top + 10, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>🌟</Text>
          </View>
          <View>
            <Text style={{ fontSize: 18, fontFamily: 'Nunito_900Black', color: '#7C3AED' }}>{APP_NAME}</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Nunito_700Bold', color: '#EC4899' }}>{APP_TAGLINE}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => signIn()}
          style={{ backgroundColor: '#EDE9FE', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: '#C4B5FD' }}
        >
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' }}>Log In</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: '#EDE9FE', borderRadius: 100, borderWidth: 2, borderColor: '#C4B5FD', paddingHorizontal: 14, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, marginTop: 50 }}>
        <Text style={{ fontSize: 14 }}>🤖</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#7C3AED' }}>AI-Powered Learning for Kids!</Text>
      </View>

      <Text style={{ fontSize: 32, fontFamily: 'Nunito_900Black', color: '#3B0764', textAlign: 'center', lineHeight: 40, marginBottom: 12 }}>{HERO_TITLE}</Text>
      <Text style={{ fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#6B21A8', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 }}>{HERO_SUBTITLE}</Text>

      {/* Responsive Row/Column Layout Actions Wrapper */}
      <View style={{ width: '100%', gap: 10, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => signUp()}
          style={{ width: '100%', backgroundColor: '#7C3AED', borderRadius: 100, paddingVertical: 16, alignItems: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        >
          <Text style={{ fontSize: 16, fontFamily: 'Nunito_900Black', color: '#FFFFFF' }}>🚀 Start Learning — It's Free!</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {/* Navigate/Trigger Application Flow */}}
          style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 100, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#6366F1' }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'Nunito_800ExtraBold', color: '#4F46E5' }}>👩‍🏫 Teach on EduFlow</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
        {STATS.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: '#E9D5FF', paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Nunito_800ExtraBold', color: '#6D28D9' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ position: 'absolute', bottom: insets.bottom + 15, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#A78BFA' }}>Swipe to discover</Text>
        <Text style={{ fontSize: 14 }}>👉</Text>
      </View>
    </View>
  );

  // ─── SLIDES 2: INDEPENDENT FEATURES SLIDES ───
  const featureSlides = FEATURES.map((f) => (
    <View
      key={f.label}
      style={{ width: W, height: H, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: insets.top, paddingBottom: insets.bottom + 60 }}
    >
      <Text style={{ fontSize: 90, marginBottom: 24 }}>{f.emoji}</Text>
      <Text style={{ fontSize: 28, fontFamily: 'Nunito_900Black', color: '#3B0764', textAlign: 'center', marginBottom: 12, lineHeight: 36 }}>{f.label}</Text>
      <Text style={{ fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: '#4C1D95', textAlign: 'center', lineHeight: 24 }}>{f.desc}</Text>

      <TouchableOpacity
        onPress={() => signUp()}
        style={{ marginTop: 32, backgroundColor: '#7C3AED', borderRadius: 100, paddingHorizontal: 32, paddingVertical: 15 }}
      >
        <Text style={{ fontSize: 15, fontFamily: 'Nunito_900Black', color: '#FFFFFF' }}>🚀 Try It Free!</Text>
      </TouchableOpacity>

      <View style={{ position: 'absolute', bottom: insets.bottom + 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#6D28D9', opacity: 0.45 }}>👈 Swipe 👉</Text>
      </View>
    </View>
  ));

  // ─── SLIDE 3: PREVIEW DASHBOARD MODULE ───
  const previewDashboardSlides = (
    <View
      key="dashboard_preview"
      style={{ width: W, height: H, backgroundColor: '#FAF5FF', paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, justifyContent: 'center', gap: 20 }}
    >
      <Text style={{ fontSize: 22, fontFamily: 'Nunito_900Black', color: '#3B0764', textAlign: 'center' }}>⚡ Student Dashboard Preview</Text>
      
      <View style={{ backgroundColor: '#7C3AED', borderRadius: 20, padding: 16 }}>
        <Text style={{ fontSize: 20, fontFamily: 'Nunito_900Black', color: '#FFFFFF' }}>Hi, Learner! 👋</Text>
        <Text style={{ fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#DDD6FE', marginTop: 2 }}>Ready for an adventure?</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['📚 3 Courses', '🏆 4 Badges', '🌍 Rank #12'].map((txt, idx) => (
          <View key={idx} style={{ flex: 1, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E9D5FF', borderRadius: 14, padding: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' }}>{txt}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
        {BADGE_LIST.slice(0, 3).map((b) => (
          <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FCD34D', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 14 }}>{b.emoji}</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Nunito_800ExtraBold', color: '#D97706' }}>{b.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ position: 'absolute', bottom: insets.bottom + 20, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#A78BFA' }}>👈 Swipe 👉</Text>
      </View>
    </View>
  );

  // ─── SLIDES 4: CTA DECK SLIDES (Finishing with Hero Slide) ───
  const ctaSlides = CTA_SLIDES.map((slide, i) => (
    <View
      key={slide.title}
      style={{ width: W, height: H, backgroundColor: slide.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: insets.top, paddingBottom: insets.bottom + 60 }}
    >
      <Text style={{ fontSize: 80, marginBottom: 20 }}>{slide.emoji}</Text>
      <Text style={{ fontSize: 26, fontFamily: 'Nunito_900Black', color: '#FFFFFF', textAlign: 'center', marginBottom: 12, lineHeight: 34 }}>{slide.title}</Text>
      <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>{slide.subtitle}</Text>

      <TouchableOpacity
        onPress={() => signUp()}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 100, paddingHorizontal: 36, paddingVertical: 18 }}
      >
        <Text style={{ fontSize: 16, fontFamily: 'Nunito_900Black', color: slide.bg }}>{slide.cta}</Text>
      </TouchableOpacity>

      <View style={{ position: 'absolute', bottom: insets.bottom + 20, alignItems: 'center', gap: 8 }}>
        <Dots total={CTA_SLIDES.length} active={i} />
        {i === CTA_SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => signIn()}>
            <Text style={{ fontSize: 13, fontFamily: 'Nunito_700Bold', color: 'rgba(255,255,255,0.6)', marginTop: 4, textDecorationLine: 'underline' }}>Already have an account? Log in</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ));

  // Balanced flat stack mapping layout logic
  const allSlides = [heroSlide, ...featureSlides, previewDashboardSlides, ...ctaSlides];
  
const slideBgs = [
  '#FAF5FF',
  ...FEATURES.map(f => f.bg),
  '#FAF5FF',
  ...CTA_SLIDES.map(s => s.bg),
];

  const currentBg = slideBgs[activeSlide] || '#FAF5FF';
  const isDark = ['#7C3AED', '#EC4899', '#F59E0B'].includes(currentBg);

  return (
    <View style={{ flex: 1, backgroundColor: currentBg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <FlatList
        ref={flatRef}
        data={allSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <View style={{ width: W, height: H }}>{item}</View>}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          setActiveSlide(idx);
        }}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
      />

      {/* Global tracker progress indicator dots layout */}
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
    </View>
  );
}