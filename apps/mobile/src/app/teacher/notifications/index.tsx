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

const NOTIFICATION_ICONS: Record<string, string> = {
  announcement_sent: '📢',
  message_sent: '💬',
  new_review: '⭐',
  student_attended: '✅',
  student_waiting: '⏳',
  recording_saved: '🎥',
  recording_converted: '🎓',
  certificate_issued: '🏆',
  certificates_bulk_issued: '🏆',
  new_enrollment: '🎉',
  default: '🔔',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/teacher/notifications');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await authFetch('/api/teacher/notifications', {
        method: 'PUT',
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markRead = async (id: string) => {
    try {
      await authFetch('/api/teacher/notifications', {
        method: 'PUT',
        body: JSON.stringify({ notification_id: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotif = async (id: string) => {
    Alert.alert('Delete', 'Delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch('/api/teacher/notifications', {
              method: 'DELETE',
              body: JSON.stringify({ notification_id: id }),
            });
            setNotifications((prev) => prev.filter((n) => n.id !== id));
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
        <Text style={styles.headerTitle}>🔔 Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor="#7C3AED" />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {unreadCount > 0 && (
            <Text style={styles.groupLabel}>NEW ({unreadCount})</Text>
          )}
          {notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.is_read && styles.unread]}
              onPress={() => markRead(notif.id)}
              onLongPress={() => deleteNotif(notif.id)}
              activeOpacity={0.8}
            >
              <View style={styles.notifLeft}>
                <Text style={styles.notifIcon}>
                  {NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default}
                </Text>
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTopRow}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                  <Text style={styles.notifTime}>{formatDate(notif.created_at)}</Text>
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
              </View>
              {!notif.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
          <Text style={styles.hint}>Long press to delete a notification</Text>
        </ScrollView>
      )}
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
  markAllText: { color: '#DDD6FE', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  groupLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    color: '#7C3AED',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  unread: {
    borderLeftColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  notifLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifIcon: { fontSize: 18 },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937', flex: 1 },
  notifTime: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginLeft: 8 },
  notifMessage: { fontSize: 13, color: '#6B7280', marginTop: 3, fontFamily: 'Nunito_400Regular', lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  emptySubtitle: { fontSize: 14, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  hint: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 8, fontFamily: 'Nunito_400Regular' },
});