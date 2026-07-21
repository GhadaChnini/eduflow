import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

const TARGETS = [
  { value: 'all', label: '🌐 Everyone', desc: 'All users on the platform' },
  { value: 'students', label: '🎓 Students', desc: 'All students only' },
  { value: 'teachers', label: '👩‍🏫 Teachers', desc: 'All teachers only' },
];

export default function MessagesScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    target: 'all',
  });

  const fetchMessages = useCallback(async () => {
    try {
      const res = await authFetch('/api/teacher/messages');
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }
    setSending(true);
    try {
      const res = await authFetch('/api/teacher/messages', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }
      Alert.alert(
        '💬 Message Sent!',
        `Broadcast sent to ${data.sent_to} user(s)`,
        [{ text: 'OK', onPress: () => { setShowForm(false); setForm({ title: '', content: '', target: 'all' }); fetchMessages(); } }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (id: string) => {
    Alert.alert('Delete', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch('/api/teacher/messages', {
              method: 'DELETE',
              body: JSON.stringify({ message_id: id }),
            });
            setMessages((prev) => prev.filter((m) => m.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete message');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0891B2" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Broadcast Messages</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.addBtnText}>{showForm ? '✕' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(); }} tintColor="#0891B2" />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compose Form */}
        {showForm && (
          <View style={styles.composeCard}>
            <Text style={styles.composeTitle}>📝 New Broadcast Message</Text>

            {/* Target Selector */}
            <Text style={styles.fieldLabel}>Send To</Text>
            <View style={styles.targetRow}>
              {TARGETS.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.targetBtn, form.target === t.value && styles.targetBtnActive]}
                  onPress={() => setForm((p) => ({ ...p, target: t.value }))}
                >
                  <Text style={styles.targetBtnLabel}>{t.label}</Text>
                  <Text style={styles.targetBtnDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Message title..."
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
            />

            {/* Content */}
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your message..."
              placeholderTextColor="#9CA3AF"
              value={form.content}
              onChangeText={(t) => setForm((p) => ({ ...p, content: t }))}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>📤 Send Broadcast</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Messages History */}
        <Text style={styles.sectionTitle}>📬 Sent Messages ({messages.length})</Text>

        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages sent yet</Text>
            <Text style={styles.emptySubtitle}>Broadcast messages to students or teachers</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View key={msg.id} style={styles.messageCard}>
              <View style={styles.messageTop}>
                <View style={styles.targetBadge}>
                  <Text style={styles.targetBadgeText}>
                    {TARGETS.find((t) => t.value === msg.target)?.label || '🌐 Everyone'}
                  </Text>
                </View>
                <Text style={styles.messageDate}>{formatDate(msg.created_at)}</Text>
                <TouchableOpacity onPress={() => deleteMessage(msg.id)}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.messageTitle}>{msg.title}</Text>
              <Text style={styles.messageContent} numberOfLines={3}>{msg.content}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      {!showForm && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#0891B2',
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
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  addBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: '#0891B2', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  composeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
    borderTopWidth: 4,
    borderTopColor: '#0891B2',
  },
  composeTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  fieldLabel: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#374151' },
  targetRow: { gap: 8 },
  targetBtn: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  targetBtnActive: { borderColor: '#0891B2', backgroundColor: '#ECFEFF' },
  targetBtnLabel: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  targetBtnDesc: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_400Regular', marginTop: 2 },
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
  textArea: { height: 100, textAlignVertical: 'top' },
  sendBtn: {
    backgroundColor: '#0891B2',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937', marginBottom: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  emptySubtitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular', textAlign: 'center' },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0891B2',
  },
  messageTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetBadge: {
    backgroundColor: '#CFFAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  targetBadgeText: { fontSize: 11, color: '#0891B2', fontFamily: 'Nunito_700Bold' },
  messageDate: { flex: 1, fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular' },
  deleteIcon: { fontSize: 16 },
  messageTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  messageContent: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular', lineHeight: 18 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0891B2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0891B2',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontFamily: 'Nunito_400Regular', lineHeight: 32 },
});