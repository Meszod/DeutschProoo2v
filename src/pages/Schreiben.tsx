import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level, AIFeedback } from '@/lib/types';
import { LEVELS, countWords, formatTime } from '@/lib/helpers';
import { PenLine, ArrowLeft, Clock, Sparkles, Check, X, AlertCircle } from 'lucide-react';

export default function Schreiben() {
  const { t, profile, user } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(profile?.target_level || null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!selectedLevel) return;
    (async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('skill', 'schreiben')
        .eq('level', selectedLevel)
        .order('created_at', { ascending: true });
      setTasks(data || []);
    })();
  }, [selectedLevel]);

  useEffect(() => {
    if (activeTask && !feedback) {
      const limit = (activeTask.content.max_words || 100) * 0.6 * 60;
      setTimeLeft(Math.round(limit));
      timerRef.current = setInterval(() => {
        setTimeLeft((p) => {
          if (p <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTask, feedback]);

  async function handleEvaluate() {
    if (!activeTask) return;
    setEvaluating(true);

    const fb = evaluateWriting(text, activeTask);
    setFeedback(fb);

    if (user) {
      try {
        await supabase.from('attempts').insert({
          skill: 'schreiben',
          level: activeTask.level,
          task_id: activeTask.id,
          score: fb.total_score || 0,
          max_score: 100,
          ai_feedback: fb as any,
          user_input: text,
          duration_seconds: Math.round((activeTask.content.max_words || 100) * 0.6 * 60) - timeLeft,
        });
        await supabase.rpc('record_activity', { p_points: Math.round((fb.total_score || 0) / 10) });
        setSaved(true);
      } catch (err) {
        console.error(err);
      }
    }

    setEvaluating(false);
  }

  function reset() {
    setText('');
    setFeedback(null);
    setSaved(false);
    setActiveTask(null);
  }

  if (activeTask && feedback) {
    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={reset} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        <div className="card p-8 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
            (feedback.total_score || 0) >= 60 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}>
            <span className="text-3xl font-bold">{feedback.total_score}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('score')} / 100</h2>
          {saved && <p className="text-xs text-emerald-600 mt-2">✓ {t('saved')}</p>}
        </div>

        {/* Criteria breakdown */}
        {feedback.criteria && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4">{t('criteria')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                ['aufgabenerfullung', t('aufgabenerfullung')],
                ['wortschatz', t('wortschatz')],
                ['grammatik', t('grammatik')],
                ['aufbau_koharenz', t('aufbau')],
              ] as const).map(([key, label]) => {
                const val = feedback.criteria?.[key] || 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-900">{val}/25</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${val >= 18 ? 'bg-emerald-500' : val >= 12 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${(val / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {feedback.summary && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-900">{t('feedback')}</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">{feedback.summary}</p>
          </div>
        )}

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-3">{t('strengths')}</h3>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {feedback.improvements && feedback.improvements.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-3">{t('improvements')}</h3>
            <ul className="space-y-2">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Errors */}
        {feedback.errors && feedback.errors.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-3">{t('errors')}</h3>
            <div className="space-y-3">
              {feedback.errors.map((e, i) => (
                <div key={i} className="border-l-2 border-red-200 pl-3">
                  <p className="text-sm text-slate-700">
                    <span className="text-red-600 line-through">{e.error}</span>
                    {' → '}
                    <span className="text-emerald-600 font-medium">{e.correction}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{e.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={reset} className="btn-secondary w-full">
          {t('back')}
        </button>
      </div>
    );
  }

  if (activeTask) {
    const wordCount = countWords(text);
    const minW = activeTask.content.min_words || 30;
    const maxW = activeTask.content.max_words || 100;
    return (
      <div className="space-y-5 animate-fade-in">
        <button
          onClick={() => { setActiveTask(null); setText(''); }}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">{activeTask.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge bg-sky-50 text-sky-600">{activeTask.level}</span>
              {activeTask.teil_number && <span className="badge bg-slate-100 text-slate-600">Teil {activeTask.teil_number}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-slate-700 leading-relaxed mb-4">{activeTask.content.prompt}</p>
          {activeTask.content.leitpunkte && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">{t('leitpunkte')}:</p>
              <ul className="space-y-1">
                {activeTask.content.leitpunkte.map((lp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-sky-500 font-bold">•</span>
                    {lp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">{t('yourText')}</label>
            <span className={`text-sm ${wordCount < minW ? 'text-amber-600' : wordCount > maxW ? 'text-red-600' : 'text-emerald-600'}`}>
              {wordCount} / {minW}-{maxW} {t('words')}
            </span>
          </div>
          <textarea
            className="input min-h-[200px] resize-y leading-relaxed"
            placeholder={t('writeHere')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          onClick={handleEvaluate}
          disabled={evaluating || wordCount < 10}
          className="btn-primary w-full"
        >
          {evaluating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('evaluating')}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t('evaluate')}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <PenLine className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('schreiben')}</h1>
          <p className="text-sm text-slate-500">AI {t('feedback').toLowerCase()}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`level-pill ${
              selectedLevel === lvl
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {!selectedLevel ? (
        <div className="card p-12 text-center text-slate-400">{t('selectLevel')}</div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">{t('noTasks')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => { setActiveTask(task); setText(''); setFeedback(null); setSaved(false); }}
              className="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-sky-50 text-sky-600">{task.level}</span>
                {task.teil_number && <span className="badge bg-slate-100 text-slate-600">Teil {task.teil_number}</span>}
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{task.title}</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.content.prompt}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Heuristic-based writing evaluation (simulates AI assessment)
function evaluateWriting(text: string, task: Task): AIFeedback {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  const avgSentenceLen = wordCount / sentenceCount;

  const minW = task.content.min_words || 30;
  const maxW = task.content.max_words || 100;
  const leitpunkte = task.content.leitpunkte || [];

  // Aufgabenerfüllung: word count in range + leitpunkte coverage
  let leitpunkteCovered = 0;
  leitpunkte.forEach((lp) => {
    const keywords = lp.toLowerCase().split(/\s+/).slice(0, 3);
    const textLower = text.toLowerCase();
    if (keywords.some((k) => textLower.includes(k))) leitpunkteCovered++;
  });
  const leitpunkteRatio = leitpunkte.length > 0 ? leitpunkteCovered / leitpunkte.length : 0.7;
  const wordRatio = wordCount >= minW && wordCount <= maxW ? 1 : wordCount < minW ? wordCount / minW : Math.max(0.5, maxW / wordCount);
  const aufgabenerfullung = Math.round((leitpunkteRatio * 0.6 + wordRatio * 0.4) * 25);

  // Wortschatz: unique words ratio + common connectors
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[.,!?;:]/g, '')));
  const uniqueRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;
  const connectors = ['und', 'oder', 'aber', 'weil', 'dass', 'wenn', 'als', 'dann', 'auch', 'nur', 'schon', 'noch', 'sehr', 'immer', 'oft'];
  const connectorCount = connectors.filter((c) => text.toLowerCase().includes(` ${c} `)).length;
  const wortschatz = Math.min(25, Math.round((uniqueRatio * 0.7 + Math.min(connectorCount / 5, 0.3)) * 25));

  // Grammatik: check common errors
  const errors: Array<{ error: string; explanation: string; correction: string }> = [];
  const lowerText = text.toLowerCase();

  // Check capitalized nouns (basic)
  const nouns = text.match(/\b[a-z]+(ung|heit|keit|schaft|tion|tät|ismus)\b/g);
  if (nouns) {
    nouns.slice(0, 2).forEach((n) => {
      errors.push({
        error: n,
        explanation: 'Susbstantivlar nemis tilida katta harf bilan boshlanishi kerak.',
        correction: n.charAt(0).toUpperCase() + n.slice(1),
      });
    });
  }

  // Check "ich" capitalization
  if (lowerText.includes(' ich ') || text.startsWith('ich ')) {
    errors.push({
      error: 'ich',
      explanation: '"ich" kichik harf bilan yoziladi (faqat boshida katta).',
      correction: 'ich',
    });
  }

  // Check basic verb placement
  if (sentences.some((s) => {
    const words = s.trim().split(/\s+/);
    return words.length > 3 && !words.slice(0, 3).some((w) => /^(ge|ver|be|er|ent)/.test(w.toLowerCase()) || w.endsWith('e') || w.endsWith('en') || w.endsWith('t'));
  })) {
    // soft check - don't always flag
  }

  const errorPenalty = Math.min(15, errors.length * 3);
  const grammatik = Math.max(5, 25 - errorPenalty);

  // Aufbau/Kohärenz: sentence variety + connectors
  const sentenceVariety = Math.min(1, sentenceCount / 5);
  const aufbau = Math.min(25, Math.round((sentenceVariety * 0.5 + Math.min(connectorCount / 4, 0.5)) * 25));

  const total = aufgabenerfullung + wortschatz + grammatik + aufbau;

  const strengths: string[] = [];
  if (leitpunkteCovered >= leitpunkte.length * 0.7) strengths.push('Topshiriqning asosiy punktlari yaxshi qamrab olingan.');
  if (uniqueRatio > 0.6) strengths.push('Lug\'at boyligi yaxshi — turli so\'zlar ishlatilgan.');
  if (connectorCount >= 3) strengths.push('Bog\'lovchilar matnni mantiqiy bog\'laydi.');
  if (avgSentenceLen > 5 && avgSentenceLen < 20) strengths.push('Gap uzunligi optimal.');

  const improvements: string[] = [];
  if (wordCount < minW) improvements.push(`Matn juda qisqa — kamida ${minW} so\'z kerak (hozir ${wordCount}).`);
  if (wordCount > maxW) improvements.push(`Matn juda uzun — maksimal ${maxW} so\'z (hozir ${wordCount}).`);
  if (leitpunkteCovered < leitpunkte.length * 0.5) improvements.push('Leitpunkte to\'liq qamrab olinmagan.');
  if (connectorCount < 2) improvements.push('Bog\'lovchilarni ko\'proq ishlating (und, weil, dass, wenn).');
  if (sentenceCount < 3) improvements.push('Matnni ko\'proq gaplarga bo\'ling.');

  let summary = `Sizning matningiz ${wordCount} so\'zdan iborat. `;
  if (total >= 80) summary += 'Ajoyib natija! Asosiy ko\'nikmalar yaxshi rivojlangan.';
  else if (total >= 60) summary += 'Yaxshi natija, lekin ba\'zi jihatlarni yaxshilash mumkin.';
  else summary += 'Matnni yaxshilash uchun quyidagi tavsiyalarga e\'tibor bering.';

  return {
    total_score: total,
    criteria: {
      aufgabenerfullung,
      wortschatz,
      grammatik,
      aufbau_koharenz: aufbau,
    },
    errors,
    summary,
    strengths,
    improvements,
  };
}
