import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { authFetch } from '@/utils/auth/getSession';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateLiveSessionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    isPaid: false,
    price: '',
    maxStudents: '30',
    enableWaitingList: true,
    scheduledAt: new Date(),
    meetingUrl: '',
  });

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter a session title');
      return;
    }
    if (!form.meetingUrl.trim()) {
      Alert.alert('Error', 'Please enter a meeting URL (Zoom, Google Meet, etc.)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        is_paid: form.isPaid,
        price: form.isPaid ? parseFloat(form.price) || 0 : 0,
        max_students: parseInt(form.maxStudents) || 30,
        scheduled_at: form.scheduledAt.toISOString(),
        meeting_url: form.meetingUrl,
        status: 'scheduled',
      };

      const res = await authFetch('/api/teacher/session', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert('🎥 Session Scheduled!', 'Your live session has been created', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm((prev) => ({
        ...prev,
        scheduledAt: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          prev.scheduledAt.getHours(),
          prev.scheduledAt.getMinutes()
        ),
      }));
    }
  };

  const onTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setForm((prev) => ({
        ...prev,
        scheduledAt: new Date(
          prev.scheduledAt.getFullYear(),
          prev.scheduledAt.getMonth(),
          prev.scheduledAt.getDate(),
          selectedTime.getHours(),
          selectedTime.getMinutes()
        ),
      }));
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎥 Schedule Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Session Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Introduction to Algebra"
            placeholderTextColor="#9CA3AF"
            value={form.title}
            onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What will be covered in this session?"
            placeholderTextColor="#9CA3AF"
            value={form.description}
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Meeting URL */}
        <View style={styles.field}>
          <Text style={styles.label}>Meeting URL *</Text>
          <TextInput
            style={styles.input}
            placeholder="Zoom / Google Meet / Teams link"
            placeholderTextColor="#9CA3AF"
            value={form.meetingUrl}
            onChangeText={(t) => setForm((p) => ({ ...p, meetingUrl: t }))}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Date & Time */}
        <View style={styles.field}>
          <Text style={styles.label}>Schedule Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateBtnIcon}>📅</Text>
              <Text style={styles.dateBtnText}>{formatDate(form.scheduledAt)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateBtnIcon}>🕐</Text>
              <Text style={styles.dateBtnText}>{formatTime(form.scheduledAt)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={form.scheduledAt}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={form.scheduledAt}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}

        {/* Max Students */}
        <View style={styles.field}>
          <Text style={styles.label}>Maximum Students</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            placeholderTextColor="#9CA3AF"
            value={form.maxStudents}
            onChangeText={(t) => setForm((p) => ({ ...p, maxStudents: t }))}
            keyboardType="number-pad"
          />
        </View>

        {/* Waiting List Toggle */}
        <View style={styles.field}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Enable Waiting List</Text>
              <Text style={styles.toggleDesc}>
                Allow students to join a waiting list when session is full
              </Text>
            </View>
            <Switch
              value={form.enableWaitingList}
              onValueChange={(v) => setForm((p) => ({ ...p, enableWaitingList: v }))}
              trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.field}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Paid Session</Text>
              <Text style={styles.toggleDesc}>Charge students to join this session</Text>
            </View>
            <Switch
              value={form.isPaid}
              onValueChange={(v) => setForm((p) => ({ ...p, isPaid: v }))}
              trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
              thumbColor="#fff"
            />
          </View>
          {form.isPaid && (
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Price in TND (e.g. 15.00)"
              placeholderTextColor="#9CA3AF"
              value={form.price}
              onChangeText={(t) => setForm((p) => ({ ...p, price: t }))}
              keyboardType="decimal-pad"
            />
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Students will receive a notification when you start the session.
            Share the meeting link with enrolled students.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>🎥 Schedule Session</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  field: { marginBottom: 18 },
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
  textArea: { height: 90, textAlignVertical: 'top' },
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  dateBtn: {
    flex: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBtnIcon: { fontSize: 16 },
  dateBtnText: { fontSize: 13, color: '#1F2937', fontFamily: 'Nunito_600SemiBold', flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontFamily: 'Nunito_400Regular', maxWidth: '80%' },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: 13, color: '#1D4ED8', fontFamily: 'Nunito_400Regular', flex: 1, lineHeight: 20 },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
});