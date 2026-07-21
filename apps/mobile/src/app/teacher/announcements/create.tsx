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

export default function CreateAnnouncementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    course_id: '',
  });

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

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter an announcement title');
      return;
    }
    if (!form.content.trim()) {
      Alert.alert('Error', 'Please enter announcement content');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/teacher/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          course_id: form.course_id || null,
        }),
      });

      const data = await res.json();

      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert(
        '📢 Announcement Sent!',
        `Your announcement was sent to ${data.sent_to} student(s)`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to send announcement');
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
        <Text style={styles.headerTitle}>📢 New Announcement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Target Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Select a specific course to target only enrolled students, or leave empty to reach all your students.
          </Text>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Important update about tomorrow's class"
            placeholderTextColor="#9CA3AF"
            value={form.title}
            onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
          />
        </View>

        {/* Content */}
        <View style={styles.field}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your announcement here..."
            placeholderTextColor="#9CA3AF"
            value={form.content}
            onChangeText={(t) => setForm((p) => ({ ...p, content: t }))}
            multiline
            numberOfLines={6}
          />
          <Text style={styles.charCount}>{form.content.length} characters</Text>
        </View>

        {/* Target Course */}
        <View style={styles.field}>
          <Text style={styles.label}>Target Course (optional)</Text>
          <Text style={styles.fieldDesc}>Leave empty to send to all your students</Text>

          {/* All Students Option */}
          <TouchableOpacity
            style={[styles.courseOption, !form.course_id && styles.courseOptionActive]}
            onPress={() => setForm((p) => ({ ...p, course_id: '' }))}
          >
            <Text style={styles.courseOptionIcon}>🌐</Text>
            <View style={styles.courseOptionInfo}>
              <Text style={[styles.courseOptionTitle, !form.course_id && styles.courseOptionTitleActive]}>
                All Students
              </Text>
              <Text style={styles.courseOptionDesc}>Send to all enrolled students</Text>
            </View>
            {!form.course_id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          {/* Course List */}
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseOption, form.course_id === course.id && styles.courseOptionActive]}
              onPress={() => setForm((p) => ({ ...p, course_id: course.id }))}
            >
              <Text style={styles.courseOptionIcon}>📚</Text>
              <View style={styles.courseOptionInfo}>
                <Text
                  style={[
                    styles.courseOptionTitle,
                    form.course_id === course.id && styles.courseOptionTitleActive,
                  ]}
                  numberOfLines={1}
                >
                  {course.title}
                </Text>
                <Text style={styles.courseOptionDesc}>
                  {course.total_enrolled || 0} student(s)
                </Text>
              </View>
              {form.course_id === course.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview Card */}
        {(form.title || form.content) && (
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewTop}>
                <Text style={styles.previewIcon}>📢</Text>
                <View>
                  <Text style={styles.previewTitle}>{form.title || 'Announcement Title'}</Text>
                  <Text style={styles.previewMeta}>
                    {form.course_id
                      ? courses.find((c) => c.id === form.course_id)?.title
                      : 'All Students'}{' '}
                    · Just now
                  </Text>
                </View>
              </View>
              <Text style={styles.previewContent} numberOfLines={3}>
                {form.content || 'Your announcement message will appear here...'}
              </Text>
            </View>
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
            <Text style={styles.submitBtnText}>📢 Send Announcement</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBox: {
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: 13, color: '#5B21B6', fontFamily: 'Nunito_400Regular', flex: 1, lineHeight: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#374151', marginBottom: 6 },
  fieldDesc: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginBottom: 10 },
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
  textArea: { height: 140, textAlignVertical: 'top' },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Nunito_400Regular',
  },
  courseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  courseOptionActive: { borderColor: '#7C3AED', backgroundColor: '#FAF5FF' },
  courseOptionIcon: { fontSize: 22 },
  courseOptionInfo: { flex: 1 },
  courseOptionTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  courseOptionTitleActive: { color: '#7C3AED' },
  courseOptionDesc: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginTop: 2 },
  checkmark: { fontSize: 16, color: '#7C3AED', fontFamily: 'Nunito_700Bold' },
  previewSection: { marginBottom: 20 },
  previewLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_700Bold', marginBottom: 8 },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewIcon: { fontSize: 22 },
  previewTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  previewMeta: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginTop: 1 },
  previewContent: { fontSize: 13, color: '#374151', fontFamily: 'Nunito_400Regular', lineHeight: 20 },
  submitBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
});