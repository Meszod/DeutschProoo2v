import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry } from '@/lib/types';
import { Trophy, Medal, Crown, Star } from 'lucide-react';

export default function Leaderboard() {
  const { t, user } = useStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('leaderboard_weekly')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50);
      setEntries(data || []);
      setLoading(false);
    })();
  }, []);

  const medals = [Crown, Medal, Medal];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('leaderboard')}</h1>
          <p className="text-sm text-slate-500">{t('weekly')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">{t('noData')}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-1">{t('rank')}</div>
            <div className="col-span-8">{t('user')}</div>
            <div className="col-span-3 text-right">{t('points')}</div>
          </div>
          <div className="divide-y divide-slate-100">
            {entries.map((entry, idx) => {
              const isMe = entry.user_id === user?.id;
              const Icon = idx < 3 ? medals[idx] : null;
              return (
                <div
                  key={entry.user_id}
                  className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center ${
                    isMe ? 'bg-sky-50' : idx < 3 ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {Icon ? (
                      <Icon className={`w-5 h-5 ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                    ) : (
                      <span className="text-sm font-medium text-slate-400">{idx + 1}</span>
                    )}
                  </div>
                  <div className="col-span-8 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold">
                      {(entry.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {entry.full_name || 'Foydalanuvchi'}
                      {isMe && <span className="ml-2 text-xs text-sky-600">(siz)</span>}
                    </span>
                  </div>
                  <div className="col-span-3 text-right flex items-center justify-end gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-bold text-slate-900">{entry.total_points}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
