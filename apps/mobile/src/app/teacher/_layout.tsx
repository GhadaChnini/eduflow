import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/utils/auth/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function TeacherLayout() {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && (!user || (user.role !== 'teacher' && user.role !== 'admin'))) {
      router.replace('/');
    }
  }, [isReady, user]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F9FAFB' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
      <Stack.Screen name="courses/index" options={{ headerShown: false }} />
      <Stack.Screen name="courses/create" options={{ headerShown: false }} />
      <Stack.Screen name="courses/[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="courses/[id]/students" options={{ headerShown: false }} />
      <Stack.Screen name="courses/[id]/reviews" options={{ headerShown: false }} />
      <Stack.Screen name="courses/[id]/certificate" options={{ headerShown: false }} />
      <Stack.Screen name="live-sessions/index" options={{ headerShown: false }} />
      <Stack.Screen name="live-sessions/create" options={{ headerShown: false }} />
      <Stack.Screen name="live-sessions/[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="live-sessions/[id]/attendance" options={{ headerShown: false }} />
      <Stack.Screen name="live-sessions/[id]/recording" options={{ headerShown: false }} />
      <Stack.Screen name="live-sessions/waiting-list/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="announcements/index" options={{ headerShown: false }} />
      <Stack.Screen name="announcements/create" options={{ headerShown: false }} />
      <Stack.Screen name="messages/index" options={{ headerShown: false }} />
      <Stack.Screen name="quiz/index" options={{ headerShown: false }} />
      <Stack.Screen name="quiz/create" options={{ headerShown: false }} />
      <Stack.Screen name="grades/index" options={{ headerShown: false }} />
      <Stack.Screen name="games/index" options={{ headerShown: false }} />
      <Stack.Screen name="games/wordwall" options={{ headerShown: false }} />
      <Stack.Screen name="games/blooket" options={{ headerShown: false }} />
      <Stack.Screen name="games/custom/memory" options={{ headerShown: false }} />
      <Stack.Screen name="games/custom/wordscramble" options={{ headerShown: false }} />
      <Stack.Screen name="games/custom/mathchallenge" options={{ headerShown: false }} />
      <Stack.Screen name="earnings/index" options={{ headerShown: false }} />
      <Stack.Screen name="browse/index" options={{ headerShown: false }} />
      <Stack.Screen name="browse/teachers/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="browse/students/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/index" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="profile/payment" options={{ headerShown: false }} />
      <Stack.Screen name="profile/security" options={{ headerShown: false }} />
    </Stack>
  );
}