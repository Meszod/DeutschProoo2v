import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level } from '@/lib/types';
import { LEVELS, SKILL_META } from '@/lib/helpers';
import Layout from '@/components/Layout';
import { PenLine, ArrowRight, Check } from 'lucide-react';

export default function Schreiben() {
  const { t, profile, user } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(profile?.target_level || 'B1');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const accentColor = SKILL_META.schreiben.color;

  useEffect(() => {
    if (!selectedLevel) return;
    (async () => {
      const { data } = await supabase.from('tasks').select('*').eq('skill', 'schreiben').eq('level', selectedLevel).order('created_at', { ascending: false });
      setTasks(data || []);
    })();
  }, [selectedLevel]);

  async function submit() {
    if (!activeTask || !user) return;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minW = activeTask.content.min_words || 30;
    const pct = Math.min(100, Math.round((words / minW) * 60 + 20));
    setScore(pct); setSubmitted(true);
    await supabase.from('attempts').insert({ user_id: user.id, skill: 'schreiben', level: activeTask.level, task_id: activeTask.id, user_input: text, score: pct, max_score: 100 });
    await supabase.rpc('record_activity', { p_points: Math.round(pct / 10) });
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 animate-slide-down">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${accentColor}15`, color: accentColor, boxShadow: `0 4px 14px ${accentColor}25` }}>
            <PenLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{t('schreiben')}</h1>
            <p className="text-sm text-slate-500">{t('selectLevel')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 animate-slide-down">
          {LEVELS.map((lvl, i) => (
            <button key={lvl} onClick={() => { setSelectedLevel(lvl); setActiveTask(null); setSubmitted(false); setText(''); }}
              style={selectedLevel === lvl ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, animationDelay: `${i * 0.03}s` } : { animationDelay: `${i * 0.03}s` }}
              className={`level-pill animate-slide-down ${selectedLevel === lvl ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{lvl}</button>
          ))}
        </div>

        {activeTask ? (
          <div className="space-y-4 animate-fade-in">
            <button onClick={() => { setActiveTask(null); setSubmitted(false); setText(''); }} className="text-sm text-slate-500 hover:text-slate-700">← {t('back')}</button>
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-4">{activeTask.title}</h2>
              <p className="text-slate-700 leading-relaxed mb-4">{activeTask.content.prompt}</p>
              {activeTask.content.leitpunkte && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">{t('leitpunkte')}:</p>
                  <ul className="space-y-1.5">{activeTask.content.leitpunkte.map((lp, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="font-bold" style={{ color: accentColor }}>•</span>{lp}</li>)}</ul>
                </div>
              )}
            </div>
            {!submitted ? (
              <>
                <textarea className="input min-h-[200px] resize-y leading-relaxed" placeholder={t('writeHere')} value={text} onChange={(e) => setText(e.target.value)} />
                <button onClick={submit} disabled={text.trim().length < 10} className="btn-primary w-full">{t('submit')} <ArrowRight className="w-4 h-4" /></button>
              </>
            ) : (
              <div className="card p-6 text-center animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3"><Check className="w-8 h-8" /></div>
                <p className="text-3xl font-bold text-slate-900">{score}%</p>
                <p className="text-slate-500 mt-1">{t('score')}</p>
                <button onClick={() => { setActiveTask(null); setSubmitted(false); setText(''); }} className="btn-secondary mt-4">{t('back')}</button>
              </div>
            )}
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
