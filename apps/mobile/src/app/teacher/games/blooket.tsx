import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { WebView } from 'react-native-webview';
import { authFetch } from '@/utils/auth/getSession';

const GAME_MODES = [
  { id: 'gold_quest', title: 'Gold Quest', icon: '🪙', desc: 'Answer questions to collect gold' },
  { id: 'tower_defense', title: 'Tower Defense', icon: '🏰', desc: 'Defend your tower with correct answers' },
  { id: 'cafe', title: 'Café', icon: '☕', desc: 'Run a café by answering correctly' },
  { id: 'racing', title: 'Racing', icon: '🏎️', desc: 'Race to the finish with correct answers' },
  { id: 'fishing_frenzy', title: 'Fishing Frenzy', icon: '🎣', desc: 'Catch fish by answering questions' },
];

const SAMPLE_SETS = [
  { title: 'Math Facts', subject: '🔢 Math', level: 'Grade 3-5', code: 'join.blooket.com' },
  { title: 'Science Vocabulary', subject: '🔬 Science', level: 'Grade 4-6', code: 'join.blooket.com' },
  { title: 'English Grammar', subject: '📚 English', level: 'Grade 3-5', code: 'join.blooket.com' },
];

export default function BlooketScreen() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const joinGame = () => {
    if (!gameCode.trim()) {
      Alert.alert('Error', 'Please enter a Blooket game code');
      return;
    }
    setGameStarted(true);
  };

  const submitScore = async () => {
    setSubmitting(true);
    try {
      await authFetch('/api/games/complete', {
        method: 'POST',
        body: JSON.stringify({ game_id: 'blooket', score: 85, max_score: 100 }),
      });
      Alert.alert(
        '🎯 Game Completed!',
        'Your participation has been recorded and points awarded!',
        [
          { text: 'Play Another', onPress: () => { setGameStarted(false); setGameCode(''); } },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  if (gameStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.playHeader}>
          <TouchableOpacity onPress={() => setGameStarted(false)} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.playHeaderTitle}>🎯 Blooket Game</Text>
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
          source={{ uri: `https://play.blooket.com/play?gameCode=${gameCode}` }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
        />
        {loading && (
          <View style={styles.webviewLoader}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.webviewLoaderText}>Loading Blooket...</Text>
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
        <Text style={styles.headerTitle}>🎯 Blooket</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.blooket.com')}>
          <Text style={styles.websiteText}>Website ↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>🎯</Text>
          <Text style={styles.infoBannerText}>
            Blooket is a game-based learning platform. Teachers create a game on blooket.com and share a game code with students.
          </Text>
        </View>

        {/* Join with Code */}
        <View style={styles.joinCard}>
          <Text style={styles.joinTitle}>🎮 Join a Game</Text>
          <Text style={styles.joinDesc}>Enter the game code from your teacher or from blooket.com</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter game code..."
            placeholderTextColor="#9CA3AF"
            value={gameCode}
            onChangeText={setGameCode}
            autoCapitalize="none"
            keyboardType="default"
          />
          <TouchableOpacity
            style={[styles.joinBtn, !gameCode.trim() && styles.joinBtnDisabled]}
            onPress={joinGame}
            disabled={!gameCode.trim()}
          >
            <Text style={styles.joinBtnText}>▶ Join Game</Text>
          </TouchableOpacity>
        </View>

        {/* Game Modes */}
        <View style={styles.modesSection}>
          <Text style={styles.sectionTitle}>🕹️ Blooket Game Modes</Text>
          <Text style={styles.sectionDesc}>Teachers can choose from these fun modes on blooket.com</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesRow}>
            {GAME_MODES.map((mode) => (
              <View key={mode.id} style={styles.modeCard}>
                <Text style={styles.modeIcon}>{mode.icon}</Text>
                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.modeDesc}>{mode.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Sample Question Sets */}
        <View style={styles.setsSection}>
          <Text style={styles.sectionTitle}>📚 Sample Question Sets</Text>
          <Text style={styles.sectionDesc}>Find these on blooket.com/discover</Text>
          {SAMPLE_SETS.map((set, i) => (
            <View key={i} style={styles.setCard}>
              <View>
                <Text style={styles.setTitle}>{set.title}</Text>
                <Text style={styles.setMeta}>{set.subject} · {set.level}</Text>
              </View>
              <TouchableOpacity
                style={styles.findBtn}
                onPress={() => Linking.openURL('https://www.blooket.com/discover')}
              >
                <Text style={styles.findBtnText}>Find ↗</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* How to Create */}
        <View style={styles.howToCard}>
          <Text style={styles.howToTitle}>👩‍🏫 How teachers host a Blooket game</Text>
          <View style={styles.howToSteps}>
            <Text style={styles.howToStep}>1. Go to <Text style={styles.howToLink}>blooket.com</Text> and sign in</Text>
            <Text style={styles.howToStep}>2. Click <Text style={styles.howToBold}>Host</Text> on any question set</Text>
            <Text style={styles.howToStep}>3. Choose a game mode</Text>
            <Text style={styles.howToStep}>4. Share the <Text style={styles.howToBold}>game code</Text> with students</Text>
            <Text style={styles.howToStep}>5. Students enter the code here to join!</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  websiteText: { color: '#FCA5A5', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  playHeader: {
    backgroundColor: '#DC2626',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playHeaderTitle: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold', flex: 1, textAlign: 'center' },
  doneBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  doneBtnText: { color: '#DC2626', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  webview: { flex: 1 },
  webviewLoader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    gap: 12,
  },
  webviewLoaderText: { fontSize: 14, color: '#DC2626', fontFamily: 'Nunito_600SemiBold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  infoBannerIcon: { fontSize: 18 },
  infoBannerText: { fontSize: 12, color: '#991B1B', fontFamily: 'Nunito_400Regular', flex: 1, lineHeight: 18 },
  joinCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderTopWidth: 3,
    borderTopColor: '#DC2626',
  },
  joinTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  joinDesc: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  codeInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    letterSpacing: 4,
  },
  joinBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  joinBtnDisabled: { opacity: 0.5 },
  joinBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  modesSection: {
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
  sectionTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  sectionDesc: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  modesRow: { marginTop: 4 },
  modeCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    width: 130,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modeIcon: { fontSize: 28 },
  modeTitle: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  modeDesc: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_400Regular', lineHeight: 16 },
  setsSection: {
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
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  setTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  setMeta: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_400Regular', marginTop: 2 },
  findBtn: { backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  findBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Nunito_700Bold' },
  howToCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  howToTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#C2410C' },
  howToSteps: { gap: 6 },
  howToStep: { fontSize: 13, color: '#374151', fontFamily: 'Nunito_400Regular' },
  howToLink: { color: '#DC2626', fontFamily: 'Nunito_700Bold' },
  howToBold: { fontFamily: 'Nunito_700Bold', color: '#1F2937' },
});