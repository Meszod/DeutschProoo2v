import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { type Level, type ExamType } from '@/lib/types';
import { LEVELS, EXAM_TYPES } from '@/lib/helpers';
import { Award, ArrowRight, Check } from 'lucide-react';

interface PQuestion {
  q: string;
  options: string[];
  answer: number;
  level: Level;
}

const placementQuestions: PQuestion[] = [
  { q: '___ heißt du?', options: ['Wie', 'Was', 'Wo', 'Wer'], answer: 0, level: 'A1' },
  { q: 'Ich ___ aus Usbekistan.', options: ['bin', 'habe', 'kommst', 'komme'], answer: 3, level: 'A1' },
  { q: '___ Uhr ist es?', options: ['Was', 'Wie', 'Wie viel', 'Welche'], answer: 2, level: 'A1' },
  { q: 'Wir ___ gestern einen Film gesehen.', options: ['haben', 'sind', 'wurden', 'hatten'], answer: 0, level: 'A2' },
  { q: 'Das ist das Buch, ___ ich gelesen habe.', options: ['das', 'was', 'wo', 'der'], answer: 0, level: 'A2' },
  { q: 'Kannst du mir ___ helfen?', options: ['bitte', 'gern', 'vielleicht', 'sicher'], answer: 0, level: 'A2' },
  { q: 'Wenn ich Zeit ___, gehe ich ins Kino.', options: ['habe', 'hatte', 'hat', 'haben'], answer: 0, level: 'B1' },
  { q: 'Der Mann, ___ dort steht, ist mein Lehrer.', options: ['der', 'derer', 'den', 'dessen'], answer: 0, level: 'B1' },
  { q: 'Ich habe mich ___ die Prüfung vorbereitet.', options: ['auf', 'für', 'über', 'bei'], answer: 1, level: 'B1' },
  { q: 'Er hat behauptet, dass er krank ___.', options: ['ist', 'war', 'sei', 'wäre'], answer: 2, level: 'B2' },
  { q: 'Wäre ich du, ___ ich das nicht tun.', options: ['werde', 'würde', 'hat', 'bin'], answer: 1, level: 'B2' },
  { q: 'Das Problem ist ___ komplex, als wir dachten.', options: ['so', 'zu', 'mehr', 'zu sehr'], answer: 1, level: 'B2' },
  { q: 'Trotz ___ Schwierigkeiten haben wir es geschafft.', options: ['der', 'den', 'des', 'die'], answer: 0, level: 'C1' },
  { q: 'Er sprach leise, ___ niemand ihn hören konnte.', options: ['damit', 'sodass', 'womit', 'um'], answer: 1, level: 'C1' },
  { q: 'Die von ihm ___ Lösung war innovativ.', options: ['vorgeschlagene', 'vorschlagende', 'vorgeschlagener', 'vorschlagen'], answer: 0, level: 'C1' },
];

export default function Onboarding() {
  const { t, user, setProfile } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'test' | 'result' | 'prefs'>('intro');
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [recommended, setRecommended] = useState<Level>('A1');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [examType, setExamType] = useState<ExamType>('Goethe');
  const [examDate, setExamDate] = useState('');
  const [saving, setSaving] = useState(false);

  function startTest() {
    setStep('test');
    setAnswers([]);
    setCurrent(0);
  }

  function answer(idx: number) {
    const newAnswers = [...answers, idx];
    setAnswers(newAnswers);
    if (current < placementQuestions.length - 1) {
      setCurrent(current + 1);
    } else {
      computeResult(newAnswers);
    }
  }

  function computeResult(allAnswers: number[]) {
    let correct = 0;
    const levelScores: Record<Level, { correct: number; total: number }> = {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
      C1: { correct: 0, total: 0 },
    };
    allAnswers.forEach((ans, i) => {
      const q = placementQuestions[i];
      const isCorrect = ans === q.answer;
      if (isCorrect) correct++;
      levelScores[q.level].total++;
      if (isCorrect) levelScores[q.level].correct++;
    });

    let rec: Level = 'A1';
    const ratio = correct / allAnswers.length;
    if (ratio >= 0.93) rec = 'C1';
    else if (ratio >= 0.73) rec = 'B2';
    else if (ratio >= 0.53) rec = 'B1';
    else if (ratio >= 0.33) rec = 'A2';
    else rec = 'A1';

    setRecommended(rec);
    setSelectedLevel(rec);
    setStep('result');
  }

  async function savePreferences() {
    if (!user || !selectedLevel) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          target_level: selectedLevel,
          target_exam_type: examType,
          exam_date: examDate || null,
          placement_level: recommended,
        })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-3">{t('placementTest')}</h1>
          <p className="text-slate-500 mb-8">{t('placementIntro')}</p>
          <button onClick={startTest} className="btn-primary w-full">
            {t('startPlacement')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'test') {
    const q = placementQuestions[current];
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 max-w-lg w-full">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-slate-500">
              {t('question')} {current + 1} {t('of')} {placementQuestions.length}
            </span>
            <span className="badge bg-sky-50 text-sky-600">{q.level}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / placementQuestions.length) * 100}%` }}
            />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">{q.q}</h2>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(i)}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50 transition-colors text-slate-700 font-medium"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">{t('recommendedLevel')}</h2>
            <div className="text-5xl font-bold text-sky-600 my-4">{recommended}</div>
          </div>

          <div className="mb-6">
            <label className="label">{t('level')}</label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`level-pill ${
                    selectedLevel === lvl
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="label">{t('examType')}</label>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((et) => (
                <button
                  key={et}
                  onClick={() => setExamType(et)}
                  className={`level-pill ${
                    examType === et ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {et}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="label">{t('examDate')}</label>
            <input type="date" className="input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>

          <button onClick={savePreferences} disabled={saving || !selectedLevel} className="btn-primary w-full">
            {saving ? t('loading') : t('continue')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
