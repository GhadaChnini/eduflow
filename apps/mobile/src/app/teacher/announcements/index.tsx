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

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await authFetch('/api/teacher/announcements');
      const data = await res.json();
      if (data.announcements) setAnnouncements(data.announcements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const deleteAnnouncement = async (id: string) => {
    Alert.alert('Delete', 'Delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch('/api/teacher/announcements', {
              method: 'DELETE',
              body: JSON.stringify({ announcement_id: id }),
            });
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete announcement');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <Text style={styles.headerTitle}>📢 Announcements</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/teacher/announcements/create')}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAnnouncements(); }}
            tintColor="#7C3AED"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyTitle}>No announcements yet</Text>
            <Text style={styles.emptySubtitle}>
              Send announcements to keep your students updated
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/teacher/announcements/create')}
            >
              <Text style={styles.createBtnText}>+ Create Announcement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          announcements.map((a) => (
            <View key={a.id} style={styles.announcementCard}>
              <View style={styles.cardTop}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📢</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardMeta}>
                    {a.course_title ? `📚 ${a.course_title}` : '🌐 All Students'} · {formatDate(a.created_at)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteAnnouncement(a.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardContent}>{a.content}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/teacher/announcements/create')}
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
  addBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: '#7C3AED', fontSize: 13, fontFamily: 'Nunito_700Bold' },
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
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  createBtnText: { color: '#fff', fontFamily: 'Nunito_700Bold', fontSize: 14 },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 18 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  cardMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontFamily: 'Nunito_400Regular' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },
  cardContent: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontFamily: 'Nunito_400Regular', lineHeight: 32 },
});