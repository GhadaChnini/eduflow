import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

export default function GradesScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await authFetch('/api/teacher/session');
      const data = await res.json();
      if (data.sessions) {
        const ended = data.sessions.filter((s: any) => s.status === 'ended');
        setSessions(ended);
      }
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

  const selectSession = async (session: any) => {
    setSelectedSession(session);
    try {
      const res = await authFetch(`/api/teacher/attendance?session_id=${session.id}`);
      const data = await res.json();
      if (data.attendance) {
        setStudents(data.attendance.filter((a: any) => a.attended));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitGrades = async () => {
    if (!selectedSession) return;

    const gradeEntries = Object.entries(grades).filter(([_, score]) => score !== '');
    if (gradeEntries.length === 0) {
      Alert.alert('Error', 'Please enter at least one grade');
      return;
    }

    setSaving(true);
    try {
      for (const [student_id, score] of gradeEntries) {
        await authFetch('/api/teacher/grade', {
          method: 'POST',
          body: JSON.stringify({
            student_id,
            session_id: selectedSession.id,
            score: parseFloat(score),
          }),
        });
      }
      Alert.alert('⭐ Grades Saved!', `Grades submitted for ${gradeEntries.length} student(s)`, [
        { text: 'OK', onPress: () => { setGrades({}); setSelectedSession(null); setStudents([]); } },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  const getGradeColor = (score: string) => {
    const n = parseFloat(score);
    if (isNaN(n)) return '#9CA3AF';
    if (n >= 90) return '#059669';
    if (n >= 70) return '#D97706';
    if (n >= 50) return '#2563EB';
    return '#DC2626';
  };

  const getGradeLabel = (score: string) => {
    const n = parseFloat(score);
    if (isNaN(n)) return '';
    if (n >= 90) return 'A';
    if (n >= 80) return 'B';
    if (n >= 70) return 'C';
    if (n >= 60) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
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
        <Text style={styles.headerTitle}>⭐ Grade Students</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSessions(); }}
            tintColor="#059669"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Step 1 - Select Session */}
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>
            {selectedSession ? '✅ Session Selected' : '1️⃣ Select a Session'}
          </Text>
          {selectedSession ? (
            <View style={styles.selectedSession}>
              <View style={styles.selectedSessionInfo}>
                <Text style={styles.selectedSessionTitle}>{selectedSession.title}</Text>
                <Text style={styles.selectedSessionDate}>
                  {new Date(selectedSession.scheduled_at).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() => { setSelectedSession(null); setStudents([]); setGrades({}); }}
              >
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎥</Text>
                <Text style={styles.emptyText}>No ended sessions yet</Text>
                <Text style={styles.emptySubtext}>End a live session first to grade students</Text>
              </View>
            ) : (
              <View style={styles.sessionList}>
                {sessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.sessionOption}
                    onPress={() => selectSession(session)}
                  >
                    <View>
                      <Text style={styles.sessionOptionTitle}>{session.title}</Text>
                      <Text style={styles.sessionOptionDate}>
                        {new Date(session.scheduled_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.sessionOptionArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}
        </View>

        {/* Step 2 - Enter Grades */}
        {selectedSession && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>2️⃣ Enter Grades (out of 100)</Text>

            {students.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No attended students found</Text>
              </View>
            ) : (
              <>
                {students.map((s) => (
                  <View key={s.student_id} style={styles.gradeRow}>
                    <View style={styles.gradeAvatar}>
                      <Text style={styles.gradeAvatarText}>
                        {s.student_name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.gradeInfo}>
                      <Text style={styles.gradeName}>{s.student_name}</Text>
                      {grades[s.student_id] && (
                        <Text style={[styles.gradeLabel, { color: getGradeColor(grades[s.student_id]) }]}>
                          Grade: {getGradeLabel(grades[s.student_id])} ({grades[s.student_id]}/100)
                        </Text>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.gradeInput,
                        grades[s.student_id] && {
                          borderColor: getGradeColor(grades[s.student_id]),
                          color: getGradeColor(grades[s.student_id]),
                        },
                      ]}
                      placeholder="—"
                      placeholderTextColor="#9CA3AF"
                      value={grades[s.student_id] || ''}
                      onChangeText={(t) => {
                        const num = t.replace(/[^0-9.]/g, '');
                        if (parseFloat(num) > 100) return;
                        setGrades((prev) => ({ ...prev, [s.student_id]: num }));
                      }}
                      keyboardType="decimal-pad"
                      maxLength={5}
                    />
                  </View>
                ))}

                {/* Grade Distribution Preview */}
                {Object.values(grades).some((g) => g !== '') && (
                  <View style={styles.distributionCard}>
                    <Text style={styles.distributionTitle}>Grade Distribution</Text>
                    <View style={styles.distributionRow}>
                      {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                        const count = Object.values(grades).filter((s) => getGradeLabel(s) === grade).length;
                        return (
                          <View key={grade} style={styles.distItem}>
                            <Text style={styles.distGrade}>{grade}</Text>
                            <Text style={styles.distCount}>{count}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                  onPress={submitGrades}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      ⭐ Submit Grades ({Object.values(grades).filter((g) => g !== '').length}/{students.length})
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    backgroundColor: '#059669',
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  stepTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  selectedSession: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  selectedSessionInfo: { flex: 1 },
  selectedSessionTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#059669' },
  selectedSessionDate: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_400Regular', marginTop: 2 },
  changeBtn: { backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  changeBtnText: { fontSize: 13, color: '#059669', fontFamily: 'Nunito_700Bold' },
  sessionList: { gap: 8 },
  sessionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionOptionTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  sessionOptionDate: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginTop: 2 },
  sessionOptionArrow: { fontSize: 18, color: '#059669' },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  emptySubtext: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_400Regular', textAlign: 'center' },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  gradeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeAvatarText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  gradeInfo: { flex: 1 },
  gradeName: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  gradeLabel: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
  gradeInput: {
    width: 64,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
  },
  distributionCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  distributionTitle: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#059669' },
  distributionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  distItem: { alignItems: 'center', gap: 4 },
  distGrade: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#059669' },
  distCount: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: '#1F2937' },
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold' },
});