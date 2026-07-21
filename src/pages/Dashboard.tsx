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
} from 'lucide-react';
import type { Attempt, DailyWord, Achievement } from '@/lib/types';
import { todayISO } from '@/lib/helpers';

const SKILL_COLORS: Record<string, string> = {
  lesen: '#0ea5e9',
  hoeren: '#8b5cf6',
  schreiben: '#f59e0b',
  sprechen: '#10b981',
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
        <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting + streak */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          {t('welcome')}, {profile?.full_name || ''}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('tagline')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{profile?.current_streak || 0}</span>
          </div>
          <p className="text-sm text-slate-500 mt-3">{t('streak')}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('longestStreak')}: {profile?.longest_streak || 0}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{profile?.total_points || 0}</span>
          </div>
          <p className="text-sm text-slate-500 mt-3">{t('points')}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{avgScore}%</span>
          </div>
          <p className="text-sm text-slate-500 mt-3">{t('avgScore')}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{daysLeft ?? '—'}</span>
          </div>
          <p className="text-sm text-slate-500 mt-3">{t('daysLeft')}</p>
        </div>
      </div>

      {/* Skill quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {skillCards.map(({ skill, icon: Icon, to }) => (
          <Link
            key={skill}
            to={to}
            className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${SKILL_COLORS[skill]}15`, color: SKILL_COLORS[skill] }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-900 text-sm">{t(skill as any)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{skillCounts[skill] || 0} {t('totalAttempts').toLowerCase()}</p>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 mt-2 transition-colors" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">{t('progressOverTime')}</h3>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="idx" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">{t('noData')}</div>
          )}
        </div>

        {/* Skill distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">{t('skillDistribution')}</h3>
          {skillPie.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={skillPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                    {skillPie.map((entry) => (
                      <Cell key={entry.name} fill={SKILL_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {skillPie.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: SKILL_COLORS[s.name] }} />
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
          <div className="card p-6 bg-gradient-to-br from-sky-50 to-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-slate-700">{t('wordOfDay')}</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-900 mb-1">{wordOfDay.word}</h3>
            <p className="text-slate-600 mb-2">{wordOfDay.translation}</p>
            {wordOfDay.example_sentence && (
              <p className="text-sm text-slate-500 italic border-l-2 border-sky-200 pl-3">
                {wordOfDay.example_sentence}
              </p>
            )}
          </div>
        )}

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">{t('badges')}</h3>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {badges.map((b) => {
                const meta = BADGE_META[b.badge_code];
                const Icon = meta?.icon || Award;
                return (
                  <div key={b.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
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
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-3">{t('examDate')}: {profile.exam_date}</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="badge bg-emerald-50 text-emerald-700 text-sm px-3 py-1">{daysLeft} {t('daysLeft')}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {skillCards.map(({ skill, icon: Icon, to }) => (
              <Link key={skill} to={to} className="flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
                <Icon className="w-4 h-4" />
                <span>{t(skill as any)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
