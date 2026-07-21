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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

export default function CourseStudentsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchStudents = useCallback(async () => {
    try {
      const res = await authFetch(`/api/teacher/analytics?course_id=${id}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
        setFiltered(data.students);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let result = students;
    if (activeFilter === 'completed') result = result.filter((s) => s.completed);
    if (activeFilter === 'in_progress') result = result.filter((s) => !s.completed && s.progress > 0);
    if (activeFilter === 'not_started') result = result.filter((s) => s.progress === 0);
    if (search.trim()) {
      result = result.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    }
    setFiltered(result);
  }, [search, activeFilter, students]);

  const issueCertificate = async (student_id: string, student_name: string) => {
    Alert.alert(
      'Issue Certificate',
      `Issue certificate to ${student_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue',
          onPress: async () => {
            try {
              const res = await authFetch('/api/teacher/certificate', {
                method: 'POST',
                body: JSON.stringify({ student_id, course_id: id }),
              });
              const data = await res.json();
              if (data.error) {
                Alert.alert('Error', data.error);
              } else {
                Alert.alert('🏆 Success!', `Certificate issued to ${student_name}`);
                fetchStudents();
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to issue certificate');
            }
          },
        },
      ]
    );
  };

  const updateProgress = async (student_id: string, progress: number) => {
    try {
      await authFetch('/api/enrollments', {
        method: 'PUT',
        body: JSON.stringify({ student_id, course_id: id, progress }),
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === student_id ? { ...s, progress } : s))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
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
        <Text style={styles.headerTitle}>👥 Students</Text>
        <Text style={styles.countText}>{students.length} total</Text>
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

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {[
          { key: 'all', label: 'All' },
          { key: 'completed', label: '✅ Completed' },
          { key: 'in_progress', label: '⏳ In Progress' },
          { key: 'not_started', label: '🔴 Not Started' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, activeFilter === f.key && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStudents(); }} tintColor="#7C3AED" />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No students found</Text>
          </View>
        ) : (
          filtered.map((student) => (
            <View key={student.id} style={styles.studentCard}>
              {/* Avatar + Name */}
              <View style={styles.studentTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {student.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.enrolledAt}>
                    Enrolled {new Date(student.enrolled_at).toLocaleDateString()}
                  </Text>
                </View>
                {student.completed ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✅ Done</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.certBtn}
                    onPress={() => issueCertificate(student.id, student.name)}
                  >
                    <Text style={styles.certBtnText}>🏆 Certify</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>{student.progress || 0}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${student.progress || 0}%` }]} />
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {parseFloat(student.avg_quiz_score || 0).toFixed(0)}%
                  </Text>
                  <Text style={styles.statLabel}>Quiz Avg</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{student.progress || 0}%</Text>
                  <Text style={styles.statLabel}>Progress</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{student.completed ? 'Yes' : 'No'}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push(`/teacher/browse/students/${student.id}` as any)}
                >
                  <Text style={styles.actionBtnText}>👤 View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push(`/teacher/grades` as any)}
                >
                  <Text style={styles.actionBtnText}>⭐ Grade</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  countText: { color: '#DDD6FE', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
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
  filterRow: { marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  filterText: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  filterTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  studentTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontFamily: 'Nunito_700Bold' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  enrolledAt: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontFamily: 'Nunito_400Regular' },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  completedText: { fontSize: 12, color: '#059669', fontFamily: 'Nunito_700Bold' },
  certBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  certBtnText: { fontSize: 12, color: '#D97706', fontFamily: 'Nunito_700Bold' },
  progressSection: { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  progressValue: { fontSize: 12, color: '#7C3AED', fontFamily: 'Nunito_700Bold' },
  progressBar: { height: 8, backgroundColor: '#EDE9FE', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' },
  statLabel: { fontSize: 10, color: '#6B7280', fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 12, color: '#7C3AED', fontFamily: 'Nunito_700Bold' },
});