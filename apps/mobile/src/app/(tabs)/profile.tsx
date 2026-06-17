import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/utils/auth/useAuth';
import { authFetch } from '@/utils/auth/getSession';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  Nunito_600SemiBold,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';

const MENU_ITEMS = [
  { emoji: '👤', label: 'My Info', bg: '#EDE9FE', border: '#C4B5FD' },
  { emoji: '🏆', label: 'My Badges', bg: '#FEF3C7', border: '#FCD34D' },
  { emoji: '📝', label: 'My Bio', bg: '#D1FAE5', border: '#6EE7B7' },
];

export default function MobileProfile() {
  const insets = useSafeAreaInsets();
  const { auth, signOut, signIn } = useAuth();

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

  if (!fontsLoaded) return null;

  if (!auth) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FAF5FF',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          paddingTop: insets.top,
        }}
      >
        <StatusBar style="dark" />
        <Text style={{ fontSize: 72, marginBottom: 16 }}>🙋</Text>
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'Nunito_900Black',
            color: '#3B0764',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Who are you? 😄
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Nunito_600SemiBold',
            color: '#7E22CE',
            textAlign: 'center',
            marginBottom: 36,
          }}
        >
          Sign in to see your profile!
        </Text>
        <TouchableOpacity
          onPress={() => signIn()}
          style={{
            backgroundColor: '#7C3AED',
            borderRadius: 100,
            paddingHorizontal: 48,
            paddingVertical: 16,
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: 'Nunito_900Black' }}>
            ✨ Sign In
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleEmoji =
    profile?.user?.role === 'admin' ? '👑' : profile?.user?.role === 'teacher' ? '🍎' : '🎓';
  const roleLabel =
    profile?.user?.role === 'admin'
      ? 'Admin'
      : profile?.user?.role === 'teacher'
        ? 'Teacher'
        : 'Student';

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF5FF', paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Profile Header */}
        <View
          style={{
            backgroundColor: '#7C3AED',
            paddingTop: 32,
            paddingBottom: 40,
            paddingHorizontal: 20,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: '#EDE9FE',
              borderWidth: 4,
              borderColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}
          >
            <Text style={{ fontSize: 48, fontFamily: 'Nunito_900Black', color: '#7C3AED' }}>
              {auth.user.name[0]}
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontFamily: 'Nunito_900Black', color: '#FFFFFF' }}>
            {auth.user.name}
          </Text>
          <Text
            style={{ fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#DDD6FE', marginTop: 4 }}
          >
            {auth.user.email}
          </Text>
          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#FFFFFF',
              borderRadius: 100,
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 18 }}>{roleEmoji}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Nunito_900Black', color: '#7C3AED' }}>
              {roleLabel}
            </Text>
          </View>
        </View>

        {/* Stats Banner */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: -20,
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            borderWidth: 3,
            borderColor: '#C4B5FD',
            flexDirection: 'row',
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            overflow: 'hidden',
          }}
        >
          {[
            { emoji: '⭐', value: String(profile?.user?.points || 0), label: 'Points' },
            { emoji: '🏆', value: '4', label: 'Badges' },
            { emoji: '📚', value: '3', label: 'Courses' },
          ].map((s, i) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 16,
                borderRightWidth: i < 2 ? 2 : 0,
                borderRightColor: '#EDE9FE',
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 2 }}>{s.emoji}</Text>
              <Text style={{ fontSize: 18, fontFamily: 'Nunito_900Black', color: '#3B0764' }}>
                {s.value}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: 'Nunito_700Bold', color: '#9CA3AF' }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ padding: 20, gap: 16, marginTop: 8 }}>
          {/* Menu Items */}
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Nunito_900Black',
              color: '#3B0764',
              marginBottom: 4,
            }}
          >
            ⚙️ My Settings
          </Text>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 3,
                borderColor: item.border,
                borderRadius: 18,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: item.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontFamily: 'Nunito_800ExtraBold',
                  color: '#3B0764',
                }}
              >
                {item.label}
              </Text>
              <Text style={{ fontSize: 18, color: '#C4B5FD' }}>→</Text>
            </TouchableOpacity>
          ))}

          {profile?.user?.role === 'admin' && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 3,
                borderColor: '#FCD34D',
                borderRadius: 18,
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#FEF3C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>👑</Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontFamily: 'Nunito_800ExtraBold',
                  color: '#3B0764',
                }}
              >
                Admin Panel
              </Text>
              <Text style={{ fontSize: 18, color: '#C4B5FD' }}>→</Text>
            </TouchableOpacity>
          )}

          {/* Sign Out */}
          <TouchableOpacity
            onPress={() => signOut()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 16,
              backgroundColor: '#FFF1F2',
              borderRadius: 18,
              borderWidth: 3,
              borderColor: '#FECDD3',
              marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 24 }}>👋</Text>
            <Text style={{ fontSize: 18, fontFamily: 'Nunito_900Black', color: '#E11D48' }}>
              Bye-bye! Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
