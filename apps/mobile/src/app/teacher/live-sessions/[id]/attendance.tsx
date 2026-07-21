import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

export default function SessionAttendanceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notAttended, setNotAttended] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await authFetch(`/api/teacher/attendance?session_id=${id}`);
      const data = await res.json();
      if (data.attendance) setAttendance(data.attendance);
      if (data.not_attended) setNotAttended(data.not_attended);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const toggleAttendance = async (student_id: string, attended: boolean) => {
    try {
      await authFetch('/api/teacher/attendance', {
        method: 'POST',
        body: JSON.stringify({ session_id: id, student_id, attended }),
      });
      setAttendance((prev) =>
        prev.map((a) => (a.student_id === student_id ? { ...a, attended } : a))
      );
      setStats((prev: any) => ({
        ...prev,
        attended: attended
          ? parseInt(prev.attended) + 1
          : parseInt(prev.attended) - 1,
        absent: attended
          ? parseInt(prev.absent) - 1
          : parseInt(prev.absent) + 1,
      }));
    } catch (e) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const markAllPresent = async () => {
    Alert.alert('Mark All Present', 'Mark all students as attended?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark All',
        onPress: async () => {
          setSaving(true);
          try {
            const allStudents = [
              ...attendance.map((a) => ({ student_id: a.student_id, attended: true })),
              ...notAttended.map((s) => ({ student_id: s.id, attended: true })),
            ];
            await authFetch('/api/teacher/attendance', {
              method: 'PUT',
              body: JSON.stringify({ session_id: id, attendances: allStudents }),
            });
            fetchAttendance();
          } catch (e) {
            Alert.alert('Error', 'Failed to mark all present');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const addStudent = async (student_id: string) => {
    try {
      await authFetch('/api/teacher/attendance', {
        method: 'POST',
        body: JSON.stringify({ session_id: id, student_id, attended: true }),
      });
      fetchAttendance();
    } catch (e) {
      Alert.alert('Error', 'Failed to add student');
    }
  };

  const filteredAttendance = attendance.filter((a) =>
    a.student_name?.toLowerCase().includes(search.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>✅ Attendance</Text>
        <TouchableOpacity onPress={markAllPresent} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.markAllText}>Mark All</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statValue, { color: '#059669' }]}>{stats?.attended || 0}</Text>
          <Text style={styles.statLabel}>✅ Present</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats?.absent || 0}</Text>
          <Text style={styles.statLabel}>❌ Absent</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EDE9FE' }]}>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>{stats?.total || 0}</Text>
          <Text style={styles.statLabel}>👥 Total</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAttendance(); }}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Attendance List */}
        {filteredAttendance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enrolled Students</Text>
            {filteredAttendance.map((a) => (
              <View key={a.student_id} style={styles.studentCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {a.student_name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{a.student_name}</Text>
                  <Text style={styles.studentEmail}>{a.student_email}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.attendanceBtn,
                    a.attended ? styles.attendanceBtnPresent : styles.attendanceBtnAbsent,
                  ]}
                  onPress={() => toggleAttendance(a.student_id, !a.attended)}
                >
                  <Text style={styles.attendanceBtnText}>
                    {a.attended ? '✅ Present' : '❌ Absent'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Not Yet Recorded */}
        {notAttended.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not Yet Recorded ({notAttended.length})</Text>
            {notAttended
              .filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()))
              .map((s) => (
                <View key={s.id} style={styles.studentCard}>
                  <View style={[styles.avatar, { backgroundColor: '#9CA3AF' }]}>
                    <Text style={styles.avatarText}>{s.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.studentEmail}>{s.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => addStudent(s.id)}
                  >
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        )}

        {attendance.length === 0 && notAttended.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No students enrolled yet</Text>
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
  backBtn: { padding: 4 },
  backIcon: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  markAllText: { color: '#BFDBFE', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold' },
  statLabel: { fontSize: 11, color: '#374151', marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937', fontFamily: 'Nunito_400Regular' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 20, gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  studentEmail: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginTop: 1 },
  attendanceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  attendanceBtnPresent: { backgroundColor: '#D1FAE5' },
  attendanceBtnAbsent: { backgroundColor: '#FEE2E2' },
  attendanceBtnText: { fontSize: 12, fontFamily: 'Nunito_700Bold' },
  addBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 12, color: '#2563EB', fontFamily: 'Nunito_700Bold' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
});