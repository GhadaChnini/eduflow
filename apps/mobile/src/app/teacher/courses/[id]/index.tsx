import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';
import { Image } from 'expo-image';

const TABS = ['Overview', 'Students', 'Reviews', 'Certificates'];

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch(`/api/teacher/analytics?course_id=${id}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const issueCertificate = async (student_id: string) => {
    try {
      const res = await authFetch('/api/teacher/certificate', {
        method: 'POST',
        body: JSON.stringify({ student_id, course_id: id }),
      });
      const json = await res.json();
      if (json.error) {
        Alert.alert('Error', json.error);
      } else {
        Alert.alert('🏆 Certificate Issued!', 'Student has been notified');
        fetchData();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to issue certificate');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const course = data?.course;
  const students = data?.students || [];
  const trend = data?.enrollment_trend || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course?.title || 'Course Detail'}</Text>
        <TouchableOpacity onPress={() => router.push(`/teacher/courses/${id}/certificate` as any)}>
          <Text style={styles.certText}>🏆 Certs</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <View style={styles.section}>
            {/* Thumbnail */}
            {course?.thumbnail_url ? (
              <Image source={{ uri: course.thumbnail_url }} style={styles.thumbnail} contentFit="cover" />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={{ fontSize: 48 }}>📚</Text>
              </View>
            )}

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{course?.total_enrolled || 0}</Text>
                <Text style={styles.statLabel}>👥 Enrolled</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{course?.total_completed || 0}</Text>
                <Text style={styles.statLabel}>✅ Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{parseFloat(course?.avg_rating || 0).toFixed(1)}</Text>
                <Text style={styles.statLabel}>⭐ Rating</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{course?.total_views || 0}</Text>
                <Text style={styles.statLabel}>👁 Views</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{course?.total_reviews || 0}</Text>
                <Text style={styles.statLabel}>💬 Reviews</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{course?.price > 0 ? `${course.price} TND` : 'Free'}</Text>
                <Text style={styles.statLabel}>💰 Price</Text>
              </View>
            </View>

            {/* Course Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Course Info</Text>
              <Text style={styles.infoRow}>📋 Status: <Text style={styles.infoValue}>{course?.status}</Text></Text>
              <Text style={styles.infoRow}>🎯 Type: <Text style={styles.infoValue}>{course?.type}</Text></Text>
              <Text style={styles.infoRow}>📁 Category: <Text style={styles.infoValue}>{course?.category_name || 'None'}</Text></Text>
            </View>

            {/* Enrollment Trend */}
            {trend.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>📈 Enrollment Trend (30 days)</Text>
                {trend.map((t: any) => (
                  <View key={t.date} style={styles.trendRow}>
                    <Text style={styles.trendDate}>{t.date}</Text>
                    <View style={styles.trendBar}>
                      <View style={[styles.trendFill, { width: `${Math.min(t.count * 20, 100)}%` }]} />
                    </View>
                    <Text style={styles.trendCount}>{t.count}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/teacher/courses/${id}/students` as any)}
              >
                <Text style={styles.actionBtnText}>👥 Students</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/teacher/courses/${id}/reviews` as any)}
              >
                <Text style={styles.actionBtnText}>⭐ Reviews</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Students Tab */}
        {activeTab === 'Students' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{students.length} Student(s) Enrolled</Text>
            {students.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No students yet</Text>
              </View>
            ) : (
              students.map((s: any) => (
                <View key={s.id} style={styles.studentCard}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {s.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <View style={styles.progressRow}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${s.progress || 0}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{s.progress || 0}%</Text>
                    </View>
                    <Text style={styles.studentStat}>
                      Quiz avg: {parseFloat(s.avg_quiz_score || 0).toFixed(0)}%
                      {s.completed ? ' ✅ Completed' : ''}
                    </Text>
                  </View>
                  {!s.completed && (
                    <TouchableOpacity
                      style={styles.certBtn}
                      onPress={() => issueCertificate(s.id)}
                    >
                      <Text style={styles.certBtnText}>🏆</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Reviews Tab */}
        {activeTab === 'Reviews' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.fullBtn}
              onPress={() => router.push(`/teacher/courses/${id}/reviews` as any)}
            >
              <Text style={styles.fullBtnText}>View All Reviews →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Certificates Tab */}
        {activeTab === 'Certificates' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.fullBtn}
              onPress={() => router.push(`/teacher/courses/${id}/certificate` as any)}
            >
              <Text style={styles.fullBtnText}>Manage Certificates →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#7C3AED',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4 },
  backIcon: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold', flex: 1, marginHorizontal: 12 },
  certText: { color: '#DDD6FE', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  tabRow: { marginTop: 12, marginBottom: 4 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  tabText: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: { gap: 14 },
  thumbnail: { width: '100%', height: 180, borderRadius: 16 },
  thumbnailPlaceholder: {
    width: '100%', height: 180, borderRadius: 16,
    backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '30%', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontFamily: 'Nunito_600SemiBold', textAlign: 'center' },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, gap: 8,
  },
  infoTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937', marginBottom: 4 },
  infoRow: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  infoValue: { color: '#1F2937', fontFamily: 'Nunito_600SemiBold' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  trendDate: { fontSize: 11, color: '#6B7280', width: 60, fontFamily: 'Nunito_400Regular' },
  trendBar: { flex: 1, height: 8, backgroundColor: '#EDE9FE', borderRadius: 4 },
  trendFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  trendCount: { fontSize: 11, color: '#7C3AED', fontFamily: 'Nunito_700Bold', width: 20, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, backgroundColor: '#EDE9FE', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  actionBtnText: { color: '#7C3AED', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  studentCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  studentAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#EDE9FE', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#7C3AED', fontFamily: 'Nunito_700Bold' },
  studentStat: { fontSize: 11, color: '#6B7280', marginTop: 2, fontFamily: 'Nunito_400Regular' },
  certBtn: {
    backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10,
  },
  certBtnText: { fontSize: 20 },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  fullBtn: {
    backgroundColor: '#EDE9FE', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  fullBtnText: { color: '#7C3AED', fontSize: 14, fontFamily: 'Nunito_700Bold' },
});