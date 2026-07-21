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
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  scheduled: { bg: '#DBEAFE', text: '#2563EB', dot: '#2563EB' },
  live: { bg: '#D1FAE5', text: '#059669', dot: '#059669' },
  ended: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
};

export default function LiveSessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchSessions = useCallback(async () => {
    try {
      const res = await authFetch('/api/teacher/session');
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startSession = async (session_id: string) => {
    try {
      const res = await authFetch('/api/teacher/session', {
        method: 'PUT',
        body: JSON.stringify({ session_id, status: 'live' }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        setSessions((prev) =>
          prev.map((s) => (s.id === session_id ? { ...s, status: 'live' } : s))
        );
        router.push(`/teacher/live-sessions/${session_id}` as any);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const endSession = async (session_id: string) => {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch('/api/teacher/session', {
              method: 'PUT',
              body: JSON.stringify({ session_id, status: 'ended' }),
            });
            setSessions((prev) =>
              prev.map((s) => (s.id === session_id ? { ...s, status: 'ended' } : s))
            );
          } catch (e) {
            Alert.alert('Error', 'Failed to end session');
          }
        },
      },
    ]);
  };

  const filtered = sessions.filter((s) =>
    activeFilter === 'all' ? true : s.status === activeFilter
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎥 Live Sessions</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/teacher/live-sessions/create')}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {['all', 'scheduled', 'live', 'ended'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f)}
          >
            {f === 'live' && <View style={styles.liveDot} />}
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSessions(); }}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎥</Text>
            <Text style={styles.emptyTitle}>No sessions found</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/teacher/live-sessions/create')}
            >
              <Text style={styles.createBtnText}>+ Schedule a Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((session) => {
            const statusStyle = STATUS_COLORS[session.status] || STATUS_COLORS.scheduled;
            return (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => router.push(`/teacher/live-sessions/${session.id}` as any)}
                activeOpacity={0.8}
              >
                {/* Status Badge */}
                <View style={styles.cardTop}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {session.status.toUpperCase()}
                    </Text>
                  </View>
                  {session.is_paid && (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidText}>💰 {session.price} TND</Text>
                    </View>
                  )}
                  {!session.is_paid && (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeText}>Free</Text>
                    </View>
                  )}
                </View>

                {/* Session Info */}
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionDate}>📅 {formatDate(session.scheduled_at)}</Text>

                {/* Stats */}
                <View style={styles.sessionStats}>
                  <Text style={styles.sessionStat}>
                    👥 {session.max_students || 30} max
                  </Text>
                  {session.recording_url && (
                    <Text style={styles.sessionStat}>🎬 Recording available</Text>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  {session.status === 'scheduled' && (
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => startSession(session.id)}
                    >
                      <Text style={styles.startBtnText}>▶️ Start</Text>
                    </TouchableOpacity>
                  )}
                  {session.status === 'live' && (
                    <TouchableOpacity
                      style={styles.endBtn}
                      onPress={() => endSession(session.id)}
                    >
                      <Text style={styles.endBtnText}>⏹ End Session</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/teacher/live-sessions/${session.id}/attendance` as any)}
                  >
                    <Text style={styles.actionBtnText}>✅ Attendance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/teacher/live-sessions/waiting-list/${session.id}` as any)}
                  >
                    <Text style={styles.actionBtnText}>⏳ Waitlist</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#2563EB',
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
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  addBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: '#2563EB', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  filterRow: { marginTop: 12, marginBottom: 4 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  filterTextActive: { color: '#fff' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  createBtn: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  createBtnText: { color: '#fff', fontFamily: 'Nunito_700Bold', fontSize: 14 },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Nunito_700Bold' },
  paidBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  paidText: { fontSize: 11, color: '#059669', fontFamily: 'Nunito_700Bold' },
  freeBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  freeText: { fontSize: 11, color: '#7C3AED', fontFamily: 'Nunito_700Bold' },
  sessionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  sessionDate: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  sessionStats: { flexDirection: 'row', gap: 12 },
  sessionStat: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  startBtn: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startBtnText: { fontSize: 13, color: '#059669', fontFamily: 'Nunito_700Bold' },
  endBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  endBtnText: { fontSize: 13, color: '#DC2626', fontFamily: 'Nunito_700Bold' },
  actionBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, color: '#7C3AED', fontFamily: 'Nunito_700Bold' },
});