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

export default function WaitingListScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWaitingList = useCallback(async () => {
    try {
      const res = await authFetch(`/api/teacher/waiting-list?session_id=${id}`);
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
    fetchWaitingList();
  }, [fetchWaitingList]);

  const admitStudent = async (student_id: string, student_name: string) => {
    Alert.alert('Admit Student', `Admit ${student_name} to the session?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Admit ✅',
        onPress: async () => {
          try {
            const res = await authFetch('/api/teacher/waiting-list', {
              method: 'PUT',
              body: JSON.stringify({ session_id: id, student_id }),
            });
            const json = await res.json();
            if (json.error) {
              Alert.alert('Error', json.error);
            } else {
              Alert.alert('✅ Admitted!', `${student_name} has been admitted to the session`);
              fetchWaitingList();
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to admit student');
          }
        },
      },
    ]);
  };

  const removeStudent = async (student_id: string, student_name: string) => {
    Alert.alert('Remove Student', `Remove ${student_name} from waiting list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch('/api/teacher/waiting-list', {
              method: 'DELETE',
              body: JSON.stringify({ session_id: id, student_id }),
            });
            fetchWaitingList();
          } catch (e) {
            Alert.alert('Error', 'Failed to remove student');
          }
        },
      },
    ]);
  };

  const admitAll = async () => {
    if (!data?.waiting_list?.length) return;
    Alert.alert(
      'Admit All',
      `Admit all ${data.waiting_list.length} student(s) from waiting list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Admit All ✅',
          onPress: async () => {
            try {
              for (const w of data.waiting_list) {
                await authFetch('/api/teacher/waiting-list', {
                  method: 'PUT',
                  body: JSON.stringify({ session_id: id, student_id: w.student_id }),
                });
              }
              Alert.alert('✅ Done!', 'All students have been admitted');
              fetchWaitingList();
            } catch (e) {
              Alert.alert('Error', 'Failed to admit all students');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const waitingList = data?.waiting_list || [];
  const spotsAvailable = data?.spots_available || 0;
  const session = data?.session;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⏳ Waiting List</Text>
        {waitingList.length > 1 && (
          <TouchableOpacity onPress={admitAll}>
            <Text style={styles.admitAllText}>Admit All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <View style={styles.sessionInfoItem}>
          <Text style={styles.sessionInfoValue}>{waitingList.length}</Text>
          <Text style={styles.sessionInfoLabel}>Waiting</Text>
        </View>
        <View style={styles.sessionInfoDivider} />
        <View style={styles.sessionInfoItem}>
          <Text style={[styles.sessionInfoValue, { color: spotsAvailable > 0 ? '#059669' : '#DC2626' }]}>
            {spotsAvailable}
          </Text>
          <Text style={styles.sessionInfoLabel}>Spots Available</Text>
        </View>
        <View style={styles.sessionInfoDivider} />
        <View style={styles.sessionInfoItem}>
          <Text style={styles.sessionInfoValue}>{session?.max_students || 30}</Text>
          <Text style={styles.sessionInfoLabel}>Max Students</Text>
        </View>
      </View>

      {/* Capacity Bar */}
      <View style={styles.capacitySection}>
        <View style={styles.capacityBar}>
          <View
            style={[
              styles.capacityFill,
              {
                width: `${Math.min(((session?.max_students - spotsAvailable) / session?.max_students) * 100, 100)}%`,
                backgroundColor: spotsAvailable === 0 ? '#DC2626' : '#2563EB',
              },
            ]}
          />
        </View>
        <Text style={styles.capacityText}>
          {session?.max_students - spotsAvailable}/{session?.max_students} spots filled
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchWaitingList(); }}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {waitingList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>No one on waiting list</Text>
            <Text style={styles.emptySubtitle}>
              {spotsAvailable > 0
                ? `${spotsAvailable} spot(s) still available`
                : 'Session is full'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.listTitle}>
              Students waiting to join ({waitingList.length})
            </Text>
            {waitingList.map((w: any, index: number) => (
              <View key={w.id} style={styles.waitingCard}>
                <View style={styles.positionBadge}>
                  <Text style={styles.positionText}>#{index + 1}</Text>
                </View>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {w.student_name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{w.student_name}</Text>
                  <Text style={styles.studentEmail}>{w.student_email}</Text>
                  <Text style={styles.waitingSince}>
                    Waiting since {new Date(w.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.admitBtn]}
                    onPress={() => admitStudent(w.student_id, w.student_name)}
                  >
                    <Text style={styles.admitBtnText}>✅ Admit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.removeBtn]}
                    onPress={() => removeStudent(w.student_id, w.student_name)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
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
  admitAllText: { color: '#BFDBFE', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  sessionInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionInfoItem: { flex: 1, alignItems: 'center' },
  sessionInfoValue: { fontSize: 24, fontFamily: 'Nunito_800ExtraBold', color: '#2563EB' },
  sessionInfoLabel: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
  sessionInfoDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  capacitySection: { paddingHorizontal: 16, marginTop: 12, gap: 6 },
  capacityBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityFill: { height: '100%', borderRadius: 4 },
  capacityText: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_600SemiBold', textAlign: 'right' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  emptySubtitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  listTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937', marginBottom: 12 },
  waitingCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: { fontSize: 12, color: '#2563EB', fontFamily: 'Nunito_700Bold' },
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
  waitingSince: { fontSize: 10, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginTop: 1 },
  actionBtns: { flexDirection: 'row', gap: 6 },
  actionBtn: { borderRadius: 10, padding: 8, justifyContent: 'center', alignItems: 'center' },
  admitBtn: { backgroundColor: '#D1FAE5', paddingHorizontal: 12 },
  admitBtnText: { fontSize: 12, color: '#059669', fontFamily: 'Nunito_700Bold' },
  removeBtn: { backgroundColor: '#FEE2E2', width: 34 },
  removeBtnText: { fontSize: 14, color: '#DC2626', fontFamily: 'Nunito_700Bold' },
});