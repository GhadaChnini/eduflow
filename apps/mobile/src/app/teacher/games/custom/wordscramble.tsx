import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

const WORD_SETS = [
  {
    id: 'science', label: '🔬 Science', words: [
      { word: 'PHOTOSYNTHESIS', hint: 'How plants make food from sunlight' },
      { word: 'GRAVITY', hint: 'Force that pulls objects down' },
      { word: 'MOLECULE', hint: 'Smallest unit of a substance' },
      { word: 'ATMOSPHERE', hint: 'Layer of gases around Earth' },
      { word: 'ECOSYSTEM', hint: 'Community of living organisms' },
    ],
  },
  {
    id: 'math', label: '🔢 Math', words: [
      { word: 'FRACTION', hint: 'Part of a whole number' },
      { word: 'TRIANGLE', hint: 'Shape with three sides' },
      { word: 'EQUATION', hint: 'Math statement with equals sign' },
      { word: 'GEOMETRY', hint: 'Study of shapes and space' },
      { word: 'DIVISION', hint: 'Splitting into equal parts' },
    ],
  },
  {
    id: 'english', label: '📚 English', words: [
      { word: 'METAPHOR', hint: 'Comparison without using "like" or "as"' },
      { word: 'SYNONYM', hint: 'Word with same meaning as another' },
      { word: 'NARRATIVE', hint: 'A story or account of events' },
      { word: 'ADJECTIVE', hint: 'Word that describes a noun' },
      { word: 'PARAGRAPH', hint: 'Group of related sentences' },
    ],
  },
];

const scramble = (word: string) => {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const scrambled = arr.join('');
  return scrambled === word ? scramble(word) : scrambled;
};

