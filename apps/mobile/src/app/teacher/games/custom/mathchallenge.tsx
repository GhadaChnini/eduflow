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

const DIFFICULTIES = [
  { id: 'easy', label: '🟢 Easy', desc: 'Addition & Subtraction (1-20)', time: 30 },
  { id: 'medium', label: '🟡 Medium', desc: 'Multiplication & Division (1-12)', time: 20 },
  { id: 'hard', label: '🔴 Hard', desc: 'Mixed operations (1-100)', time: 15 },
];

interface Question {
  expression: string;
  answer: number;
  options: number[];
}

const generateQuestion = (difficulty: string): Question => {
  let a: number, b: number, op: string, answer: number, expression: string;

  if (difficulty === 'easy') {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    op = Math.random() > 0.5 ? '+' : '-';
    if (op === '-' && b > a) [a, b] = [b, a];
    answer = op === '+' ? a + b : a - b;
    expression = `${a} ${op} ${b}`;
  } else if (difficulty === 'medium') {
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
    op = Math.random() > 0.5 ? '×' : '÷';
    if (op === '÷') {
      answer = a;
      expression = `${a * b} ÷ ${b}`;
    } else {
      answer = a * b;
      expression = `${a} × ${b}`;
    }
  } else {
    a = Math.floor(Math.random() * 100) + 1;
    b = Math.floor(Math.random() * 50) + 1;
    const ops = ['+', '-', '×'];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '-' && b > a) [a, b] = [b, a];
    if (op === '×') { a = Math.floor(Math.random() * 20) + 1; b = Math.floor(Math.random() * 10) + 1; }
    answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    expression = `${a} ${op} ${b}`;
  }

  // Generate wrong options
  const wrongOptions = new Set<number>();
  while (wrongOptions.size < 3) {
    const offset = Math.floor(Math.random() * 10) + 1;
    const wrong = Math.random() > 0.5 ? answer + offset : answer - offset;
    if (wrong !== answer && wrong >= 0) wrongOptions.add(wrong);
  }

  const options = [answer, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
  return { expression, answer, options };
};

