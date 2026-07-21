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
import { Image } from 'expo-image';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  published: { bg: '#D1FAE5', text: '#059669', label: 'Published' },
  draft: { bg: '#FEF3C7', text: '#D97706', label: 'Draft' },
  archived: { bg: '#F3F4F6', text: '#6B7280', label: 'Archived' },
};

const TYPE_ICONS: Record<string, string> = {
  video: '🎥',
  document: '📄',
  mixed: '📚',
};

export default function TeacherCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchCourses = useCallback(async () => {
    try {
      const res = await authFetch('/api/teacher/analytics');
      const data = await res.json();
      if (data.courses) {
        setCourses(data.courses);
        setFiltered(data.courses);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    let result = courses;
    if (activeFilter !== 'all') {
      result = result.filter((c) => c.status === activeFilter);
    }
    if (search.trim()) {
      result = result.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, activeFilter, courses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
  }, [fetchCourses]);

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
        <Text style={styles.headerTitle}>📚 My Courses</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/teacher/courses/create')}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['all', 'published', 'draft', 'archived'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No courses found</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/teacher/courses/create')}
            >
              <Text style={styles.createBtnText}>+ Create your first course</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((course) => {
            const status = STATUS_COLORS[course.status] || STATUS_COLORS.published;
            return (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => router.push(`/teacher/courses/${course.id}` as any)}
                activeOpacity={0.8}
              >
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                  {course.thumbnail_url ? (
                    <Image source={{ uri: course.thumbnail_url }} style={styles.thumbnail} contentFit="cover" />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Text style={styles.thumbnailIcon}>{TYPE_ICONS[course.type] || '📚'}</Text>
                    </View>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                  <View style={styles.courseStats}>
                    <Text style={styles.courseStat}>👥 {course.total_enrolled || 0}</Text>
                    <Text style={styles.courseStat}>✅ {course.total_completed || 0}</Text>
                    <Text style={styles.courseStat}>⭐ {parseFloat(course.avg_rating || 0).toFixed(1)}</Text>
                    <Text style={styles.courseStat}>👁 {course.views || 0}</Text>
                  </View>
                  <View style={styles.courseBottom}>
                    <Text style={styles.coursePrice}>
                      {course.price > 0 ? `${course.price} TND` : 'Free'}
                    </Text>
                    <View style={styles.courseActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/teacher/courses/${course.id}/students` as any)}
                      >
                        <Text style={styles.actionBtnText}>Students</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/teacher/courses/${course.id}/reviews` as any)}
                      >
                        <Text style={styles.actionBtnText}>Reviews</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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
  addBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: '#7C3AED', fontSize: 13, fontFamily: 'Nunito_700Bold' },
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  filterText: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  filterTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  createBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  createBtnText: { color: '#fff', fontFamily: 'Nunito_700Bold', fontSize: 14 },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailContainer: { position: 'relative' },
  thumbnail: { width: '100%', height: 160 },
  thumbnailPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailIcon: { fontSize: 48 },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontFamily: 'Nunito_700Bold' },
  courseInfo: { padding: 14 },
  courseTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937', marginBottom: 8 },
  courseStats: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  courseStat: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  courseBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coursePrice: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' },
  courseActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, color: '#7C3AED', fontFamily: 'Nunito_700Bold' },
});