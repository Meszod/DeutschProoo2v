import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Attempt } from '@/lib/types';
import { Check, X, ArrowRight, Clock, Mic, Square, Play, RotateCcw, AlertCircle } from 'lucide-react';
import { formatTime } from '@/lib/helpers';

interface Props {
  task: Task;
  mode: 'lesen' | 'hoeren';
  isMock?: boolean;
  onComplete?: (scorePct: number) => void;
}

export default function TaskRunner({ task, mode, isMock, onComplete }: Props) {
  const { t, user } = useStore();
  const [answers, setAnswers] = useState<Record<number, number | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = task.content.questions || [];
  const maxScore = questions.length || 1;

  useEffect(() => {
    const limit = isMock ? 300 : 180;
    setTimeLeft(limit);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setAnswer(idx: number, val: number | boolean) {
    setAnswers((prev) => ({ ...prev, [idx]: val }));
  }

  async function handleSubmit() {
    if (submitted) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] !== undefined && answers[i] === q.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    const scorePct = Math.round((correct / maxScore) * 100);
    if (user && !isMock) {
      const attempt: Partial<Attempt> = {
        user_id: user.id,
        skill: task.skill,
        level: task.level,
        task_id: task.id,
        score: correct,
        max_score: maxScore,
      };
      await supabase.from('attempts').insert(attempt);
      await supabase.rpc('record_activity', { p_points: correct * 2 });
    }
    setShowFeedback(true);
    setSubmitting(false);
    onComplete?.(scorePct);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        if (user && !isMock) {
          const fileName = `${user.id}/${task.id}-${Date.now()}.webm`;
          await supabase.storage.from('audio-recordings').upload(fileName, blob);
          const { data: urlData } = supabase.storage.from('audio-recordings').getPublicUrl(fileName);
          const { data: transcriptData } = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-speech`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ audioUrl: urlData.publicUrl }),
          }).then((r) => r.json()).catch(() => ({ data: null }));
          await supabase.from('attempts').insert({
            user_id: user.id, skill: task.skill, level: task.level, task_id: task.id,
            audio_url: urlData.publicUrl, ai_feedback: transcriptData,
          });
          await supabase.rpc('record_activity', { p_points: 5 });
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      alert(t('micPermission'));
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  if (mode === 'lesen' || mode === 'hoeren') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="badge bg-slate-100 text-slate-600">{task.level}</span>
            {task.teil_number && <span className="text-xs text-slate-400">Teil {task.teil_number}</span>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className={`font-mono font-semibold ${timeLeft < 30 ? 'text-red-500' : 'text-slate-600'}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-4">{task.title}</h2>
          {mode === 'lesen' && task.content.text && (
            <div className="prose prose-slate max-w-none mb-6">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{task.content.text}</p>
            </div>
          )}
          {mode === 'hoeren' && task.content.audio_script && (
            <div className="mb-6 p-4 rounded-xl bg-violet-50 border border-violet-100">
              <p className="text-sm text-violet-600 font-medium mb-2">Audio skript (mock):</p>
              <p className="text-slate-700 leading-relaxed">{task.content.audio_script}</p>
            </div>
          )}

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4">
                <p className="font-medium text-slate-900 mb-3">{i + 1}. {q.question}</p>
                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, j) => {
                      let style = 'border-slate-200 hover:border-slate-300 text-slate-700';
                      if (submitted) {
                        if (j === q.answer) style = 'border-emerald-500 bg-emerald-50 text-emerald-700';
                        else if (answers[i] === j) style = 'border-red-500 bg-red-50 text-red-600';
                        else style = 'border-slate-200 text-slate-400';
                      } else if (answers[i] === j) {
                        style = 'border-brand-500 bg-brand-50 text-brand-700';
                      }
                      return (
                        <button key={j} disabled={submitted} onClick={() => setAnswer(i, j)} className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm font-medium ${style}`}>
                          <span className="flex items-center justify-between">{opt}{submitted && j === q.answer && <Check className="w-4 h-4" />}{submitted && answers[i] === j && j !== q.answer && <X className="w-4 h-4" />}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {q.type === 'true_false' && (
                  <div className="flex gap-2">
                    {[true, false].map((val) => {
                      let style = 'border-slate-200 text-slate-700';
                      if (submitted) {
                        if (val === q.answer) style = 'border-emerald-500 bg-emerald-50 text-emerald-700';
                        else if (answers[i] === val) style = 'border-red-500 bg-red-50 text-red-600';
                      } else if (answers[i] === val) style = 'border-brand-500 bg-brand-50 text-brand-700';
                      return (
                        <button key={String(val)} disabled={submitted} onClick={() => setAnswer(i, val)} className={`flex-1 px-4 py-2.5 rounded-lg border transition-all text-sm font-medium ${style}`}>
                          {val ? 'Richtig' : 'Falsch'}
                        </button>
                      );
                    })}
                  </div>
                )}
                {submitted && <p className="text-xs text-slate-500 mt-2 italic">{q.explanation}</p>}
              </div>
            ))}
          </div>
        </div>

        {!submitted ? (
          <button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length < questions.length} className="btn-primary w-full">
            {t('submit')} <ArrowRight className="w-4 h-4" />
          </button>
        ) : showFeedback && (
          <div className="card p-6 text-center animate-scale-in">
            <p className="text-3xl font-bold text-slate-900">{score} / {maxScore}</p>
            <p className="text-slate-500 mt-1">{t('score')}</p>
          </div>
        )}
      </div>
    );
  }

  // Sprechen mode (audio recording)
  return (
    <div className="space-y-5">
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-4">{task.title}</h2>
        <p className="text-slate-700 leading-relaxed mb-4">{task.content.prompt}</p>
        {task.content.leitpunkte && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-700 mb-2">{t('leitpunkte')}:</p>
            <ul className="space-y-1.5">
              {task.content.leitpunkte.map((lp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="font-bold text-brand-500">•</span>{lp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-8 text-center">
        {!recording && !audioUrl && (
          <button onClick={startRecording} className="inline-flex flex-col items-center gap-3 group">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
              <Mic className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium text-slate-600">{t('record')}</span>
          </button>
        )}
        {recording && (
          <button onClick={stopRecording} className="inline-flex flex-col items-center gap-3 group">
            <div className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
              <Square className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium text-red-500">{t('recording')}</span>
          </button>
        )}
        {audioUrl && !recording && (
          <div className="space-y-4">
            <audio controls src={audioUrl} className="w-full" />
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setAudioUrl(null); }} className="btn-secondary"><RotateCcw className="w-4 h-4" /> {t('retake')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
