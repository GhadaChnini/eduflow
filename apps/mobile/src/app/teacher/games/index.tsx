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

const BUILT_IN_GAMES = [
  {
    id: 'memory',
    title: 'Memory Match',
    description: 'Match pairs of cards to test memory',
    type: 'memory',
    category: 'Brain',
    icon: '🧠',
    color: '#7C3AED',
    bg: '#EDE9FE',
    route: '/teacher/games/custom/memory',
    points: 10,
  },
  {
    id: 'wordscramble',
    title: 'Word Scramble',
    description: 'Unscramble letters to find the word',
    type: 'wordscramble',
    category: 'Language',
    icon: '🔤',
    color: '#2563EB',
    bg: '#DBEAFE',
    route: '/teacher/games/custom/wordscramble',
    points: 15,
  },
  {
    id: 'mathchallenge',
    title: 'Math Challenge',
    description: 'Solve math problems against the clock',
    type: 'mathchallenge',
    category: 'Math',
    icon: '🔢',
    color: '#059669',
    bg: '#D1FAE5',
    route: '/teacher/games/custom/mathchallenge',
    points: 20,
  },
  {
    id: 'wordwall',
    title: 'Wordwall',
    description: 'Interactive word games via Wordwall',
    type: 'wordwall',
    category: 'Language',
    icon: '📋',
    color: '#D97706',
    bg: '#FEF3C7',
    route: '/teacher/games/wordwall',
    points: 15,
  },
  {
    id: 'blooket',
    title: 'Blooket',
    description: 'Fun classroom game sets via Blooket',
    type: 'blooket',
    category: 'Mixed',
    icon: '🎯',
    color: '#DC2626',
    bg: '#FEE2E2',
    route: '/teacher/games/blooket',
    points: 20,
  },
];

const CATEGORIES = ['All', 'Brain', 'Language', 'Math', 'Mixed'];

export default function GamesZoneScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        authFetch('/api/teacher/analytics'),
        authFetch('/api/teacher/session'),
      ]);
      const coursesData = await coursesRes.json();
      const sessionsData = await sessionsRes.json();
      if (coursesData.courses) setCourses(coursesData.courses);
      if (sessionsData.sessions) setSessions(sessionsData.sessions.filter((s: any) => s.status === 'live'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unlockGame = async () => {
    if (!selectedGame) return;
    if (!selectedCourse && !selectedSession) {
      Alert.alert('Error', 'Please select a course or live session to unlock this game for');
      return;
    }

    setUnlocking(true);
    try {
      const res = await authFetch('/api/games', {
        method: 'POST',
        body: JSON.stringify({
          game_id: selectedGame.id,
          course_id: selectedCourse || null,
          session_id: selectedSession || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        Alert.alert(
          '🎮 Game Unlocked!',
          `"${selectedGame.title}" is now available for your students`,
          [{ text: 'OK', onPress: () => { setSelectedGame(null); setSelectedCourse(''); setSelectedSession(''); } }]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to unlock game');
    } finally {
      setUnlocking(false);
    }
  };

  const filtered = activeCategory === 'All'
    ? BUILT_IN_GAMES
    : BUILT_IN_GAMES.filter((g) => g.category === activeCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
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
        <Text style={styles.headerTitle}>🎮 Games Zone</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Unlock Panel */}
      {selectedGame && (
        <View style={styles.unlockPanel}>
          <View style={styles.unlockPanelTop}>
            <Text style={styles.unlockPanelTitle}>
              🔓 Unlock "{selectedGame.title}" for:
            </Text>
            <TouchableOpacity onPress={() => setSelectedGame(null)}>
              <Text style={styles.unlockClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unlockOptions}>
            <TouchableOpacity
              style={[styles.unlockOption, !selectedCourse && !selectedSession && styles.unlockOptionActive]}
              onPress={() => { setSelectedCourse(''); setSelectedSession(''); }}
            >
              <Text style={styles.unlockOptionText}>Select...</Text>
            </TouchableOpacity>
            {sessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.unlockOption, selectedSession === s.id && styles.unlockOptionActive]}
                onPress={() => { setSelectedSession(s.id); setSelectedCourse(''); }}
              >
                <Text style={[styles.unlockOptionText, selectedSession === s.id && styles.unlockOptionTextActive]}>
                  🔴 {s.title}
                </Text>
              </TouchableOpacity>
            ))}
            {courses.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.unlockOption, selectedCourse === c.id && styles.unlockOptionActive]}
                onPress={() => { setSelectedCourse(c.id); setSelectedSession(''); }}
              >
                <Text
                  style={[styles.unlockOptionText, selectedCourse === c.id && styles.unlockOptionTextActive]}
                  numberOfLines={1}
                >
                  📚 {c.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.unlockBtn, unlocking && styles.unlockBtnDisabled]}
            onPress={unlockGame}
            disabled={unlocking}
          >
            {unlocking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.unlockBtnText}>🔓 Unlock Game</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#DC2626" />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>💡</Text>
          <Text style={styles.infoBannerText}>
            Tap a game to preview it, then unlock it for a course or live session. Students earn points when they complete games!
          </Text>
        </View>

        {/* Games Grid */}
        <View style={styles.gamesGrid}>
          {filtered.map((game) => (
            <View key={game.id} style={[styles.gameCard, { backgroundColor: game.bg }]}>
              <Text style={styles.gameIcon}>{game.icon}</Text>
              <Text style={[styles.gameTitle, { color: game.color }]}>{game.title}</Text>
              <Text style={styles.gameDesc}>{game.description}</Text>
              <View style={styles.gameMeta}>
                <Text style={styles.gameCat}>{game.category}</Text>
                <Text style={styles.gamePoints}>+{game.points} pts</Text>
              </View>
              <View style={styles.gameActions}>
                <TouchableOpacity
                  style={[styles.previewBtn, { borderColor: game.color }]}
                  onPress={() => router.push(game.route as any)}
                >
                  <Text style={[styles.previewBtnText, { color: game.color }]}>▶ Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unlockGameBtn, { backgroundColor: game.color }]}
                  onPress={() => setSelectedGame(game)}
                >
                  <Text style={styles.unlockGameBtnText}>🔓 Unlock</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#DC2626',
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
  unlockPanel: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 10,
    borderTopWidth: 3,
    borderTopColor: '#DC2626',
  },
  unlockPanelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unlockPanelTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  unlockClose: { fontSize: 18, color: '#9CA3AF', padding: 4 },
  unlockOptions: { marginBottom: 4 },
  unlockOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    maxWidth: 160,
  },
  unlockOptionActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  unlockOptionText: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  unlockOptionTextActive: { color: '#fff' },
  unlockBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  unlockBtnDisabled: { opacity: 0.6 },
  unlockBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  categoryRow: { marginTop: 12, marginBottom: 4 },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  catBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  catText: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  catTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
  },
  infoBannerIcon: { fontSize: 18 },
  infoBannerText: { fontSize: 12, color: '#9A3412', fontFamily: 'Nunito_400Regular', flex: 1, lineHeight: 18 },
  gamesGrid: { gap: 14 },
  gameCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  gameIcon: { fontSize: 36 },
  gameTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  gameDesc: { fontSize: 13, color: '#374151', fontFamily: 'Nunito_400Regular' },
  gameMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameCat: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_700Bold' },
  gamePoints: { fontSize: 12, color: '#059669', fontFamily: 'Nunito_700Bold' },
  gameActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  previewBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  previewBtnText: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  unlockGameBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  unlockGameBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold' },
});