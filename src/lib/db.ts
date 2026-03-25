// src/lib/db.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Student = {
  id: string;
  username: string;
  password?: string;
  name: string;
  school: string;
};

export type QuestionType = 'pilihan_ganda' | 'pilihan_ganda_kompleks' | 'multiple_choice_multiple_answer';

export type Statement = {
  text: string;
  isCorrect?: boolean; // For pilihan_ganda_kompleks
  correctAnswer?: string; // For multiple_choice_multiple_answer (e.g. 'Setuju' / 'Tidak Setuju')
};

export type Question = {
  id: string;
  subject: string;
  question: string;
  type: QuestionType;
  // Type: pilihan_ganda
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  // Type: pilihan_ganda_kompleks & multiple_choice_multiple_answer
  statements?: Statement[]; // 3 statements for both
  image?: string; // Optional image URL or base64
};

export type ExamToken = {
  id: string;
  token: string;
  durationMinutes: number;
  questionCount: number;
  subject?: string;
  active: boolean;
};

export type Answer = {
  studentId: string;
  questionId: string;
  selectedAnswer: any; // Flexible answer type
};

export type Result = {
  id: string;
  studentId: string;
  studentName: string;
  school: string;
  correct: number;
  wrong: number;
  score: number;
  timestamp: string;
};

export type ExamState = {
  studentId: string;
  tokenId: string;
  endTime: number | null; // epoch time
  startTime: number | null;
  answers: Record<string, any>; // questionId -> selectedAnswer
  doubt: Record<string, boolean>; // questionId -> doubt toggle
  questionOrder: string[]; // randomized question IDs
  optionOrder: Record<string, any>; // questionId -> shuffled options/statements
  submitted: boolean;
};

// --- Mappers ---
const mapQuestionFromDb = (q: any): Question => {
  let qTypeRaw = (q.type || '').toUpperCase();
  let qType: QuestionType = 'pilihan_ganda';
  
  if (qTypeRaw === 'MC' || qTypeRaw === 'PILIHAN_GANDA') qType = 'pilihan_ganda';
  else if (qTypeRaw === 'MCMA' || qTypeRaw === 'PILIHAN_GANDA_KOMPLEKS') qType = 'pilihan_ganda_kompleks';
  else if (qTypeRaw === 'TF' || qTypeRaw === 'MULTIPLE_CHOICE_MULTIPLE_ANSWER') qType = 'multiple_choice_multiple_answer';

  const res: Question = {
    id: q.id,
    subject: q.subject || 'Umum',
    question: q.question,
    type: qType,
    image: q.image || ''
  };

  const optionsArray = q.options || [];

  if (qType === 'pilihan_ganda') {
    res.option_a = optionsArray[0] || '';
    res.option_b = optionsArray[1] || '';
    res.option_c = optionsArray[2] || '';
    res.option_d = optionsArray[3] || '';
    res.correct_answer = (q.answer || 'A') as any;
  } else if (qType === 'pilihan_ganda_kompleks') {
    const correctAnswers = (q.answer || '').toUpperCase().split(',').map((s: string) => s.trim());
    res.statements = optionsArray.map((opt: any, idx: number) => {
        const letter = String.fromCharCode(65 + idx);
        return { text: typeof opt === 'string' ? opt : (opt.statement || ''), isCorrect: correctAnswers.includes(letter) };
    });
  } else if (qType === 'multiple_choice_multiple_answer') {
    res.statements = optionsArray.map((opt: any) => {
        return { text: opt.statement || (typeof opt === 'string' ? opt : ''), correctAnswer: opt.answer || 'Sesuai' };
    });
  }
  return res;
};