export default function MathChallengeScreen() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0]);
  const [gameStarted, setGameStarted] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNum, setQuestionNum] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const TOTAL_QUESTIONS = 10;

  const startGame = useCallback(() => {
    setGameStarted(true);
    setQuestionNum(1);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    setSelected(null);
    setFeedback(null);
    setQuestion(generateQuestion(difficulty.id));
    startTimer(difficulty.time);
  }, [difficulty]);

  const startTimer = (time: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(time);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleTimeout = () => {
    setStreak(0);
    setFeedback('wrong');
    setSelected(-1);
    setTimeout(() => nextQuestion(), 1200);
  };

  const bounce = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleAnswer = (option: number) => {
    if (selected !== null || feedback !== null) return;
    clearInterval(timerRef.current);
    setSelected(option);

    if (option === question?.answer) {
      bounce();
      const bonusPoints = timer > 20 ? 3 : timer > 10 ? 2 : 1;
      const streakBonus = streak >= 3 ? 1 : 0;
      setScore((s) => s + bonusPoints + streakBonus);
      setStreak((s) => s + 1);
      setFeedback('correct');
    } else {
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => nextQuestion(), 1000);
  };

  const nextQuestion = () => {
    const next = questionNum + 1;
    if (next > TOTAL_QUESTIONS) {
      setGameOver(true);
    } else {
      setQuestionNum(next);
      setQuestion(generateQuestion(difficulty.id));
      setSelected(null);
      setFeedback(null);
      startTimer(difficulty.time);
    }
  };

  const submitScore = async () => {
    setSubmitting(true);
    try {
      const finalScore = Math.round((score / (TOTAL_QUESTIONS * 3)) * 100);
      await authFetch('/api/games/complete', {
        method: 'POST',
        body: JSON.stringify({ game_id: 'mathchallenge', score: Math.min(100, finalScore), max_score: 100 }),
      });
      Alert.alert(
        '🔢 Math Challenge Complete!',
        `Score: ${score} pts\nRating: ${finalScore >= 80 ? '🏆 Excellent' : finalScore >= 60 ? '⭐ Good' : '💪 Keep practicing'}`,
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
        <Text style={styles.headerTitle}>🔢 Math Challenge</Text>
        {gameStarted && !gameOver && (
          <Text style={[styles.timerText, timer <= 5 && styles.timerDanger]}>{timer}s</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!gameStarted ? (
          // Setup
          <View style={styles.setupScreen}>
            <Text style={styles.setupTitle}>Choose Difficulty</Text>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.diffBtn, difficulty.id === d.id && styles.diffBtnActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.diffLabel, difficulty.id === d.id && styles.diffLabelActive]}>
                  {d.label}
                </Text>
                <Text style={styles.diffDesc}>{d.desc}</Text>
                <Text style={styles.diffTime}>⏱ {d.time}s per question</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>📋 How to play</Text>
              <Text style={styles.rulesText}>• 10 questions per round</Text>
              <Text style={styles.rulesText}>• Faster answers = more points</Text>
              <Text style={styles.rulesText}>• 3+ streak = bonus point!</Text>
            </View>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>🎮 Start Challenge</Text>
            </TouchableOpacity>
          </View>
        ) : gameOver ? (
          // Game Over
          <View style={styles.gameOverCard}>
            <Text style={styles.gameOverIcon}>
              {score >= TOTAL_QUESTIONS * 2.5 ? '🏆' : score >= TOTAL_QUESTIONS * 1.5 ? '⭐' : '💪'}
            </Text>
            <Text style={styles.gameOverTitle}>Challenge Complete!</Text>
            <Text style={styles.gameOverScore}>{score} points earned</Text>
            <Text style={styles.gameOverSub}>out of {TOTAL_QUESTIONS} questions</Text>
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
                  {submitting ? 'Saving...' : '⭐ Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Game
          <View style={styles.gameScreen}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <Text style={styles.questionNum}>Q{questionNum}/{TOTAL_QUESTIONS}</Text>
              {streak >= 3 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {streak} streak!</Text>
                </View>
              )}
              <Text style={styles.scoreDisplay}>⭐ {score} pts</Text>
            </View>

            {/* Timer Bar */}
            <View style={styles.timerBarContainer}>
              <Animated.View
                style={[
                  styles.timerBarFill,
                  {
                    width: `${(timer / difficulty.time) * 100}%`,
                    backgroundColor: timer <= 5 ? '#DC2626' : timer <= 10 ? '#D97706' : '#059669',
                  },
                ]}
              />
            </View>

            {/* Question */}
            <Animated.View style={[styles.questionCard, { transform: [{ scale: scaleAnim }] },
              feedback === 'correct' && styles.questionCardCorrect,
              feedback === 'wrong' && styles.questionCardWrong,
            ]}>
              <Text style={styles.questionLabel}>What is...</Text>
              <Text style={styles.questionText}>{question?.expression} = ?</Text>
              {feedback && (
                <Text style={styles.feedbackText}>
                  {feedback === 'correct'
                    ? `✅ Correct! +${timer > 20 ? 3 : timer > 10 ? 2 : 1}${streak >= 3 ? '+1🔥' : ''} pts`
                    : `❌ Answer: ${question?.answer}`}
                </Text>
              )}
            </Animated.View>

            {/* Options */}
            <View style={styles.optionsGrid}>
              {question?.options.map((option, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.optionBtn,
                    selected === option && option === question.answer && styles.optionCorrect,
                    selected === option && option !== question.answer && styles.optionWrong,
                    selected !== null && selected !== option && option === question.answer && styles.optionReveal,
                  ]}
                  onPress={() => handleAnswer(option)}
                  disabled={selected !== null}
                >
                  <Text style={[
                    styles.optionText,
                    (selected === option) && styles.optionTextSelected,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#059669',
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
  timerText: { color: '#A7F3D0', fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  timerDanger: { color: '#FCA5A5' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  setupScreen: { gap: 12, paddingTop: 8 },
  setupTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#1F2937', marginBottom: 4 },
  diffBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  diffBtnActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  diffLabel: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  diffLabelActive: { color: '#059669' },
  diffDesc: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_400Regular' },
  diffTime: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_600SemiBold' },
  rulesCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  rulesTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#059669', marginBottom: 4 },
  rulesText: { fontSize: 13, color: '#374151', fontFamily: 'Nunito_400Regular' },
  startBtn: { backgroundColor: '#059669', borderRadius: 14, padding: 16, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  gameScreen: { gap: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionNum: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#6B7280' },
  streakBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  streakText: { fontSize: 13, color: '#D97706', fontFamily: 'Nunito_700Bold' },
  scoreDisplay: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#059669' },
  timerBarContainer: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  timerBarFill: { height: '100%', borderRadius: 4 },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 160,
    justifyContent: 'center',
  },
  questionCardCorrect: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  questionCardWrong: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  questionLabel: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Nunito_600SemiBold' },
  questionText: { fontSize: 42, fontFamily: 'Nunito_800ExtraBold', color: '#059669' },
  feedbackText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#374151', marginTop: 4 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionBtn: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  optionCorrect: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  optionWrong: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  optionReveal: { backgroundColor: '#ECFDF5', borderColor: '#059669', opacity: 0.7 },
  optionText: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: '#1F2937' },
  optionTextSelected: { color: '#1F2937' },
  gameOverCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginTop: 20,
  },
  gameOverIcon: { fontSize: 60 },
  gameOverTitle: { fontSize: 26, fontFamily: 'Nunito_800ExtraBold', color: '#059669' },
  gameOverScore: { fontSize: 32, fontFamily: 'Nunito_800ExtraBold', color: '#1F2937' },
  gameOverSub: { fontSize: 14, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  gameOverBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  playAgainBtn: { flex: 1, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, alignItems: 'center' },
  playAgainBtnText: { color: '#059669', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  submitBtn: { flex: 1, backgroundColor: '#059669', borderRadius: 12, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
});