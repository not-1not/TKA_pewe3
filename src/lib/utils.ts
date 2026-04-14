import { Question } from './db';

// Randomize array
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Auto-scorer
export const calculateScore = (
  questions: Question[],
  answers: Record<string, any>
) => {
  let correctCount = 0;
  let wrongCount = 0;
  let totalScore = 0;
  let maxPossibleScore = 0;

  questions.forEach(q => {
    const ans = answers[q.id];

    if (q.type === 'pilihan_ganda') {
      maxPossibleScore += 1;
      if (ans && ans === q.correct_answer) {
        totalScore += 1;
        correctCount++;
      } else {
        wrongCount++;
      }
    } else if (q.type === 'pilihan_ganda_kompleks') {
      const correctIndices = q.statements?.map((s, i) => s.isCorrect ? i : -1).filter(i => i !== -1) || [];
      maxPossibleScore += correctIndices.length;
      
      const selectedIndices = (ans as number[]) || [];
      let matchCount = 0;
      selectedIndices.forEach(idx => {
        if (correctIndices.includes(idx)) matchCount++;
      });
      
      totalScore += matchCount;
      // Mark question as 'fully correct' only if all correct options selected AND no extra wrong ones
      if (matchCount === correctIndices.length && selectedIndices.length === correctIndices.length) {
        correctCount++;
      } else {
        wrongCount++;
      }
    } else if (q.type === 'multiple_choice_multiple_answer') {
      const statements = q.statements || [];
      maxPossibleScore += statements.length;
      
      const statementAnswers = (ans as Record<number, string>) || {};
      let matchCount = 0;
      statements.forEach((s, i) => {
        if (statementAnswers[i] === s.correctAnswer) matchCount++;
      });
      
      totalScore += matchCount;
      if (matchCount === statements.length && statements.length > 0) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }
  });

  const finalScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  return { 
    correct: correctCount, 
    wrong: wrongCount, 
    score: finalScore,
    maxScore: 100
  };
};

// Format time utility
export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Server time synchronization mock
let serverTimeOffset = 0;

export const syncServerTime = async () => {
  try {
    const start = Date.now();
    const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-cache' });
    const end = Date.now();
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const latency = (end - start) / 2;
      serverTimeOffset = serverTime + latency - end;
    }
  } catch (e) {
    console.error('Failed to sync server time, using local time');
  }
};

export const getServerTime = () => Date.now() + serverTimeOffset;
