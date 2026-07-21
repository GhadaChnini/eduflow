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
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

export default function SessionRecordingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recording, setRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertForm, setConvertForm] = useState({
    title: '',
    description: '',
    price: '',
    isFree: true,
  });

  const fetchRecording = useCallback(async () => {
    try {
      const res = await authFetch(`/api/teacher/recording?session_id=${id}`);
      const data = await res.json();
      if (data.recording) {
        setRecording(data.recording);
        setRecordingUrl(data.recording.recording_url || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecording();
  }, [fetchRecording]);

  const saveRecording = async () => {
    if (!recordingUrl.trim()) {
      Alert.alert('Error', 'Please enter a recording URL');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/teacher/recording', {
        method: 'POST',
        body: JSON.stringify({ session_id: id, recording_url: recordingUrl }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        Alert.alert('✅ Saved!', 'Recording URL saved successfully');
        fetchRecording();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save recording');
    } finally {
      setSaving(false);
    }
  };

  const convertToCourse = async () => {
    if (!convertForm.title.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }
    setConverting(true);
    try {
      const res = await authFetch('/api/teacher/recording', {
        method: 'PUT',
        body: JSON.stringify({
          session_id: id,
          title: convertForm.title,
          description: convertForm.description,
          price: convertForm.isFree ? 0 : parseFloat(convertForm.price) || 0,
        }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        Alert.alert(
          '🎓 Course Created!',
          `"${convertForm.title}" has been published as a new course`,
          [{ text: 'OK', onPress: () => { setShowConvertForm(false); fetchRecording(); } }]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to convert recording');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const hasRecording = !!recording?.recording_url;
  const isConverted = !!recording?.converted_course_id;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎬 Recording</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchRecording(); }}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recording Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>{hasRecording ? '🎬' : '📹'}</Text>
          <Text style={styles.statusTitle}>
            {hasRecording ? 'Recording Available' : 'No Recording Yet'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {hasRecording
              ? 'Your session recording has been saved'
              : 'Add a recording URL from your meeting platform'}
          </Text>
          {isConverted && (
            <View style={styles.convertedBadge}>
              <Text style={styles.convertedText}>
                🎓 Converted to: {recording?.converted_course_title}
              </Text>
            </View>
          )}
        </View>

        {/* Recording URL Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording URL</Text>
          <Text style={styles.sectionDesc}>
            Paste the recording link from Zoom, Google Meet, or any video platform
          </Text>
          <TextInput
            style={styles.input}
            placeholder="https://zoom.us/rec/... or YouTube link"
            placeholderTextColor="#9CA3AF"
            value={recordingUrl}
            onChangeText={setRecordingUrl}
            keyboardType="url"
            autoCapitalize="none"
            multiline
          />
          <View style={styles.btnRow}>
            {hasRecording && (
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => Linking.openURL(recording.recording_url)}
              >
                <Text style={styles.viewBtnText}>▶️ Watch</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={saveRecording}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>💾 Save URL</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Convert to Course */}
        {hasRecording && !isConverted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎓 Convert to Course</Text>
            <Text style={styles.sectionDesc}>
              Turn this recording into a published course that students can enroll in
            </Text>

            {!showConvertForm ? (
              <TouchableOpacity
                style={styles.convertBtn}
                onPress={() => setShowConvertForm(true)}
              >
                <Text style={styles.convertBtnText}>🎓 Convert to Course</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.convertForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Course Title *"
                  placeholderTextColor="#9CA3AF"
                  value={convertForm.title}
                  onChangeText={(t) => setConvertForm((p) => ({ ...p, title: t }))}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Course Description"
                  placeholderTextColor="#9CA3AF"
                  value={convertForm.description}
                  onChangeText={(t) => setConvertForm((p) => ({ ...p, description: t }))}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.priceToggle}>
                  <TouchableOpacity
                    style={[styles.priceBtn, convertForm.isFree && styles.priceBtnActive]}
                    onPress={() => setConvertForm((p) => ({ ...p, isFree: true }))}
                  >
                    <Text style={[styles.priceBtnText, convertForm.isFree && styles.priceBtnTextActive]}>
                      Free
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priceBtn, !convertForm.isFree && styles.priceBtnActive]}
                    onPress={() => setConvertForm((p) => ({ ...p, isFree: false }))}
                  >
                    <Text style={[styles.priceBtnText, !convertForm.isFree && styles.priceBtnTextActive]}>
                      Paid (TND)
                    </Text>
                  </TouchableOpacity>
                </View>

                {!convertForm.isFree && (
                  <TextInput
                    style={styles.input}
                    placeholder="Price in TND"
                    placeholderTextColor="#9CA3AF"
                    value={convertForm.price}
                    onChangeText={(t) => setConvertForm((p) => ({ ...p, price: t }))}
                    keyboardType="decimal-pad"
                  />
                )}

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowConvertForm(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, converting && styles.btnDisabled]}
                    onPress={convertToCourse}
                    disabled={converting}
                  >
                    {converting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>🎓 Publish</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Already Converted */}
        {isConverted && (
          <View style={styles.convertedCard}>
            <Text style={styles.convertedCardIcon}>🎓</Text>
            <Text style={styles.convertedCardTitle}>Already Converted!</Text>
            <Text style={styles.convertedCardDesc}>
              This recording has been published as "{recording?.converted_course_title}"
            </Text>
            <TouchableOpacity
              style={styles.viewCourseBtn}
              onPress={() => router.push(`/teacher/courses/${recording?.converted_course_id}` as any)}
            >
              <Text style={styles.viewCourseBtnText}>View Course →</Text>
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
  backBtn: { padding: 4 },
  backIcon: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  statusIcon: { fontSize: 48 },
  statusTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  statusSubtitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular', textAlign: 'center' },
  convertedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  convertedText: { fontSize: 12, color: '#059669', fontFamily: 'Nunito_700Bold' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  sectionDesc: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Nunito_400Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: 10 },
  viewBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  viewBtnText: { color: '#2563EB', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  btnDisabled: { opacity: 0.6 },
  convertBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  convertBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  convertForm: { gap: 10 },
  priceToggle: { flexDirection: 'row', gap: 10 },
  priceBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  priceBtnText: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_700Bold' },
  priceBtnTextActive: { color: '#fff' },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#6B7280', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  convertedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  convertedCardIcon: { fontSize: 40 },
  convertedCardTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#059669' },
  convertedCardDesc: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular', textAlign: 'center' },
  viewCourseBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  viewCourseBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold' },
});