export default function WordScrambleScreen() {
  const router = useRouter();
  const [selectedSet, setSelectedSet] = useState(WORD_SETS[0]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState('');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<any>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const currentWord = selectedSet.words[currentIndex];

  const startGame = useCallback(() => {
    setGameStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setAnswer('');
    setShowHint(false);
    setFeedback(null);
    setTimer(30);
    const word = selectedSet.words[0].word;
    setScrambledWord(scramble(word));
    startTimer();
  }, [selectedSet]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleWrong();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = () => {
    if (answer.toUpperCase() === currentWord.word) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const handleCorrect = () => {
    clearInterval(timerRef.current);
    setFeedback('correct');
    setScore((s) => s + 1);
    setTimeout(() => {
      setFeedback(null);
      nextWord();
    }, 800);
  };

  const handleWrong = () => {
    shake();
    setFeedback('wrong');
    setLives((l) => {
      const newLives = l - 1;
      if (newLives <= 0) {
        clearInterval(timerRef.current);
        setTimeout(() => { setFeedback(null); setGameOver(true); }, 600);
      } else {
        setTimeout(() => { setFeedback(null); setAnswer(''); startTimer(); }, 600);
      }
      return newLives;
    });
  };

  const nextWord = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= selectedSet.words.length) {
      setGameOver(true);
    } else {
      setCurrentIndex(nextIndex);
      setScrambledWord(scramble(selectedSet.words[nextIndex].word));
      setAnswer('');
      setShowHint(false);
      startTimer();
    }
  };

  const skipWord = () => {
    clearInterval(timerRef.current);
    setLives((l) => Math.max(0, l - 1));
    if (lives - 1 <= 0) {
      setGameOver(true);
    } else {
      nextWord();
    }
  };

  const submitScore = async () => {
    setSubmitting(true);
    try {
      const finalScore = Math.round((score / selectedSet.words.length) * 100);
      await authFetch('/api/games/complete', {
        method: 'POST',
        body: JSON.stringify({ game_id: 'wordscramble', score: finalScore, max_score: 100 }),
      });
      Alert.alert(
        '🔤 Game Over!',
        `Score: ${score}/${selectedSet.words.length}\nPoints: ${finalScore}/100`,
        [
          { text: 'Play Again', onPress: startGame },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔤 Word Scramble</Text>
        {gameStarted && !gameOver && (
          <Text style={[styles.timerText, timer <= 10 && styles.timerDanger]}>{timer}s</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!gameStarted ? (
          // Setup
          <View style={styles.setupScreen}>
            <Text style={styles.setupTitle}>Choose a Word Set</Text>
            {WORD_SETS.map((set) => (
              <TouchableOpacity
                key={set.id}
                style={[styles.setBtn, selectedSet.id === set.id && styles.setBtnActive]}
                onPress={() => setSelectedSet(set)}
              >
                <Text style={[styles.setBtnText, selectedSet.id === set.id && styles.setBtnTextActive]}>
                  {set.label}
                </Text>
                <Text style={styles.setBtnCount}>{set.words.length} words</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>🎮 Start Game</Text>
            </TouchableOpacity>
          </View>
        ) : gameOver ? (
          // Game Over
          <View style={styles.gameOverCard}>
            <Text style={styles.gameOverIcon}>{score === selectedSet.words.length ? '🏆' : '🎯'}</Text>
            <Text style={styles.gameOverTitle}>
              {score === selectedSet.words.length ? 'Perfect!' : 'Game Over!'}
            </Text>
            <Text style={styles.gameOverScore}>{score}/{selectedSet.words.length} words correct</Text>
            <View style={styles.gameOverBtns}>
              <TouchableOpacity style={styles.playAgainBtn} onPress={startGame}>
                <Text style={styles.playAgainBtnText}>🔄 Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={submitScore}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Saving...' : '⭐ Submit Score'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Game
          <View style={styles.gameScreen}>
            {/* Progress & Lives */}
            <View style={styles.topBar}>
              <Text style={styles.progress}>{currentIndex + 1}/{selectedSet.words.length}</Text>
              <View style={styles.livesRow}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Text key={i} style={styles.heart}>{i < lives ? '❤️' : '🖤'}</Text>
                ))}
              </View>
              <Text style={styles.scoreText}>⭐ {score}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentIndex) / selectedSet.words.length) * 100}%` }]} />
            </View>

            {/* Timer Bar */}
            <View style={styles.timerBar}>
              <View style={[
                styles.timerFill,
                { width: `${(timer / 30) * 100}%`, backgroundColor: timer <= 10 ? '#DC2626' : '#2563EB' }
              ]} />
            </View>

            {/* Scrambled Word */}
            <Animated.View style={[styles.wordCard, { transform: [{ translateX: shakeAnim }] },
              feedback === 'correct' && styles.wordCardCorrect,
              feedback === 'wrong' && styles.wordCardWrong,
            ]}>
              <Text style={styles.scrambledLabel}>Unscramble this word:</Text>
              <Text style={styles.scrambledWord}>{scrambledWord}</Text>
              {showHint && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>💡 {currentWord.hint}</Text>
                </View>
              )}
            </Animated.View>

            {/* Answer Input */}
            <TextInput
              style={[
                styles.answerInput,
                feedback === 'correct' && styles.answerInputCorrect,
                feedback === 'wrong' && styles.answerInputWrong,
              ]}
              placeholder="Type your answer..."
              placeholderTextColor="#9CA3AF"
              value={answer}
              onChangeText={setAnswer}
              autoCapitalize="characters"
              onSubmitEditing={handleSubmit}
            />

            {/* Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.hintBtn} onPress={() => setShowHint(!showHint)}>
                <Text style={styles.hintBtnText}>{showHint ? '🙈 Hide Hint' : '💡 Hint (-1❤️)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} onPress={skipWord}>
                <Text style={styles.skipBtnText}>⏭ Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkBtn} onPress={handleSubmit}>
                <Text style={styles.checkBtnText}>✓ Check</Text>
              </TouchableOpacity>
            </View>

            {/* Feedback */}
            {feedback && (
              <View style={[styles.feedbackBanner, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <Text style={styles.feedbackText}>
                  {feedback === 'correct' ? '✅ Correct!' : `❌ Wrong! The answer was: ${currentWord.word}`}
                </Text>
              </View>
            )}
          </View>
        )}
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
  timerText: { color: '#BFDBFE', fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  timerDanger: { color: '#FCA5A5' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  setupScreen: { gap: 12, paddingTop: 8 },
  setupTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937', marginBottom: 4 },
  setBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  setBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  setBtnText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  setBtnTextActive: { color: '#2563EB' },
  setBtnCount: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Nunito_400Regular' },
  startBtn: { backgroundColor: '#2563EB', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  startBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  gameScreen: { gap: 14 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#6B7280' },
  livesRow: { flexDirection: 'row', gap: 4 },
  heart: { fontSize: 18 },
  scoreText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#2563EB' },
  progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },
  timerBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 2 },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  wordCardCorrect: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  wordCardWrong: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  scrambledLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  scrambledWord: { fontSize: 32, fontFamily: 'Nunito_800ExtraBold', color: '#2563EB', letterSpacing: 4 },
  hintBox: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10, width: '100%' },
  hintText: { fontSize: 13, color: '#2563EB', fontFamily: 'Nunito_400Regular', textAlign: 'center' },
  answerInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    letterSpacing: 3,
  },
  answerInputCorrect: { borderColor: '#059669', color: '#059669' },
  answerInputWrong: { borderColor: '#DC2626', color: '#DC2626' },
  actionRow: { flexDirection: 'row', gap: 8 },
  hintBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, alignItems: 'center' },
  hintBtnText: { fontSize: 12, color: '#2563EB', fontFamily: 'Nunito_700Bold' },
  skipBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, paddingHorizontal: 16, alignItems: 'center' },
  skipBtnText: { fontSize: 12, color: '#6B7280', fontFamily: 'Nunito_700Bold' },
  checkBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 12, padding: 12, alignItems: 'center' },
  checkBtnText: { fontSize: 14, color: '#fff', fontFamily: 'Nunito_700Bold' },
  feedbackBanner: { borderRadius: 12, padding: 14, alignItems: 'center' },
  feedbackCorrect: { backgroundColor: '#ECFDF5' },
  feedbackWrong: { backgroundColor: '#FEF2F2' },
  feedbackText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  gameOverCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginTop: 20,
  },
  gameOverIcon: { fontSize: 56 },
  gameOverTitle: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: '#2563EB' },
  gameOverScore: { fontSize: 16, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  gameOverBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  playAgainBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, alignItems: 'center' },
  playAgainBtnText: { color: '#2563EB', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  submitBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
});