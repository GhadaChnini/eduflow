import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { authFetch } from '@/utils/auth/getSession';

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: '🔘 Multiple Choice' },
  { value: 'true_false', label: '✅ True / False' },
  { value: 'short_answer', label: '✏️ Short Answer' },
];

export default function QuizBuilderScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await authFetch('/api/teacher/analytics');
      const data = await res.json();
      if (data.courses) setCourses(data.courses);
    } catch (e) {
      console.error(e);
    }
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 10,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        if (field === 'type') {
          return {
            ...q,
            type: value,
            options: value === 'true_false' ? ['True', 'False'] : value === 'short_answer' ? [] : ['', '', '', ''],
            correct_answer: '',
          };
        }
        return { ...q, [field]: value };
      })
    );
  };

  const updateOption = (qId: string, index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOptions = [...q.options];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const getTotalPoints = () => questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const handleSubmit = async () => {
    if (!quizTitle.trim()) {
      Alert.alert('Error', 'Please enter a quiz title');
      return;
    }
    if (questions.length === 0) {
      Alert.alert('Error', 'Please add at least one question');
      return;
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        Alert.alert('Error', 'Please fill in all question texts');
        return;
      }
      if (!q.correct_answer.trim()) {
        Alert.alert('Error', 'Please set a correct answer for all questions');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/teacher/quiz', {
        method: 'POST',
        body: JSON.stringify({
          title: quizTitle,
          course_id: selectedCourse || null,
          questions,
          total_points: getTotalPoints(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }
      Alert.alert('📝 Quiz Created!', `Quiz with ${questions.length} question(s) saved`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Quiz Builder</Text>
        <Text style={styles.pointsText}>{getTotalPoints()} pts</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Quiz Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Quiz Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chapter 1 Quiz"
            placeholderTextColor="#9CA3AF"
            value={quizTitle}
            onChangeText={setQuizTitle}
          />
        </View>

        {/* Course Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Link to Course (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.courseChip, !selectedCourse && styles.courseChipActive]}
              onPress={() => setSelectedCourse('')}
            >
              <Text style={[styles.courseChipText, !selectedCourse && styles.courseChipTextActive]}>
                None
              </Text>
            </TouchableOpacity>
            {courses.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.courseChip, selectedCourse === c.id && styles.courseChipActive]}
                onPress={() => setSelectedCourse(c.id)}
              >
                <Text
                  style={[styles.courseChipText, selectedCourse === c.id && styles.courseChipTextActive]}
                  numberOfLines={1}
                >
                  {c.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Questions */}
        <View style={styles.field}>
          <View style={styles.questionsHeader}>
            <Text style={styles.label}>Questions ({questions.length})</Text>
            <TouchableOpacity style={styles.addQBtn} onPress={addQuestion}>
              <Text style={styles.addQBtnText}>+ Add Question</Text>
            </TouchableOpacity>
          </View>

          {questions.length === 0 && (
            <TouchableOpacity style={styles.emptyQBox} onPress={addQuestion}>
              <Text style={styles.emptyQIcon}>➕</Text>
              <Text style={styles.emptyQText}>Tap to add your first question</Text>
            </TouchableOpacity>
          )}

          {questions.map((q, index) => (
            <View key={q.id} style={styles.questionCard}>
              {/* Question Header */}
              <View style={styles.questionHeader}>
                <View style={styles.questionNum}>
                  <Text style={styles.questionNumText}>Q{index + 1}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeQBtn}
                  onPress={() => removeQuestion(q.id)}
                >
                  <Text style={styles.removeQBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Question Type */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                {QUESTION_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.typeChip, q.type === t.value && styles.typeChipActive]}
                    onPress={() => updateQuestion(q.id, 'type', t.value)}
                  >
                    <Text style={[styles.typeChipText, q.type === t.value && styles.typeChipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Question Text */}
              <TextInput
                style={styles.questionInput}
                placeholder="Enter your question..."
                placeholderTextColor="#9CA3AF"
                value={q.text}
                onChangeText={(t) => updateQuestion(q.id, 'text', t)}
                multiline
              />

              {/* Options */}
              {q.type === 'multiple_choice' && (
                <View style={styles.optionsSection}>
                  <Text style={styles.optionsLabel}>Answer Options</Text>
                  {q.options.map((opt, i) => (
                    <View key={i} style={styles.optionRow}>
                      <TouchableOpacity
                        style={[
                          styles.optionRadio,
                          q.correct_answer === opt && styles.optionRadioActive,
                        ]}
                        onPress={() => opt && updateQuestion(q.id, 'correct_answer', opt)}
                      >
                        <Text style={styles.optionRadioText}>
                          {['A', 'B', 'C', 'D'][i]}
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.optionInput}
                        placeholder={`Option ${['A', 'B', 'C', 'D'][i]}`}
                        placeholderTextColor="#9CA3AF"
                        value={opt}
                        onChangeText={(t) => updateOption(q.id, i, t)}
                      />
                    </View>
                  ))}
                  <Text style={styles.correctHint}>
                    {q.correct_answer
                      ? `✅ Correct: "${q.correct_answer}"`
                      : '👆 Tap a letter to set the correct answer'}
                  </Text>
                </View>
              )}

              {q.type === 'true_false' && (
                <View style={styles.optionsSection}>
                  <Text style={styles.optionsLabel}>Correct Answer</Text>
                  <View style={styles.tfRow}>
                    {['True', 'False'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.tfBtn,
                          q.correct_answer === opt && styles.tfBtnActive,
                        ]}
                        onPress={() => updateQuestion(q.id, 'correct_answer', opt)}
                      >
                        <Text style={[styles.tfBtnText, q.correct_answer === opt && styles.tfBtnTextActive]}>
                          {opt === 'True' ? '✅ True' : '❌ False'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {q.type === 'short_answer' && (
                <View style={styles.optionsSection}>
                  <Text style={styles.optionsLabel}>Expected Answer (keywords)</Text>
                  <TextInput
                    style={styles.questionInput}
                    placeholder="e.g. photosynthesis"
                    placeholderTextColor="#9CA3AF"
                    value={q.correct_answer}
                    onChangeText={(t) => updateQuestion(q.id, 'correct_answer', t)}
                  />
                </View>
              )}

              {/* Points */}
              <View style={styles.pointsRow}>
                <Text style={styles.pointsLabel}>Points for this question:</Text>
                <View style={styles.pointsControls}>
                  <TouchableOpacity
                    style={styles.pointsBtn}
                    onPress={() => updateQuestion(q.id, 'points', Math.max(1, q.points - 5))}
                  >
                    <Text style={styles.pointsBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.pointsValue}>{q.points}</Text>
                  <TouchableOpacity
                    style={styles.pointsBtn}
                    onPress={() => updateQuestion(q.id, 'points', q.points + 5)}
                  >
                    <Text style={styles.pointsBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        {questions.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              📝 {questions.length} question(s) · 🏆 {getTotalPoints()} total points
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>💾 Save Quiz</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  pointsText: { color: '#FEF3C7', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Nunito_400Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    maxWidth: 140,
  },
  courseChipActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  courseChipText: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  courseChipTextActive: { color: '#fff' },
  questionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addQBtn: { backgroundColor: '#D97706', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addQBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  emptyQBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyQIcon: { fontSize: 32 },
  emptyQText: { fontSize: 14, color: '#D97706', fontFamily: 'Nunito_600SemiBold' },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderTopWidth: 3,
    borderTopColor: '#D97706',
    gap: 10,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionNum: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  questionNumText: { fontSize: 13, color: '#D97706', fontFamily: 'Nunito_700Bold' },
  removeQBtn: { padding: 6 },
  removeQBtnText: { fontSize: 16, color: '#9CA3AF' },
  typeRow: { marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  typeChipActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  typeChipText: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  typeChipTextActive: { color: '#fff' },
  questionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Nunito_400Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  optionsSection: { gap: 8 },
  optionsLabel: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_700Bold' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionRadio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionRadioActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  optionRadioText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#6B7280' },
  optionInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'Nunito_400Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  correctHint: { fontSize: 11, color: '#059669', fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
  tfRow: { flexDirection: 'row', gap: 10 },
  tfBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tfBtnActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  tfBtnText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#6B7280' },
  tfBtnTextActive: { color: '#fff' },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
  },
  pointsLabel: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  pointsControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsBtnText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  pointsValue: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#D97706', minWidth: 30, textAlign: 'center' },
  summaryCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryText: { fontSize: 14, color: '#D97706', fontFamily: 'Nunito_700Bold' },
  submitBtn: {
    backgroundColor: '#D97706',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
});