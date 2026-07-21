import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  Flame,
  Star,
  TrendingUp,
  Award,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  Calendar,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import type { Attempt, DailyWord, Achievement } from '@/lib/types';
import { todayISO } from '@/lib/helpers';

const SKILL_COLORS: Record<string, string> = {
  lesen: '#0ea5e9',
  hoeren: '#8b5cf6',
  schreiben: '#f59e0b',
  sprechen: '#10b981',
};

const SKILL_GRADIENTS: Record<string, string> = {
  lesen: 'from-sky-400 to-blue-600',
  hoeren: 'from-violet-400 to-purple-600',
  schreiben: 'from-amber-400 to-orange-600',
  sprechen: 'from-emerald-400 to-teal-600',
};

const BADGE_META: Record<string, { label: string; icon: typeof Award }> = {
  first_90: { label: 'Birinchi 90+ ball', icon: Star },
  streak_7: { label: '7 kunlik streak', icon: Flame },
  streak_30: { label: '30 kunlik streak', icon: Flame },
  schreiben_10: { label: '10 ta Schreiben', icon: PenLine },
  lesen_10: { label: '10 ta Lesen', icon: BookOpen },
  mock_complete: { label: 'Mock imtihon topshirdi', icon: Award },
  vocab_50: { label: '50 ta so\'z', icon: Sparkles },
};

export default function Dashboard() {
  const { t, profile, user } = useStore();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [wordOfDay, setWordOfDay] = useState<DailyWord | null>(null);
  const [badges, setBadges] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [attRes, wordRes, badgeRes] = await Promise.all([
        supabase.from('attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('daily_word').select('*').gte('word_date', todayISO()).order('word_date').limit(1).maybeSingle(),
        supabase.from('achievements').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }),
      ]);
      setAttempts(attRes.data || []);
      setWordOfDay(wordRes.data || null);
      setBadges(badgeRes.data || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const skillCounts: Record<string, number> = {};
  let totalScore = 0;
  let scoredCount = 0;
  const last30 = attempts.slice(0, 30).reverse();
  const progressData = last30.map((a, i) => {
    const pct = a.max_score ? (Number(a.score) / Number(a.max_score)) * 100 : 0;
    return { idx: i + 1, score: Math.round(pct) };
  });

  attempts.forEach((a) => {
    skillCounts[a.skill] = (skillCounts[a.skill] || 0) + 1;
    if (a.score && a.max_score) {
      totalScore += (Number(a.score) / Number(a.max_score)) * 100;
      scoredCount++;
    }
  });

  const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
  const skillPie = Object.entries(skillCounts).map(([name, value]) => ({ name, value }));

  const daysLeft = profile?.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000))
    : null;

  const skillCards = [
    { skill: 'lesen', icon: BookOpen, to: '/lesen' },
    { skill: 'hoeren', icon: Headphones, to: '/hoeren' },
    { skill: 'schreiben', icon: PenLine, to: '/schreiben' },
    { skill: 'sprechen', icon: Mic, to: '/sprechen' },
  ];

  const stats = [
    { icon: Flame, value: profile?.current_streak || 0, label: t('streak'), sub: `${t('longestStreak')}: ${profile?.longest_streak || 0}`, gradient: 'from-orange-400 to-red-500', bg: 'bg-orange-50' },
    { icon: Star, value: profile?.total_points || 0, label: t('points'), sub: 'XP', gradient: 'from-sky-400 to-blue-600', bg: 'bg-sky-50' },
    { icon: TrendingUp, value: `${avgScore}%`, label: t('avgScore'), sub: t('score'), gradient: 'from-emerald-400 to-teal-600', bg: 'bg-emerald-50' },
    { icon: Calendar, value: daysLeft ?? '—', label: t('daysLeft'), sub: profile?.exam_date || '', gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-4 animate-slide-down">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {t('welcome')}, {profile?.full_name || ''}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('tagline')}</p>
        </div>
        {profile && (profile.current_streak ?? 0) > 0 && (
          <div className="badge bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 border border-orange-200/50 px-3 py-1.5">
            <Flame className="w-4 h-4" />
            {profile.current_streak} {t('streak').toLowerCase()}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="card card-hover p-5 animate-slide-up group relative overflow-hidden"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`absolute -top-8 -right-8 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="relative flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-display text-2xl font-bold text-slate-900">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-slate-700 mt-3 relative">{stat.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 relative">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Skill quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {skillCards.map(({ skill, icon: Icon, to }, i) => (
          <Link
            key={skill}
            to={to}
            className="card card-hover p-5 group animate-slide-up relative overflow-hidden"
            style={{ animationDelay: `${0.2 + i * 0.05}s` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${SKILL_GRADIENTS[skill]} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative"
              style={{ background: `${SKILL_COLORS[skill]}15`, color: SKILL_COLORS[skill] }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-900 text-sm relative">{t(skill as any)}</p>
            <p className="text-xs text-slate-400 mt-0.5 relative">{skillCounts[skill] || 0} {t('totalAttempts').toLowerCase()}</p>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 mt-2 transition-all relative" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress chart */}
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-slate-900">{t('progressOverTime')}</h3>
          </div>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={progressData}>
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="idx" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: '#0ea5e9' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">{t('noData')}</div>
          )}
        </div>

        {/* Skill distribution */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-slate-900">{t('skillDistribution')}</h3>
          </div>
          {skillPie.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={skillPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {skillPie.map((entry) => (
                      <Cell key={entry.name} fill={SKILL_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {skillPie.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 group">
                    <div className="w-3 h-3 rounded-full group-hover:scale-125 transition-transform" style={{ background: SKILL_COLORS[s.name] }} />
                    <span className="text-sm text-slate-600 capitalize flex-1">{s.name}</span>
                    <span className="text-sm font-semibold text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">{t('noData')}</div>
          )}
        </div>
      </div>

      {/* Word of day + badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {wordOfDay && (
          <div className="card p-6 bg-gradient-to-br from-brand-50 via-white to-amber-50/30 animate-slide-up relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl animate-glow" />
            <div className="flex items-center gap-2 mb-3 relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{t('wordOfDay')}</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-900 mb-1 relative">{wordOfDay.word}</h3>
            <p className="text-slate-600 mb-2 relative">{wordOfDay.translation}</p>
            {wordOfDay.example_sentence && (
              <p className="text-sm text-slate-500 italic border-l-2 border-brand-200 pl-3 relative">
                {wordOfDay.example_sentence}
              </p>
            )}
          </div>
        )}

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-slate-900">{t('badges')}</h3>
          </div>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {badges.map((b, i) => {
                const meta = BADGE_META[b.badge_code];
                const Icon = meta?.icon || Award;
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white rounded-xl px-3 py-2 border border-slate-200/60 hover:scale-105 hover:shadow-md transition-all animate-bounce-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <Icon className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">{meta?.label || b.badge_code}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">{t('noBadges')}</p>
          )}
        </div>
      </div>

      {/* Exam plan */}
      {daysLeft !== null && profile?.target_level && (
        <div className="card p-6 animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-emerald-500" />
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-slate-900">{t('examDate')}: {profile.exam_date}</h3>
            <div className="ml-auto badge bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-3 py-1">
              {daysLeft} {t('daysLeft')}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {skillCards.map(({ skill, icon: Icon, to }) => (
              <Link key={skill} to={to} className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${SKILL_COLORS[skill]}15` }}>
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: SKILL_COLORS[skill] }} />
                </div>
                <span className="group-hover:translate-x-0.5 transition-transform">{t(skill as any)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
