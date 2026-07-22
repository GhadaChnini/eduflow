import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

const CARD_SETS = [
  { id: 'math', label: '🔢 Math', pairs: [
    { id: 1, front: '2+2', back: '4' },
    { id: 2, front: '3×3', back: '9' },
    { id: 3, front: '10÷2', back: '5' },
    { id: 4, front: '7-4', back: '3' },
    { id: 5, front: '5+6', back: '11' },
    { id: 6, front: '8×2', back: '16' },
  ]},
  { id: 'animals', label: '🐾 Animals', pairs: [
    { id: 1, front: '🐶', back: 'Dog' },
    { id: 2, front: '🐱', back: 'Cat' },
    { id: 3, front: '🐸', back: 'Frog' },
    { id: 4, front: '🦁', back: 'Lion' },
    { id: 5, front: '🐘', back: 'Elephant' },
    { id: 6, front: '🦊', back: 'Fox' },
  ]},
  { id: 'colors', label: '🎨 Colors', pairs: [
    { id: 1, front: '🔴', back: 'Red' },
    { id: 2, front: '🔵', back: 'Blue' },
    { id: 3, front: '🟡', back: 'Yellow' },
    { id: 4, front: '🟢', back: 'Green' },
    { id: 5, front: '🟣', back: 'Purple' },
    { id: 6, front: '🟠', back: 'Orange' },
  ]},
];

interface Card {
  id: string;
  pairId: number;
  content: string;
  isFront: boolean;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGameScreen() {
  const router = useRouter();
  const [selectedSet, setSelectedSet] = useState(CARD_SETS[0]);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<any>(null);

  const initGame = useCallback(() => {
    const pairs = selectedSet.pairs;
    const cardList: Card[] = [];
    pairs.forEach((pair) => {
      cardList.push({ id: `f-${pair.id}`, pairId: pair.id, content: pair.front, isFront: true, isFlipped: false, isMatched: false });
      cardList.push({ id: `b-${pair.id}`, pairId: pair.id, content: pair.back, isFront: false, isFlipped: false, isMatched: false });
    });
    // Shuffle
    for (let i = cardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
    }
    setCards(cardList);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTimer(0);
    setGameOver(false);
    setGameStarted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  }, [selectedSet]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (matched.length === selectedSet.pairs.length && gameStarted) {
      clearInterval(timerRef.current);
      setGameOver(true);
    }
  }, [matched, gameStarted]);

  const flipCard = (cardId: string) => {
    if (!gameStarted || gameOver) return;
    if (flipped.includes(cardId) || matched.some((m) => cards.find((c) => c.id === cardId)?.pairId === parseInt(m))) return;
    if (flipped.length === 2) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped.map((id) => cards.find((c) => c.id === id)!);
      if (first.pairId === second.pairId && first.isFront !== second.isFront) {
        setMatched((prev) => [...prev, String(first.pairId)]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const isFlipped = (card: Card) =>
    flipped.includes(card.id) || matched.includes(String(card.pairId));

  const submitScore = async () => {
    setSubmitting(true);
    try {
      const score = Math.max(0, 100 - moves * 2 + Math.max(0, 60 - timer));
      await authFetch('/api/games/complete', {
        method: 'POST',
        body: JSON.stringify({ game_id: 'memory', score: Math.min(100, score), max_score: 100 }),
      });
      Alert.alert('🧠 Great job!', `Score: ${Math.min(100, score)}/100\nMoves: ${moves}\nTime: ${timer}s`, [
        { text: 'Play Again', onPress: initGame },
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧠 Memory Match</Text>
        {gameStarted && (
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!gameStarted ? (
          // Setup Screen
          <View style={styles.setupScreen}>
            <Text style={styles.setupTitle}>Choose a Card Set</Text>
            {CARD_SETS.map((set) => (
              <TouchableOpacity
                key={set.id}
                style={[styles.setBtn, selectedSet.id === set.id && styles.setBtnActive]}
                onPress={() => setSelectedSet(set)}
              >
                <Text style={[styles.setBtnText, selectedSet.id === set.id && styles.setBtnTextActive]}>
                  {set.label}
                </Text>
                <Text style={styles.setBtnCount}>{set.pairs.length} pairs</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.startBtn} onPress={initGame}>
              <Text style={styles.startBtnText}>🎮 Start Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Game Screen
          <View style={styles.gameScreen}>
            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{moves}</Text>
                <Text style={styles.statLabel}>Moves</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{matched.length}/{selectedSet.pairs.length}</Text>
                <Text style={styles.statLabel}>Matched</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTime(timer)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
            </View>

            {/* Cards Grid */}
            <View style={styles.cardsGrid}>
              {cards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    isFlipped(card) && styles.cardFlipped,
                    matched.includes(String(card.pairId)) && styles.cardMatched,
                  ]}
                  onPress={() => flipCard(card.id)}
                  activeOpacity={0.8}
                >
                  {isFlipped(card) ? (
                    <Text style={styles.cardContent}>{card.content}</Text>
                  ) : (
                    <Text style={styles.cardBack}>?</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Game Over */}
            {gameOver && (
              <View style={styles.gameOverCard}>
                <Text style={styles.gameOverIcon}>🎉</Text>
                <Text style={styles.gameOverTitle}>You Won!</Text>
                <Text style={styles.gameOverStats}>
                  {moves} moves · {formatTime(timer)}
                </Text>
                <View style={styles.gameOverBtns}>
                  <TouchableOpacity style={styles.playAgainBtn} onPress={initGame}>
                    <Text style={styles.playAgainBtnText}>🔄 Play Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitScoreBtn, submitting && { opacity: 0.6 }]}
                    onPress={submitScore}
                    disabled={submitting}
                  >
                    <Text style={styles.submitScoreBtnText}>
                      {submitting ? 'Submitting...' : '⭐ Submit Score'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reset Button */}
            {!gameOver && (
              <TouchableOpacity style={styles.resetBtn} onPress={initGame}>
                <Text style={styles.resetBtnText}>🔄 Reset</Text>
              </TouchableOpacity>
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
  timerText: { color: '#DDD6FE', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
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
  setBtnActive: { borderColor: '#7C3AED', backgroundColor: '#FAF5FF' },
  setBtnText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  setBtnTextActive: { color: '#7C3AED' },
  setBtnCount: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Nunito_400Regular' },
  startBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  gameScreen: { gap: 16 },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' },
  statLabel: { fontSize: 11, color: '#6B7280', fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  card: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardFlipped: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#7C3AED' },
  cardMatched: { backgroundColor: '#D1FAE5', borderColor: '#059669' },
  cardContent: { fontSize: 22, fontFamily: 'Nunito_700Bold', color: '#1F2937', textAlign: 'center' },
  cardBack: { fontSize: 28, color: '#DDD6FE', fontFamily: 'Nunito_800ExtraBold' },
  gameOverCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  gameOverIcon: { fontSize: 52 },
  gameOverTitle: { fontSize: 24, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' },
  gameOverStats: { fontSize: 14, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  gameOverBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  playAgainBtn: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  playAgainBtnText: { color: '#7C3AED', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  submitScoreBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  submitScoreBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  resetBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  resetBtnText: { color: '#6B7280', fontSize: 14, fontFamily: 'Nunito_700Bold' },
});