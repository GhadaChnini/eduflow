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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

export default function CourseReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await authFetch(`/api/reviews?course_id=${id}`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const deleteReview = async (review_id: string) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch('/api/reviews', {
              method: 'DELETE',
              body: JSON.stringify({ review_id }),
            });
            setReviews((prev) => prev.filter((r) => r.id !== review_id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete review');
          }
        },
      },
    ]);
  };

  const renderStars = (rating: number) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

  const renderBar = (count: number, total: number) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
      <View style={styles.barContainer}>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.barCount}>{count}</Text>
      </View>
    );
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
        <Text style={styles.headerTitle}>⭐ Course Reviews</Text>
        <Text style={styles.countText}>{reviews.length} review(s)</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchReviews(); }}
            tintColor="#7C3AED"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Rating Summary */}
        {stats && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.avgRating}>
                {parseFloat(stats.avg_rating || 0).toFixed(1)}
              </Text>
              <Text style={styles.avgStars}>
                {renderStars(Math.round(stats.avg_rating || 0))}
              </Text>
              <Text style={styles.totalReviews}>{stats.total_reviews} reviews</Text>
            </View>
            <View style={styles.summaryRight}>
              {[5, 4, 3, 2, 1].map((star) => (
                <View key={star} style={styles.ratingRow}>
                  <Text style={styles.starLabel}>{star}⭐</Text>
                  {renderBar(stats[`${['one', 'two', 'three', 'four', 'five'][star - 1]}_star`] || 0, stats.total_reviews)}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySubtitle}>Students will leave reviews after completing the course</Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {review.student_name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>{review.student_name}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteReview(review.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
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
  scrollContent: { padding: 16, paddingBottom: 32 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', width: 90 },
  avgRating: { fontSize: 40, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' },
  avgStars: { fontSize: 12, marginTop: 2 },
  totalReviews: { fontSize: 11, color: '#6B7280', marginTop: 4, fontFamily: 'Nunito_400Regular' },
  summaryRight: { flex: 1, gap: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starLabel: { fontSize: 11, width: 28, fontFamily: 'Nunito_600SemiBold', color: '#374151' },
  barContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { flex: 1, height: 8, backgroundColor: '#EDE9FE', borderRadius: 4 },
  barFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  barCount: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_600SemiBold', width: 16, textAlign: 'right' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  emptySubtitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular', textAlign: 'center', paddingHorizontal: 32 },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  reviewDate: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular' },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },
  reviewStars: { fontSize: 16 },
  reviewComment: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
});