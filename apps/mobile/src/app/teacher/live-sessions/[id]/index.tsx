import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

const TABS = ['Overview', 'Attendance', 'Waiting List', 'Recording'];

export default function LiveSessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchData = useCallback(async () => {
    try {
      const [sessionRes, attendanceRes, waitingRes] = await Promise.all([
        authFetch('/api/teacher/session'),
        authFetch(`/api/teacher/attendance?session_id=${id}`),
        authFetch(`/api/teacher/waiting-list?session_id=${id}`),
      ]);

      const sessionData = await sessionRes.json();
      const attendanceData = await attendanceRes.json();
      const waitingData = await waitingRes.json();

      const found = sessionData.sessions?.find((s: any) => s.id === id);
      if (found) setSession(found);
      if (attendanceData.attendance) setAttendance(attendanceData);
      if (waitingData.waiting_list) setWaitingList(waitingData.waiting_list);
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

  const updateStatus = async (status: string) => {
    const label = status === 'live' ? 'Start' : 'End';
    Alert.alert(`${label} Session`, `Are you sure you want to ${label.toLowerCase()} this session?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: status === 'ended' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await authFetch('/api/teacher/session', {
              method: 'PUT',
              body: JSON.stringify({ session_id: id, status }),
            });
            setSession((prev: any) => ({ ...prev, status }));
          } catch (e) {
            Alert.alert('Error', 'Failed to update session');
          }
        },
      },
    ]);
  };

  const admitFromWaitingList = async (student_id: string) => {
    try {
      await authFetch('/api/teacher/waiting-list', {
        method: 'PUT',
        body: JSON.stringify({ session_id: id, student_id }),
      });
      setWaitingList((prev) => prev.filter((w) => w.student_id !== student_id));
      Alert.alert('✅ Admitted', 'Student has been admitted from waiting list');
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to admit student');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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
      <View style={[styles.header, session?.status === 'live' && styles.headerLive]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {session?.status === 'live' ? '🔴 LIVE: ' : '🎥 '}{session?.title || 'Session'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Bar */}
      {session?.status === 'live' && (
        <View style={styles.liveBar}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Session is LIVE</Text>
          <TouchableOpacity onPress={() => updateStatus('ended')}>
            <Text style={styles.endText}>End Session</Text>
          </TouchableOpacity>
        </View>
      )}
      {session?.status === 'scheduled' && (
        <View style={styles.scheduledBar}>
          <Text style={styles.scheduledText}>📅 {formatDate(session?.scheduled_at)}</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => updateStatus('live')}>
            <Text style={styles.startBtnText}>▶️ Start Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#2563EB" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Session Info</Text>
              <Text style={styles.infoRow}>📋 Status: <Text style={styles.infoValue}>{session?.status}</Text></Text>
              <Text style={styles.infoRow}>💰 Price: <Text style={styles.infoValue}>{session?.is_paid ? `${session?.price} TND` : 'Free'}</Text></Text>
              <Text style={styles.infoRow}>👥 Max Students: <Text style={styles.infoValue}>{session?.max_students}</Text></Text>
              <Text style={styles.infoRow}>📅 Scheduled: <Text style={styles.infoValue}>{formatDate(session?.scheduled_at)}</Text></Text>
            </View>

            {/* Meeting Link */}
            {session?.meeting_url && (
              <TouchableOpacity
                style={styles.meetingBtn}
                onPress={() => Linking.openURL(session.meeting_url)}
              >
                <Text style={styles.meetingBtnIcon}>🔗</Text>
                <Text style={styles.meetingBtnText}>Open Meeting Link</Text>
              </TouchableOpacity>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/teacher/live-sessions/${id}/attendance` as any)}
              >
                <Text style={styles.actionCardIcon}>✅</Text>
                <Text style={styles.actionCardLabel}>Attendance</Text>
                <Text style={styles.actionCardStat}>{attendance?.stats?.attended || 0} attended</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => setActiveTab('Waiting List')}
              >
                <Text style={styles.actionCardIcon}>⏳</Text>
                <Text style={styles.actionCardLabel}>Waiting List</Text>
                <Text style={styles.actionCardStat}>{waitingList.length} waiting</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/teacher/live-sessions/${id}/recording` as any)}
              >
                <Text style={styles.actionCardIcon}>🎬</Text>
                <Text style={styles.actionCardLabel}>Recording</Text>
                <Text style={styles.actionCardStat}>{session?.recording_url ? 'Available' : 'Not recorded'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/teacher/grades' as any)}
              >
                <Text style={styles.actionCardIcon}>⭐</Text>
                <Text style={styles.actionCardLabel}>Grades</Text>
                <Text style={styles.actionCardStat}>Grade students</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Attendance Tab */}
        {activeTab === 'Attendance' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.fullBtn}
              onPress={() => router.push(`/teacher/live-sessions/${id}/attendance` as any)}
            >
              <Text style={styles.fullBtnText}>
                ✅ Manage Attendance ({attendance?.stats?.attended || 0}/{attendance?.stats?.total || 0}) →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Waiting List Tab */}
        {activeTab === 'Waiting List' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Waiting List ({waitingList.length})</Text>
            {waitingList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>No one on waiting list</Text>
              </View>
            ) : (
              waitingList.map((w) => (
                <View key={w.id} style={styles.waitingCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{w.student_name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.waitingInfo}>
                    <Text style={styles.waitingName}>{w.student_name}</Text>
                    <Text style={styles.waitingDate}>
                      Joined {new Date(w.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.admitBtn}
                    onPress={() => admitFromWaitingList(w.student_id)}
                  >
                    <Text style={styles.admitBtnText}>Admit</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Recording Tab */}
        {activeTab === 'Recording' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.fullBtn}
              onPress={() => router.push(`/teacher/live-sessions/${id}/recording` as any)}
            >
              <Text style={styles.fullBtnText}>🎬 Manage Recording →</Text>
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
  headerLive: { backgroundColor: '#DC2626' },
  backBtn: { padding: 4 },
  backIcon: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold', flex: 1, marginHorizontal: 12 },
  liveBar: {
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' },
  liveText: { flex: 1, fontSize: 13, color: '#DC2626', fontFamily: 'Nunito_700Bold' },
  endText: { fontSize: 13, color: '#DC2626', fontFamily: 'Nunito_700Bold', textDecorationLine: 'underline' },
  scheduledBar: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  scheduledText: { flex: 1, fontSize: 12, color: '#2563EB', fontFamily: 'Nunito_600SemiBold' },
  startBtn: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  startBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Nunito_700Bold' },
  tabRow: { marginTop: 12, marginBottom: 4 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  tabText: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: { gap: 14 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937', marginBottom: 4 },
  infoRow: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  infoValue: { color: '#1F2937', fontFamily: 'Nunito_600SemiBold' },
  meetingBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  meetingBtnIcon: { fontSize: 20 },
  meetingBtnText: { fontSize: 14, color: '#2563EB', fontFamily: 'Nunito_700Bold' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionCardIcon: { fontSize: 28 },
  actionCardLabel: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  actionCardStat: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  waitingCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  waitingInfo: { flex: 1 },
  waitingName: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  waitingDate: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginTop: 2 },
  admitBtn: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  admitBtnText: { fontSize: 13, color: '#2563EB', fontFamily: 'Nunito_700Bold' },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  fullBtn: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 16, alignItems: 'center' },
  fullBtnText: { color: '#2563EB', fontSize: 14, fontFamily: 'Nunito_700Bold' },
});