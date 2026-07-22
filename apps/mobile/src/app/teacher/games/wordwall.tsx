import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { WebView } from 'react-native-webview';
import { authFetch } from '@/utils/auth/getSession';

const FEATURED_GAMES = [
  {
    title: 'Alphabet Soup',
    desc: 'Match letters to form words',
    url: 'https://wordwall.net/embed/56f2a7c4-6e7e-4f8b-8de5-1234567890ab',
    subject: '📚 English',
    difficulty: 'Easy',
  },
  {
    title: 'Math Facts Bingo',
    desc: 'Solve math facts to win bingo',
    url: 'https://wordwall.net/embed/math-facts-bingo',
    subject: '🔢 Math',
    difficulty: 'Medium',
  },
  {
    title: 'Science Vocabulary',
    desc: 'Match science terms to definitions',
    url: 'https://wordwall.net/embed/science-vocab',
    subject: '🔬 Science',
    difficulty: 'Medium',
  },
];

export default function WordwallScreen() {
  const router = useRouter();
  const [customUrl, setCustomUrl] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gameMode, setGameMode] = useState<'browse' | 'play'>('browse');

  const launchGame = (url: string) => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a Wordwall embed URL');
      return;
    }
    setActiveUrl(url);
    setGameMode('play');
  };

  const submitScore = async () => {
    setSubmitting(true);
    try {
      await authFetch('/api/games/complete', {
        method: 'POST',
        body: JSON.stringify({ game_id: 'wordwall', score: 80, max_score: 100 }),
      });
      Alert.alert(
        '📋 Game Completed!',
        'Your participation has been recorded and points awarded!',
        [
          { text: 'Play Another', onPress: () => setGameMode('browse') },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  if (gameMode === 'play' && activeUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.playHeader}>
          <TouchableOpacity onPress={() => setGameMode('browse')} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.playHeaderTitle}>📋 Wordwall Game</Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={submitScore}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.doneBtnText}>✓ Done</Text>
            )}
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: activeUrl }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
        />
        {loading && (
          <View style={styles.webviewLoader}>
            <ActivityIndicator size="large" color="#D97706" />
            <Text style={styles.webviewLoaderText}>Loading game...</Text>
          </View>
        )}
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
        <Text style={styles.headerTitle}>📋 Wordwall</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>💡</Text>
          <Text style={styles.infoBannerText}>
            Use featured games below or paste any Wordwall embed URL to launch a custom game for your students.
          </Text>
        </View>

        {/* Custom URL */}
        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>🔗 Custom Wordwall Game</Text>
          <Text style={styles.sectionDesc}>
            Go to wordwall.net → create/find a game → Share → Embed → copy URL
          </Text>
          <TextInput
            style={styles.urlInput}
            placeholder="https://wordwall.net/embed/..."
            placeholderTextColor="#9CA3AF"
            value={customUrl}
            onChangeText={setCustomUrl}
            keyboardType="url"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.launchBtn, !customUrl.trim() && styles.launchBtnDisabled]}
            onPress={() => launchGame(customUrl)}
            disabled={!customUrl.trim()}
          >
            <Text style={styles.launchBtnText}>▶ Launch Custom Game</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Games */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>⭐ Featured Games</Text>
          <Text style={styles.sectionDesc}>
            Sample games to get you started
          </Text>
          {FEATURED_GAMES.map((game, index) => (
            <View key={index} style={styles.gameCard}>
              <View style={styles.gameCardLeft}>
                <Text style={styles.gameCardTitle}>{game.title}</Text>
                <Text style={styles.gameCardDesc}>{game.desc}</Text>
                <View style={styles.gameCardMeta}>
                  <Text style={styles.gameCardSubject}>{game.subject}</Text>
                  <Text style={styles.gameCardDiff}>· {game.difficulty}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.gameCardBtn}
                onPress={() => launchGame(game.url)}
              >
                <Text style={styles.gameCardBtnText}>▶ Play</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* How to Get URL */}
        <View style={styles.howToCard}>
          <Text style={styles.howToTitle}>📖 How to get a Wordwall embed URL</Text>
          <View style={styles.howToSteps}>
            <Text style={styles.howToStep}>1. Go to <Text style={styles.howToLink}>wordwall.net</Text></Text>
            <Text style={styles.howToStep}>2. Sign in or create a free account</Text>
            <Text style={styles.howToStep}>3. Create or find a game activity</Text>
            <Text style={styles.howToStep}>4. Click <Text style={styles.howToBold}>Share</Text> → <Text style={styles.howToBold}>Embed</Text></Text>
            <Text style={styles.howToStep}>5. Copy the iframe src URL</Text>
            <Text style={styles.howToStep}>6. Paste it above to launch!</Text>
          </View>
        </View>
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
  playHeader: {
    backgroundColor: '#D97706',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playHeaderTitle: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold', flex: 1, textAlign: 'center' },
  doneBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  doneBtnText: { color: '#D97706', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  webview: { flex: 1 },
  webviewLoader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    gap: 12,
  },
  webviewLoaderText: { fontSize: 14, color: '#D97706', fontFamily: 'Nunito_600SemiBold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  infoBannerIcon: { fontSize: 18 },
  infoBannerText: { fontSize: 12, color: '#92400E', fontFamily: 'Nunito_400Regular', flex: 1, lineHeight: 18 },
  customSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  sectionDesc: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  urlInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'Nunito_400Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  launchBtn: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  launchBtnDisabled: { opacity: 0.5 },
  launchBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  featuredSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  gameCardLeft: { flex: 1 },
  gameCardTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  gameCardDesc: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_400Regular', marginTop: 2 },
  gameCardMeta: { flexDirection: 'row', gap: 4, marginTop: 4 },
  gameCardSubject: { fontSize: 11, color: '#D97706', fontFamily: 'Nunito_700Bold' },
  gameCardDiff: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular' },
  gameCardBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  gameCardBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  howToCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  howToTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#059669' },
  howToSteps: { gap: 6 },
  howToStep: { fontSize: 13, color: '#374151', fontFamily: 'Nunito_400Regular' },
  howToLink: { color: '#D97706', fontFamily: 'Nunito_700Bold' },
  howToBold: { fontFamily: 'Nunito_700Bold', color: '#1F2937' },
});