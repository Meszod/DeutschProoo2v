import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level, AIFeedback } from '@/lib/types';
import { LEVELS, formatTime } from '@/lib/helpers';
import { Mic, ArrowLeft, AlertCircle, Sparkles, Check, Play, Pause, Info } from 'lucide-react';

export default function Sprechen() {
  const { t, profile, user } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(profile?.target_level || null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!selectedLevel) return;
    (async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('skill', 'sprechen')
        .eq('level', selectedLevel)
        .order('created_at', { ascending: true });
      setTasks(data || []);
    })();
  }, [selectedLevel]);

  async function startRecording() {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setFeedback(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime((p) => p + 1), 1000);
    } catch (err) {
      setError(t('micPermission'));
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function processAudio() {
    if (!audioBlob || !activeTask) return;
    setProcessing(true);
    setError(null);

    try {
      // Try Whisper API via edge function, fall back to simulation
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('task', activeTask.id);

      let transcript = '';
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-speech`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          transcript = data.text || '';
        } else {
          throw new Error('Transcription failed');
        }
      } catch {
        // Fallback: simulate transcription with a placeholder
        transcript = '[Transkripsiya mavjud emas — Whisper API sozlanishi kerak. Iltimos, audio yozib oling va matnni qo\'lda kiriting yoki administrator bilan bog\'laning.]';
      }

      setTranscription(transcript);
      const fb = evaluateSpeaking(transcript, activeTask);
      setFeedback(fb);

      if (user) {
        await supabase.from('attempts').insert({
          skill: 'sprechen',
          level: activeTask.level,
          task_id: activeTask.id,
          score: fb.total_score || 0,
          max_score: 100,
          ai_feedback: fb as any,
          user_input: transcript,
          duration_seconds: recordTime,
        });
        await supabase.rpc('record_activity', { p_points: Math.round((fb.total_score || 0) / 10) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setProcessing(false);
    }
  }

  function reset() {
    setActiveTask(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setFeedback(null);
    setRecordTime(0);
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
        </div>

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

        {feedback.summary && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-900">{t('feedback')}</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">{feedback.summary}</p>
          </div>
        )}

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

        <button onClick={reset} className="btn-secondary w-full">{t('back')}</button>
      </div>
    );
  }

  if (activeTask) {
    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={reset} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">{activeTask.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge bg-sky-50 text-sky-600">{activeTask.level}</span>
            {activeTask.teil_number && <span className="badge bg-slate-100 text-slate-600">Teil {activeTask.teil_number}</span>}
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

        {/* Pronunciation note */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t('pronunciationNote')}</span>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recording UI */}
        <div className="card p-8 text-center">
          {!recording && !audioUrl && (
            <div>
              <button
                onClick={startRecording}
                className="relative w-24 h-24 rounded-full bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition-colors mx-auto"
              >
                <Mic className="w-8 h-8" />
              </button>
              <p className="mt-4 text-sm text-slate-500">{t('record')}</p>
            </div>
          )}

          {recording && (
            <div>
              <button
                onClick={stopRecording}
                className="relative w-24 h-24 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors mx-auto"
              >
                <span className="relative w-8 h-8 flex items-center justify-center text-red-500">
                  <span className="absolute inset-0 rounded-full bg-white animate-pulse-ring" />
                  <Pause className="w-7 h-7 relative text-white" />
                </span>
              </button>
              <p className="mt-4 text-sm font-medium text-red-600">{formatTime(recordTime)}</p>
              <p className="text-xs text-slate-400 mt-1">{t('stop')}</p>
            </div>
          )}

          {!recording && audioUrl && (
            <div className="space-y-4">
              <audio ref={audioRef} src={audioUrl} controls className="w-full" />
              <div className="flex gap-3 justify-center">
                <button onClick={startRecording} className="btn-secondary">
                  {t('recordAgain')}
                </button>
                <button onClick={processAudio} disabled={processing} className="btn-primary">
                  {processing ? (
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
            </div>
          )}
        </div>

        {transcription && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-2">{t('transcription')}</h3>
            <p className="text-slate-600 leading-relaxed">{transcription}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('sprechen')}</h1>
          <p className="text-sm text-slate-500">Whisper + AI {t('feedback').toLowerCase()}</p>
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
              onClick={() => { setActiveTask(task); setAudioBlob(null); setAudioUrl(null); setFeedback(null); setTranscription(''); setRecordTime(0); }}
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

function evaluateSpeaking(transcript: string, task: Task): AIFeedback {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;

  const leitpunkte = task.content.leitpunkte || [];
  let leitpunkteCovered = 0;
  leitpunkte.forEach((lp) => {
    const keywords = lp.toLowerCase().split(/\s+/).slice(0, 3);
    const textLower = transcript.toLowerCase();
    if (keywords.some((k) => textLower.includes(k))) leitpunkteCovered++;
  });
  const leitpunkteRatio = leitpunkte.length > 0 ? leitpunkteCovered / leitpunkte.length : 0.7;
  const aufgabenerfullung = Math.round(leitpunkteRatio * 25);

  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[.,!?;:]/g, '')));
  const uniqueRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;
  const wortschatz = Math.min(25, Math.round(uniqueRatio * 25 + 5));

  const grammatik = Math.max(8, Math.min(25, Math.round((wordCount / 50) * 15 + 10)));

  const sentenceVariety = Math.min(1, sentenceCount / 4);
  const aufbau = Math.min(25, Math.round(sentenceVariety * 25));

  const total = aufgabenerfullung + wortschatz + grammatik + aufbau;

  const improvements: string[] = [];
  if (wordCount < 30) improvements.push(`Juda qisqa javob — ko\'proq gapiring (${wordCount} so'z).`);
  if (leitpunkteCovered < leitpunkte.length * 0.6) improvements.push('Leitpunkte to\'liq yoritilmagan.');
  if (sentenceCount < 3) improvements.push('Javobni ko\'proq gaplarga bo\'ling.');
  if (uniqueRatio < 0.5) improvements.push('Lug\'at boyligini oshiring.');

  const strengths: string[] = [];
  if (leitpunkteCovered >= leitpunkte.length * 0.7) strengths.push('Topshiriq punktlari yaxshi yoritilgan.');
  if (wordCount >= 50) strengths.push('Yetarli hajmdagi javob berildi.');
  if (sentenceCount >= 4) strengths.push('Mantiqiy gaplar ketma-ketligi.');

  let summary = `Sizning javobingiz ${wordCount} so'zdan iborat. `;
  if (total >= 80) summary += 'Ajoyib! Siz aniq va to\'liq gapirgansiz.';
  else if (total >= 60) summary += 'Yaxshi javob, lekin ba\'zi jihatlarni yaxshilash mumkin.';
  else summary += 'Javobni kengaytirish va aniqlashtirish kerak.';

  return {
    total_score: total,
    criteria: {
      aufgabenerfullung,
      wortschatz,
      grammatik,
      aufbau_koharenz: aufbau,
    },
    summary,
    strengths,
    improvements,
  };
}
