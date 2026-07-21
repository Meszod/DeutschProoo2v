import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level } from '@/lib/types';
import { LEVELS, SKILL_META } from '@/lib/helpers';
import Layout from '@/components/Layout';
import { Mic, Square, RotateCcw, AlertCircle } from 'lucide-react';

export default function Sprechen() {
  const { t, profile, user } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(profile?.target_level || 'B1');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const accentColor = SKILL_META.sprechen.color;

  useEffect(() => {
    if (!selectedLevel) return;
    (async () => {
      const { data } = await supabase.from('tasks').select('*').eq('skill', 'sprechen').eq('level', selectedLevel).order('created_at', { ascending: false });
      setTasks(data || []);
    })();
  }, [selectedLevel]);

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        if (user && activeTask) {
          const fileName = `${user.id}/${activeTask.id}-${Date.now()}.webm`;
          await supabase.storage.from('audio-recordings').upload(fileName, blob);
          const { data: urlData } = supabase.storage.from('audio-recordings').getPublicUrl(fileName);
          await supabase.from('attempts').insert({ user_id: user.id, skill: 'sprechen', level: activeTask.level, task_id: activeTask.id, audio_url: urlData.publicUrl });
          await supabase.rpc('record_activity', { p_points: 5 });
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch { setError(t('micPermission')); }
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); setRecording(false); }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 animate-slide-down">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${accentColor}15`, color: accentColor, boxShadow: `0 4px 14px ${accentColor}25` }}>
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{t('sprechen')}</h1>
            <p className="text-sm text-slate-500">{t('selectLevel')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 animate-slide-down">
          {LEVELS.map((lvl, i) => (
            <button key={lvl} onClick={() => { setSelectedLevel(lvl); setActiveTask(null); setAudioUrl(null); }}
              style={selectedLevel === lvl ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, animationDelay: `${i * 0.03}s` } : { animationDelay: `${i * 0.03}s` }}
              className={`level-pill animate-slide-down ${selectedLevel === lvl ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{lvl}</button>
          ))}
        </div>

        {error && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

        {activeTask ? (
          <div className="space-y-4 animate-fade-in">
            <button onClick={() => { setActiveTask(null); setAudioUrl(null); }} className="text-sm text-slate-500 hover:text-slate-700">← {t('back')}</button>
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-4">{activeTask.title}</h2>
              <p className="text-slate-700 leading-relaxed mb-4">{activeTask.content.prompt}</p>
              {activeTask.content.leitpunkte && (
                <div><p className="text-sm font-semibold text-slate-700 mb-2">{t('leitpunkte')}:</p>
                  <ul className="space-y-1.5">{activeTask.content.leitpunkte.map((lp, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="font-bold" style={{ color: accentColor }}>•</span>{lp}</li>)}</ul>
                </div>
              )}
            </div>
            <div className="card p-8 text-center">
              {!recording && !audioUrl && (
                <button onClick={startRecording} className="inline-flex flex-col items-center gap-3 group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform"><Mic className="w-8 h-8" /></div>
                  <span className="text-sm font-medium text-slate-600">{t('record')}</span>
                </button>
              )}
              {recording && (
                <button onClick={stopRecording} className="inline-flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse"><Square className="w-8 h-8" /></div>
                  <span className="text-sm font-medium text-red-500">{t('recording')}</span>
                </button>
              )}
              {audioUrl && !recording && (
                <div className="space-y-4">
                  <audio controls src={audioUrl} className="w-full" />
                  <button onClick={() => setAudioUrl(null)} className="btn-secondary"><RotateCcw className="w-4 h-4" /> {t('retake')}</button>
                </div>
              )}
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 animate-scale-in">{t('noTasks')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task, i) => (
              <button key={task.id} onClick={() => setActiveTask(task)} className="card card-hover p-5 text-left group animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-2 mb-2"><span className="badge" style={{ background: `${accentColor}15`, color: accentColor }}>{task.level}</span></div>
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{task.title}</h3>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
