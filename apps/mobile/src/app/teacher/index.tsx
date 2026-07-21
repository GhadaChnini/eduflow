import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/utils/auth/useAuth';
import { authFetch } from '@/utils/auth/getSession';

const NAV_BUTTONS = [
  { label: 'My Courses', icon: '📚', route: '/teacher/courses', color: '#7C3AED', bg: '#EDE9FE' },
  { label: 'Live Sessions', icon: '🎥', route: '/teacher/live-sessions', color: '#2563EB', bg: '#DBEAFE' },
  { label: 'Quiz Builder', icon: '📝', route: '/teacher/quiz', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Grades', icon: '⭐', route: '/teacher/grades', color: '#059669', bg: '#D1FAE5' },
  { label: 'Games Zone', icon: '🎮', route: '/teacher/games', color: '#DC2626', bg: '#FEE2E2' },
  { label: 'Announcements', icon: '📢', route: '/teacher/announcements', color: '#7C3AED', bg: '#EDE9FE' },
  { label: 'Messages', icon: '💬', route: '/teacher/messages', color: '#0891B2', bg: '#CFFAFE' },
  { label: 'Earnings', icon: '💰', route: '/teacher/earnings', color: '#059669', bg: '#D1FAE5' },
  { label: 'Browse', icon: '🔍', route: '/teacher/browse', color: '#D97706', bg: '#FEF3C7' },
  { label: 'My Profile', icon: '👤', route: '/teacher/profile', color: '#6B7280', bg: '#F3F4F6' },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, notifRes] = await Promise.all([
        authFetch('/api/teacher/analytics'),
        authFetch('/api/teacher/notifications'),
      ]);

      const statsData = await statsRes.json();
      const notifData = await notifRes.json();

      if (statsData.overview) setStats(statsData.overview);
      if (notifData.notifications) {
        setNotifications(notifData.notifications.slice(0, 3));
        setUnread(notifData.unread_count);
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>👋 Welcome back,</Text>
          <Text style={styles.name}>{user?.name || 'Teacher'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/teacher/notifications')}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_courses || 0}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_students || 0}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_enrollments || 0}</Text>
            <Text style={styles.statLabel}>Enrollments</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats?.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔔 Recent Notifications</Text>
              <TouchableOpacity onPress={() => router.push('/teacher/notifications')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {notifications.map((notif) => (
              <View key={notif.id} style={[styles.notifCard, !notif.is_read && styles.notifUnread]}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifMessage} numberOfLines={1}>{notif.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Navigation Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📌 Quick Access</Text>
          <View style={styles.grid}>
            {NAV_BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.route}
                style={[styles.navBtn, { backgroundColor: btn.bg }]}
                onPress={() => router.push(btn.route as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.navIcon}>{btn.icon}</Text>
                <Text style={[styles.navLabel, { color: btn.color }]}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#7C3AED',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: { color: '#DDD6FE', fontSize: 14 },
  name: { color: '#fff', fontSize: 22, fontFamily: 'Nunito_700Bold', marginTop: 2 },
  notifBtn: { position: 'relative', padding: 8 },
  notifIcon: { fontSize: 24 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Nunito_700Bold' },
  scrollContent: { paddingBottom: 32 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  seeAll: { fontSize: 13, color: '#7C3AED', fontFamily: 'Nunito_600SemiBold' },
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  notifUnread: { borderLeftColor: '#7C3AED', backgroundColor: '#FAF5FF' },
  notifTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  notifMessage: { fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: 'Nunito_400Regular' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  navBtn: {
    width: '47%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navIcon: { fontSize: 28 },
  navLabel: { fontSize: 13, fontFamily: 'Nunito_700Bold', textAlign: 'center' },
});