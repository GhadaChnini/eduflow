import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/utils/auth/useAuth';
import { authFetch } from '@/utils/auth/getSession';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  Nunito_600SemiBold,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';

export default function MobileCourses() {
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const res = await authFetch('/api/enrollments');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!auth,
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await authFetch('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  if (!fontsLoaded) return null;

  const filteredCourses = coursesData?.courses?.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const CARD_COLORS = [
    { bg: '#EDE9FE', border: '#C4B5FD' },
    { bg: '#FEF3C7', border: '#FCD34D' },
    { bg: '#D1FAE5', border: '#6EE7B7' },
    { bg: '#FCE7F3', border: '#F9A8D4' },
    { bg: '#FFEDD5', border: '#FDBA74' },
    { bg: '#DBEAFE', border: '#93C5FD' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF5FF', paddingTop: insets.top }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 4,
          borderBottomColor: '#C4B5FD',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'Nunito_900Black',
            color: '#3B0764',
            marginBottom: 12,
          }}
        >
          📚 Cool Courses!
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F5F3FF',
            borderWidth: 3,
            borderColor: '#C4B5FD',
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <TextInput
            placeholder="Search for fun courses..."
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              fontSize: 14,
              fontFamily: 'Nunito_700Bold',
              color: '#3B0764',
            }}
            placeholderTextColor="#C4B5FD"
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 48 }}>🌀</Text>
            <Text style={{ fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#7C3AED' }}>
              Loading cool courses...
            </Text>
            <ActivityIndicator color="#7C3AED" size="large" />
          </View>
        ) : (
          filteredCourses?.map((course: any, index: number) => {
            const isEnrolled = myEnrollments?.enrollments?.some(
              (e: any) => e.course_id === course.id
            );
            const colorScheme = CARD_COLORS[index % CARD_COLORS.length];
            return (
              <View
                key={course.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 3,
                  borderColor: colorScheme.border,
                  borderRadius: 24,
                  overflow: 'hidden',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                }}
              >
                {/* Course image/icon area */}
                <View
                  style={{
                    height: 140,
                    backgroundColor: colorScheme.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Text style={{ fontSize: 64 }}>{course.type === 'video' ? '🎬' : '📄'}</Text>
                  {/* Price badge */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: course.price === '0.00' ? '#D1FAE5' : '#FEF3C7',
                      borderWidth: 2,
                      borderColor: course.price === '0.00' ? '#6EE7B7' : '#FCD34D',
                      borderRadius: 100,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Nunito_900Black',
                        color: course.price === '0.00' ? '#059669' : '#D97706',
                      }}
                    >
                      {course.price === '0.00' ? '🆓 Free!' : `💰 $${course.price}`}
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 16 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontFamily: 'Nunito_900Black',
                      color: '#3B0764',
                      marginBottom: 4,
                    }}
                  >
                    {course.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Nunito_600SemiBold',
                      color: '#7E22CE',
                      marginBottom: 16,
                    }}
                    numberOfLines={2}
                  >
                    {course.description}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 100,
                          backgroundColor: colorScheme.bg,
                          borderWidth: 2,
                          borderColor: colorScheme.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{ fontSize: 12, fontFamily: 'Nunito_900Black', color: '#7C3AED' }}
                        >
                          {course.teacher_name?.[0] || '?'}
                        </Text>
                      </View>
                      <Text
                        style={{ fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#9CA3AF' }}
                      >
                        {course.teacher_name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      disabled={isEnrolled || enrollMutation.isPending}
                      onPress={() => (auth ? enrollMutation.mutate(course.id) : null)}
                      style={{
                        backgroundColor: isEnrolled ? '#D1FAE5' : '#7C3AED',
                        borderRadius: 100,
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        shadowColor: isEnrolled ? 'transparent' : '#7C3AED',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Nunito_900Black',
                          color: isEnrolled ? '#059669' : '#FFFFFF',
                        }}
                      >
                        {isEnrolled ? '✅ Joined!' : enrollMutation.isPending ? '...' : '🚀 Join!'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        {!isLoading && filteredCourses?.length === 0 && (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 64 }}>🔍</Text>
            <Text style={{ fontSize: 18, fontFamily: 'Nunito_900Black', color: '#3B0764' }}>
              No courses found!
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#7E22CE' }}>
              Try a different search term.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
