import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry } from '@/lib/types';
import { Trophy, Medal, Crown, Star } from 'lucide-react';

const ACCENT = '#f59e0b';

export default function Leaderboard() {
  const { t, user } = useStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('leaderboard_weekly').select('*').order('total_points', { ascending: false }).limit(50);
      setEntries(data || []);
      setLoading(false);
    })();
  }, []);

  const medals = [Crown, Medal, Medal];
  const medalColors = ['#fbbf24', '#94a3b8', '#b45309'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 animate-slide-down">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${ACCENT}15`, color: ACCENT, boxShadow: `0 4px 14px ${ACCENT}25` }}>
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('leaderboard')}</h1>
          <p className="text-sm text-slate-500">{t('weekly')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-slate-200 border-t-amber-600 rounded-full animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 animate-scale-in">{t('noData')}</div>
      ) : (
        <>
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-2">
              {[1, 0, 2].map((displayIdx) => {
                const entry = entries[displayIdx];
                const Icon = medals[displayIdx];
                const isMe = entry.user_id === user?.id;
                const heights = ['h-28', 'h-36', 'h-24'];
                const scales = ['scale-95', 'scale-105', 'scale-90'];
                return (
                  <div key={entry.user_id} className={`flex flex-col items-center justify-end ${scales[displayIdx]} animate-bounce-in`} style={{ animationDelay: `${displayIdx * 0.1}s` }}>
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 flex items-center justify-center text-lg font-bold shadow-md">
                        {(entry.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md" style={{ background: medalColors[displayIdx] }}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-2 truncate max-w-full px-1">{entry.full_name || '—'}{isMe && ' (siz)'}</p>
                    <div className={`${heights[displayIdx]} w-full rounded-t-2xl mt-2 flex items-center justify-center text-white font-bold text-xl shadow-md`} style={{ background: `linear-gradient(135deg, ${medalColors[displayIdx]}, ${medalColors[displayIdx]}dd)` }}>
                      {entry.total_points}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="card overflow-hidden animate-slide-up">
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
                  <div key={entry.user_id} className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-colors hover:bg-slate-50/50 ${isMe ? 'bg-amber-50/50' : idx < 3 ? 'bg-amber-50/20' : ''}`}>
                    <div className="col-span-1 flex items-center">
                      {Icon ? <Icon className="w-5 h-5" style={{ color: medalColors[idx] }} /> : <span className="text-sm font-medium text-slate-400">{idx + 1}</span>}
                    </div>
                    <div className="col-span-8 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold">{(entry.full_name || '?').charAt(0).toUpperCase()}</div>
                      <span className="text-sm font-medium text-slate-900">{entry.full_name || 'Foydalanuvchi'}{isMe && <span className="ml-2 text-xs text-amber-600">(siz)</span>}</span>
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
        </>
      )}
    </div>
  );
}
