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

export default function QuizListScreen() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await authFetch('/api/teacher/quiz');
      const data = await res.json();
      if (data.quizzes) setQuizzes(data.quizzes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const deleteQuiz = async (id: string) => {
    Alert.alert('Delete Quiz', 'Are you sure you want to delete this quiz?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch('/api/teacher/quiz', {
              method: 'DELETE',
              body: JSON.stringify({ quiz_id: id }),
            });
            setQuizzes((prev) => prev.filter((q) => q.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete quiz');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
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
        <Text style={styles.headerTitle}>📝 Quiz Builder</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/teacher/quiz/create')}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchQuizzes(); }}
            tintColor="#D97706"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {quizzes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No quizzes yet</Text>
            <Text style={styles.emptySubtitle}>
              Create quizzes to test your students' knowledge
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/teacher/quiz/create')}
            >
              <Text style={styles.createBtnText}>+ Create Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          quizzes.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              style={styles.quizCard}
              onPress={() => router.push(`/teacher/quiz/create` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.quizTop}>
                <View style={styles.quizIcon}>
                  <Text style={styles.quizIconText}>📝</Text>
                </View>
                <View style={styles.quizInfo}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <Text style={styles.quizMeta}>
                    {quiz.questions?.length || 0} questions · {quiz.total_points || 0} pts total
                  </Text>
                  {quiz.course_title && (
                    <Text style={styles.quizCourse}>📚 {quiz.course_title}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteQuiz(quiz.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <View style={styles.quizStats}>
                <View style={styles.quizStat}>
                  <Text style={styles.quizStatValue}>{quiz.submissions || 0}</Text>
                  <Text style={styles.quizStatLabel}>Submissions</Text>
                </View>
                <View style={styles.quizStat}>
                  <Text style={styles.quizStatValue}>
                    {quiz.avg_score ? `${parseFloat(quiz.avg_score).toFixed(0)}%` : '—'}
                  </Text>
                  <Text style={styles.quizStatLabel}>Avg Score</Text>
                </View>
                <View style={styles.quizStat}>
                  <Text style={styles.quizStatValue}>{quiz.total_points || 0}</Text>
                  <Text style={styles.quizStatLabel}>Total Points</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.quizActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>📊 Results</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push('/teacher/grades' as any)}
                >
                  <Text style={styles.actionBtnText}>⭐ Grade</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/teacher/quiz/create')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#D97706',
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
  addBtnText: { color: '#D97706', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  createBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  createBtnText: { color: '#fff', fontFamily: 'Nunito_700Bold', fontSize: 14 },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
    borderTopWidth: 3,
    borderTopColor: '#D97706',
  },
  quizTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  quizIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizIconText: { fontSize: 22 },
  quizInfo: { flex: 1 },
  quizTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  quizMeta: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_400Regular', marginTop: 2 },
  quizCourse: { fontSize: 11, color: '#D97706', fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },
  quizStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  quizStat: { flex: 1, alignItems: 'center' },
  quizStatValue: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: '#D97706' },
  quizStatLabel: { fontSize: 10, color: '#6B7280', fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
  quizActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, color: '#D97706', fontFamily: 'Nunito_700Bold' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontFamily: 'Nunito_400Regular', lineHeight: 32 },
});