export const api = {
  // --- Students ---
  getStudents: async () => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    return data as Student[];
  },
  addStudent: async (student: Student) => {
    const { error } = await supabase.from('students').insert([student]);
    if (error) throw error;
  },
  updateStudent: async (student: Student) => {
    const { error } = await supabase.from('students').update(student).eq('id', student.id);
    if (error) throw error;
  },
  deleteStudent: async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  },
  setStudents: async (ss: Student[]) => {
    const { error } = await supabase.from('students').upsert(ss);
    if (error) throw error;
  },
  
  // --- Tokens ---
  getTokens: async () => {
    const { data, error } = await supabase.from('tokens').select('*');
    if (error) throw error;
    return (data || []).map(t => ({
        ...t,
        durationMinutes: t.durationMinutes,
        questionCount: t.questionCount
    })) as ExamToken[];
  },
  addToken: async (token: ExamToken) => {
    const { error } = await supabase.from('tokens').insert([token]);
    if (error) throw error;
  },
  setTokens: async (ts: ExamToken[]) => {
    const { error } = await supabase.from('tokens').upsert(ts);
    if (error) throw error;
  },
  getTokenByStr: async (tokenStr: string) => {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .ilike('token', tokenStr)
      .eq('active', true)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data as ExamToken | null;
  },

  // --- Questions ---
  getQuestions: async () => {
    const { data, error } = await supabase.from('questions').select('*');
    if (error) throw error;
    return (data || []).map(mapQuestionFromDb);
  },
  addQuestion: async (q: Question) => {
    // Basic mapping for insertion
    const payload: any = {
        id: q.id,
        subject: q.subject,
        question: q.question,
        type: q.type === 'pilihan_ganda' ? 'MC' : q.type === 'pilihan_ganda_kompleks' ? 'MCMA' : 'TF',
        image: q.image || ''
    };

    if (q.type === 'pilihan_ganda') {
        payload.options = [q.option_a, q.option_b, q.option_c, q.option_d];
        payload.answer = q.correct_answer;
    } else {
        payload.options = q.statements?.map(s => s.text) || [];
        if (q.type === 'pilihan_ganda_kompleks') {
            payload.answer = q.statements?.map((s, i) => s.isCorrect ? String.fromCharCode(65 + i) : null).filter(Boolean).join(',');
        }
    }

    const { error } = await supabase.from('questions').insert([payload]);
    if (error) throw error;
  },
  updateQuestion: async (q: Question) => {
    const payload: any = {
        subject: q.subject,
        question: q.question,
        type: q.type === 'pilihan_ganda' ? 'MC' : q.type === 'pilihan_ganda_kompleks' ? 'MCMA' : 'TF',
        image: q.image || ''
    };

    if (q.type === 'pilihan_ganda') {
        payload.options = [q.option_a, q.option_b, q.option_c, q.option_d];
        payload.answer = q.correct_answer;
    } else {
        payload.options = q.statements?.map(s => s.text) || [];
        if (q.type === 'pilihan_ganda_kompleks') {
            payload.answer = q.statements?.map((s, i) => s.isCorrect ? String.fromCharCode(65 + i) : null).filter(Boolean).join(',');
        }
    }

    const { error } = await supabase.from('questions').update(payload).eq('id', q.id);
    if (error) throw error;
  },
  deleteQuestion: async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
  },
  setQuestions: async (qs: Question[]) => {
    // This is for mass import, complex mapping might be needed but let's keep it simple for now
    const payloads = qs.map(q => {
        const payload: any = {
            id: q.id,
            subject: q.subject,
            question: q.question,
            type: q.type === 'pilihan_ganda' ? 'MC' : q.type === 'pilihan_ganda_kompleks' ? 'MCMA' : 'TF',
            image: q.image || ''
        };
        if (q.type === 'pilihan_ganda') {
            payload.options = [q.option_a, q.option_b, q.option_c, q.option_d];
            payload.answer = q.correct_answer;
        } else {
            payload.options = q.statements?.map(s => s.text) || [];
            if (q.type === 'pilihan_ganda_kompleks') {
                payload.answer = q.statements?.map((s, i) => s.isCorrect ? String.fromCharCode(65 + i) : null).filter(Boolean).join(',');
            }
        }
        return payload;
    });
    const { error } = await supabase.from('questions').upsert(payloads);
    if (error) throw error;
  },

  // --- Results ---
  getResults: async () => {
    const { data, error } = await supabase.from('results').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []) as Result[];
  },
  addResult: async (res: Result) => {
    const { error } = await supabase.from('results').insert([res]);
    if (error) throw error;
  },
  updateResult: async (res: Result) => {
    const { error } = await supabase.from('results').update(res).eq('id', res.id);
    if (error) throw error;
  },
  deleteResult: async (id: string) => {
    const { error } = await supabase.from('results').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Exam State (Concurrent Sessions) ---
  getAllExamStates: async () => {
    const { data, error } = await supabase.from('exam_states').select('*');
    if (error) throw error;
    const result: Record<string, ExamState> = {};
    (data || []).forEach(s => {
        result[s.studentId] = s;
    });
    return result;
  },
  getExamState: async (studentId: string) => {
    const { data, error } = await supabase.from('exam_states').select('*').eq('studentId', studentId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as ExamState | null;
  },
  setExamState: async (state: ExamState) => {
    const { error } = await supabase.from('exam_states').upsert(state);
    if (error) throw error;
  },
  updateExamState: async (studentId: string, update: Partial<ExamState>) => {
    const { error } = await supabase.from('exam_states').update(update).eq('studentId', studentId);
    if (error) throw error;
  },
  deleteExamState: async (studentId: string) => {
    const { error } = await supabase.from('exam_states').delete().eq('studentId', studentId);
    if (error) throw error;
  },
  
  // --- Helpers ---
  getResultsByStudent: async (studentId: string) => {
    const { data, error } = await supabase.from('results').select('*').eq('studentId', studentId);
    if (error) throw error;
    return (data || []) as Result[];
  },
  clearAll: async () => {
    // DANGEROUS: Usually not used in real Supabase production except for dev
    console.warn("clearAll called - this implemention only clears localStorage. Supabase must be managed via dashboard or migration scripts.");
    localStorage.clear();
  },

  // --- Database Initialization (Empty for full online) ---
  initializeDatabase: async () => {
    // Nothing to seed locally anymore
    console.log('Using Supabase as primary engine.');
  },

  resetDatabase: async () => {
    // In full online mode, "reset" should probably just clear local storage session and reload
    localStorage.clear();
    window.location.reload();
  },

  // --- CSV Parsers ---
  parseCSV: (content: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (currentCell || currentRow.length > 0) {
                currentRow.push(currentCell.trim());
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            }
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            currentCell += char;
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }
    return rows;
  },

  parseQuestionCSV: (text: string) => {
    const allRows = api.parseCSV(text);
    if (allRows.length < 2) return [];

    const dataRows = allRows.slice(1);
    const questions: Question[] = [];

    dataRows.forEach(cols => {
      if (cols.length >= 3) {
        let qTypeRaw = cols[2].toUpperCase();
        let qType: any = 'pilihan_ganda';
        
        if (qTypeRaw === 'MC' || qTypeRaw === 'PILIHAN_GANDA') qType = 'pilihan_ganda';
        else if (qTypeRaw === 'MCMA' || qTypeRaw === 'PILIHAN_GANDA_KOMPLEKS') qType = 'pilihan_ganda_kompleks';
        else if (qTypeRaw === 'TF' || qTypeRaw === 'MULTIPLE_CHOICE_MULTIPLE_ANSWER') qType = 'multiple_choice_multiple_answer';

        const q: Question = {
          id: 'Q-' + Math.random().toString(36).substring(2, 9),
          subject: cols[0],
          question: cols[1],
          type: qType,
          image: cols[14] || '',
        };

        if (qType === 'pilihan_ganda') {
          q.option_a = cols[3] || '';
          q.option_b = cols[4] || '';
          q.option_c = cols[5] || '';
          q.option_d = cols[6] || '';
          q.correct_answer = (cols[7] || 'A').toUpperCase() as any;
        } else if (qType === 'pilihan_ganda_kompleks') {
          const statements: Statement[] = [];
          const correctIndices = (cols[7] || '').toUpperCase().split(',').map(s => s.trim());

          if (cols[3] || cols[4] || cols[5]) {
            if (cols[3]) statements.push({ text: cols[3], isCorrect: correctIndices.includes('A') });
            if (cols[4]) statements.push({ text: cols[4], isCorrect: correctIndices.includes('B') });
            if (cols[5]) statements.push({ text: cols[5], isCorrect: correctIndices.includes('C') });
            if (cols[6]) statements.push({ text: cols[6], isCorrect: correctIndices.includes('D') });
          } else {
            if (cols[8]) statements.push({ text: cols[8], isCorrect: cols[9] === 'Benar' || cols[9] === 'Sesuai' || cols[9] === 'Tepat' });
            if (cols[10]) statements.push({ text: cols[10], isCorrect: cols[11] === 'Benar' || cols[11] === 'Sesuai' || cols[11] === 'Tepat' });
            if (cols[12]) statements.push({ text: cols[12], isCorrect: cols[13] === 'Benar' || cols[13] === 'Sesuai' || cols[13] === 'Tepat' });
          }
          q.statements = statements;
        } else if (qType === 'multiple_choice_multiple_answer') {
          const statements: Statement[] = [];
          if (cols[8]) statements.push({ text: cols[8], correctAnswer: cols[9] || 'Sesuai' });
          if (cols[10]) statements.push({ text: cols[10], correctAnswer: cols[11] || 'Sesuai' });
          if (cols[12]) statements.push({ text: cols[12], correctAnswer: cols[13] || 'Sesuai' });
          q.statements = statements;
        }
        questions.push(q);
      }
    });
    return questions;
  },

  parseStudentCSV: (text: string) => {
    const allRows = api.parseCSV(text);
    if (allRows.length < 2) return [];
    return allRows.slice(1).filter(cols => cols.length >= 4).map(cols => ({
      id: 'S-' + Math.random().toString(36).substring(2, 9),
      username: cols[0],
      password: cols[1],
      name: cols[2],
      school: cols[3]
    }));
  }
};

