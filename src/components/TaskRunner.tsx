import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Question } from '@/lib/types';
import { formatTime } from '@/lib/helpers';
import { Play, Pause, Volume2, Check, X, Clock, ArrowRight, RotateCcw } from 'lucide-react';

interface Props {
  task: Task;
  mode: 'lesen' | 'hoeren';
  onComplete?: (scorePct: number) => void;
  isMock?: boolean;
}

export default function TaskRunner({ task, mode, onComplete, isMock }: Props) {
  const { t, user } = useStore();
  const [phase, setPhase] = useState<'active' | 'result'>('active');
  const [answers, setAnswers] = useState<Record<number, number | boolean>>({});
  const [timeLeft, setTimeLeft] = useState(task.content.questions ? task.content.questions.length * 60 : 300);
  const [listening, setListening] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const questions = task.content.questions || [];
  const isHoeren = mode === 'hoeren';
  const maxListen = 2;

  useEffect(() => {
    if (phase === 'active' && !isMock) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (utterRef.current) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function speakText() {
    if (!task.content.audio_script) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(task.content.audio_script);
    utter.lang = 'de-DE';
    utter.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find((v) => v.lang.startsWith('de'));
    if (deVoice) utter.voice = deVoice;
    utter.onstart = () => setListening(true);
    utter.onend = () => setListening(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setListenCount((c) => c + 1);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setListening(false);
  }

  function selectAnswer(qIdx: number, val: number | boolean) {
    setAnswers((prev) => ({ ...prev, [qIdx]: val }));
  }

  async function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (utterRef.current) window.speechSynthesis.cancel();
    setSubmitting(true);

    let correct = 0;
    questions.forEach((q, i) => {
      const userAns = answers[i];
      if (q.type === 'true_false') {
        if (userAns === q.answer) correct++;
      } else if (q.type === 'multiple_choice' && typeof userAns === 'number') {
        if (userAns === q.answer) correct++;
      }
    });

    const score = correct;
    const maxScore = questions.length;
    const scorePct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    if (user && !isMock) {
      try {
        await supabase.from('attempts').insert({
          skill: mode,
          level: task.level,
          task_id: task.id,
          score,
          max_score: maxScore,
          duration_seconds: (task.content.questions ? task.content.questions.length * 60 : 300) - timeLeft,
        });
        await supabase.rpc('record_activity', { p_points: score * 5 });
      } catch (err) {
        console.error(err);
      }
    }

    setSubmitting(false);
    setPhase('result');
    onComplete?.(scorePct);
  }

  if (phase === 'result') {
    let correct = 0;
    questions.forEach((q, i) => {
      const userAns = answers[i];
      if (q.type === 'true_false' && userAns === q.answer) correct++;
      else if (q.type === 'multiple_choice' && userAns === q.answer) correct++;
    });
    const pct = Math.round((correct / questions.length) * 100);

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card p-8 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
            pct >= 60 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}>
            <span className="text-3xl font-bold">{pct}%</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{correct} / {questions.length}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('score')}</p>
        </div>

        {questions.map((q, qIdx) => {
          const userAns = answers[qIdx];
          const isCorrect = userAns === q.answer;
          return (
            <div key={qIdx} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                }`}>
                  {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <p className="font-medium text-slate-900 flex-1">{q.question}</p>
              </div>
              <div className="ml-9 space-y-1.5 text-sm">
                {q.type === 'multiple_choice' && q.options?.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`px-3 py-1.5 rounded-lg ${
                      oIdx === q.answer
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : oIdx === userAns
                        ? 'bg-red-50 text-red-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {opt} {oIdx === q.answer && '✓'} {oIdx === userAns && oIdx !== q.answer && '✗'}
                  </div>
                ))}
                {q.type === 'true_false' && (
                  <div className="flex gap-3">
                    <span className={userAns === true ? (q.answer === true ? 'text-emerald-600 font-medium' : 'text-red-600') : 'text-slate-500'}>
                      Richtig {q.answer === true && '✓'}
                    </span>
                    <span className={userAns === false ? (q.answer === false ? 'text-emerald-600 font-medium' : 'text-red-600') : 'text-slate-500'}>
                      Falsch {q.answer === false && '✓'}
                    </span>
                  </div>
                )}
                {q.explanation && (
                  <p className="text-xs text-slate-400 mt-2 italic">{q.explanation}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">{task.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge bg-sky-50 text-sky-600">{task.level}</span>
            {task.exam_type && <span className="badge bg-slate-100 text-slate-600">{task.exam_type}</span>}
            {task.teil_number && <span className="badge bg-slate-100 text-slate-600">Teil {task.teil_number}</span>}
          </div>
        </div>
        {!isMock && (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Hören audio */}
      {isHoeren && task.content.audio_script && (
        <div className="card p-6 bg-sky-50/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Volume2 className="w-5 h-5 text-sky-600" />
              <span className="font-medium">{t('listen')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {t('attemptsLeft')}: {maxListen - listenCount}/{maxListen}
              </span>
              {!listening ? (
                <button
                  onClick={speakText}
                  disabled={listenCount >= maxListen}
                  className="btn-primary"
                >
                  <Play className="w-4 h-4" />
                  {listenCount === 0 ? t('listen') : t('listenAgain')}
                </button>
              ) : (
                <button onClick={stopSpeaking} className="btn-secondary">
                  <Pause className="w-4 h-4" />
                  {t('stop')}
                </button>
              )}
            </div>
          </div>
          {listenCount === 0 && (
            <p className="text-sm text-slate-400 mt-3">
              {t('listen')} (max {maxListen}x)
            </p>
          )}
        </div>
      )}

      {/* Lesen text */}
      {!isHoeren && task.content.text && (
        <div className="card p-6">
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{task.content.text}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <QuestionCard
            key={qIdx}
            q={q}
            qIdx={qIdx}
            selected={answers[qIdx]}
            onSelect={(val) => selectAnswer(qIdx, val)}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || Object.keys(answers).length < questions.length}
        className="btn-primary w-full"
      >
        {submitting ? t('loading') : t('submit')}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function QuestionCard({
  q,
  qIdx,
  selected,
  onSelect,
}: {
  q: Question;
  qIdx: number;
  selected: number | boolean | undefined;
  onSelect: (val: number | boolean) => void;
}) {
  const { t } = useStore();
  return (
    <div className="card p-5">
      <p className="font-medium text-slate-900 mb-3">
        <span className="text-slate-400 mr-2">{qIdx + 1}.</span>
        {q.question}
      </p>
      {q.type === 'multiple_choice' && q.options && (
        <div className="space-y-2">
          {q.options.map((opt, oIdx) => (
            <button
              key={oIdx}
              onClick={() => onSelect(oIdx)}
              className={`w-full text-left px-4 py-2.5 rounded-xl border transition-colors text-sm ${
                selected === oIdx
                  ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {q.type === 'true_false' && (
        <div className="flex gap-3">
          <button
            onClick={() => onSelect(true)}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              selected === true
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            Richtig
          </button>
          <button
            onClick={() => onSelect(false)}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              selected === false
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            Falsch
          </button>
        </div>
      )}
    </div>
  );
}
