import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Attempt, DailyWord, Task } from '@/lib/types';
import { todayISO, daysUntil, SKILL_META } from '@/lib/helpers';
import Layout from '@/components/Layout';
import {
  Flame, Star, Trophy, Calendar, BookOpen, Headphones, PenLine, Mic,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const SKILL_ICONS: Record<string, typeof BookOpen> = { lesen: BookOpen, hoeren: Headphones, schreiben: PenLine, sprechen: Mic };

export default function Dashboard() {
  const { t, profile, user } = useStore();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [word, setWord] = useState<DailyWord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: att }, { data: w }] = await Promise.all([
        supabase.from('attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('daily_word').select('*').eq('word_date', todayISO()).maybeSingle(),
      ]);
      setAttempts(att || []);
      setWord(w);
      setLoading(false);
    })();
  }, [user]);

  if (!profile) return null;

  const stats = [
    { icon: Flame, value: profile.current_streak, label: t('streak'), gradient: 'from-orange-400 to-red-500', bg: 'bg-orange-50' },
    { icon: Star, value: profile.total_points, label: t('points'), gradient: 'from-sky-400 to-blue-600', bg: 'bg-sky-50' },
    { icon: Trophy, value: profile.longest_streak, label: t('longestStreak'), gradient: 'from-amber-400 to-yellow-600', bg: 'bg-amber-50' },
  ];

  const examDays = profile.exam_date ? daysUntil(profile.exam_date) : null;
  const skillCounts: Record<string, number> = {};
  attempts.forEach((a) => { if (a.skill) skillCounts[a.skill] = (skillCounts[a.skill] || 0) + 1; });
  const pieData = Object.entries(skillCounts).map(([skill, count]) => ({ name: skill, value: count, color: SKILL_META[skill]?.color || '#94a3b8' }));

  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    return { date: d.toLocaleDateString('uz', { weekday: 'short' }), count: attempts.filter((a) => a.created_at.startsWith(ds)).length };
  });

  const skills = ['lesen', 'hoeren', 'schreiben', 'sprechen'] as const;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="font-display text-xl font-bold">{(profile.full_name || '?').charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">{t('welcome')}, {profile.full_name || ''}</h1>
              <p className="text-sm text-slate-500">{t('yourProgress')}</p>
            </div>
          </div>
          {profile && (profile.current_streak ?? 0) > 0 && (
            <div className="badge bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 border border-orange-200/50 px-3 py-1.5">
              <Flame className="w-4 h-4" />{profile.current_streak} {t('streak').toLowerCase()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card card-hover p-5 group relative overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`absolute -top-8 -right-8 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900 relative">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1 relative">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {examDays !== null && (
          <div className="card p-6 relative overflow-hidden animate-slide-up">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-50 rounded-full blur-2xl opacity-60" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{examDays}</p>
                <p className="text-sm text-slate-500">{t('daysUntilExam')} · {profile.target_exam_type || 'Goethe'} · {profile.target_level || '—'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {skills.map((skill, i) => {
            const Icon = SKILL_ICONS[skill];
            const meta = SKILL_META[skill];
            return (
              <Link key={skill} to={`/${skill}`} className="card card-hover p-5 group animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md mb-3 group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}dd)` }}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">{t(skill)}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">{profile.target_level || 'B1'} <ArrowRight className="w-3 h-3" /></p>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {word && (
            <div className="card p-6 group relative overflow-hidden animate-slide-up">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-violet-50 rounded-full blur-2xl opacity-60" />
              <div className="flex items-center gap-2 mb-3 relative">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-semibold text-slate-700">{t('wordOfTheDay')}</span>
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 relative">{word.word}</p>
              <p className="text-slate-500 mt-1 relative">{word.translation}</p>
              {word.example_sentence && <p className="text-sm text-slate-400 mt-2 italic relative">{word.example_sentence}</p>}
            </div>
          )}

          {pieData.length > 0 && (
            <div className="card p-6 animate-slide-up">
              <p className="text-sm font-semibold text-slate-700 mb-3">{t('skillDistribution')}</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /><span className="text-slate-600 capitalize">{d.name}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!loading && attempts.length > 0 && (
          <div className="card p-6 animate-slide-up">
            <p className="text-sm font-semibold text-slate-700 mb-3">{t('recentActivity')}</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  );
}
