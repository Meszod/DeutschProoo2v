import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { VocabCard } from '@/lib/types';
import { todayISO } from '@/lib/helpers';
import Layout from '@/components/Layout';
import { Layers, Plus, Check, X, Calendar, Sparkles, BookOpen, Zap } from 'lucide-react';

const ACCENT = '#8b5cf6';

export default function Vocabulary() {
  const { t, user } = useStore();
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [dueCards, setDueCards] = useState<VocabCard[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newExample, setNewExample] = useState('');
  const [reviewIdx, setReviewIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('vocabulary_cards').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setCards(data || []);
      setDueCards((data || []).filter((c) => c.next_review_date <= todayISO()));
      setLoading(false);
    })();
  }, [user]);

  async function addCard() {
    if (!user || !newWord.trim() || !newTranslation.trim()) return;
    const { data } = await supabase.from('vocabulary_cards').insert({ user_id: user.id, word: newWord.trim(), translation: newTranslation.trim(), example_sentence: newExample.trim() || null }).select().single();
    if (data) {
      setCards([data, ...cards]);
      if (data.next_review_date <= todayISO()) setDueCards([data, ...dueCards]);
    }
    setNewWord(''); setNewTranslation(''); setNewExample(''); setShowAdd(false);
  }

  async function reviewCard(cardId: string, quality: number) {
    await supabase.rpc('review_vocab_card', { p_card_id: cardId, p_quality: quality });
    const next = dueCards.filter((_, i) => i !== reviewIdx);
    setDueCards(next); setFlipped(false);
    if (reviewIdx >= next.length) setReviewIdx(0);
    const { data: updated } = await supabase.from('vocabulary_cards').select('*').eq('id', cardId).maybeSingle();
    if (updated) setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
  }

  const currentCard = dueCards[reviewIdx];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${ACCENT}15`, color: ACCENT, boxShadow: `0 4px 14px ${ACCENT}25` }}>
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">{t('vocabulary')}</h1>
              <p className="text-sm text-slate-500">SM-2 spaced repetition</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary"><Plus className="w-4 h-4" /> {t('addCard')}</button>
        </div>

        {showAdd && (
          <div className="card p-6 space-y-4 animate-slide-up">
            <h3 className="font-semibold text-slate-900">{t('newCard')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">{t('word')}</label><input className="input" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="z.B. der Tisch" /></div>
              <div><label className="label">{t('translation')}</label><input className="input" value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} placeholder="stol" /></div>
            </div>
            <div><label className="label">{t('example')}</label><input className="input" value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="Der Tisch ist aus Holz." /></div>
            <div className="flex gap-2"><button onClick={addCard} className="btn-primary">{t('save')}</button><button onClick={() => setShowAdd(false)} className="btn-secondary">{t('cancel')}</button></div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { value: cards.length, label: t('vocabulary'), icon: BookOpen, gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50' },
            { value: dueCards.length, label: t('dueToday'), icon: Zap, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
            { value: cards.length - dueCards.length, label: t('review'), icon: Check, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card card-hover p-5 text-center group relative overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`absolute -top-8 -right-8 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900 relative">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1 relative">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: ACCENT }} /></div>
        ) : dueCards.length > 0 && currentCard ? (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{reviewIdx + 1} / {dueCards.length}</span>
              <span className="badge bg-amber-50 text-amber-600 border border-amber-100/80">{t('dueToday')}</span>
            </div>
            <div onClick={() => setFlipped(!flipped)} className="card card-hover p-12 min-h-[280px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-200/20 rounded-full blur-3xl animate-glow-pulse" />
              {!flipped ? (
                <div className="text-center relative">
                  <p className="font-display text-3xl font-bold text-slate-900">{currentCard.word}</p>
                  <p className="text-sm text-slate-400 mt-4 group-hover:text-slate-500 transition-colors">{t('flip')}</p>
                </div>
              ) : (
                <div className="text-center animate-bounce-in relative">
                  <p className="font-display text-2xl font-bold" style={{ color: ACCENT }}>{currentCard.translation}</p>
                  {currentCard.example_sentence && <p className="text-sm text-slate-500 mt-4 italic border-l-2 border-violet-200 pl-3 mx-auto inline-block text-left">{currentCard.example_sentence}</p>}
                </div>
              )}
            </div>
            {flipped && (
              <div className="grid grid-cols-2 gap-3 animate-slide-up">
                <button onClick={() => reviewCard(currentCard.id, 2)} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 hover:scale-105"><X className="w-4 h-4" /> {t('didntKnow')}</button>
                <button onClick={() => reviewCard(currentCard.id, 5)} className="btn-secondary border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:scale-105"><Check className="w-4 h-4" /> {t('knew')}</button>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-12 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3"><Sparkles className="w-8 h-8" /></div>
            <p className="text-slate-500">{t('noReviews')}</p>
          </div>
        )}

        {cards.length > 0 && (
          <div className="animate-slide-up">
            <h3 className="font-semibold text-slate-900 mb-3">{t('vocabulary')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.map((card, i) => (
                <div key={card.id} className="card card-hover p-4 group animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-start justify-between">
                    <div><p className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{card.word}</p><p className="text-sm text-slate-500">{card.translation}</p></div>
                    <div className="flex items-center gap-1 text-xs text-slate-400"><Calendar className="w-3 h-3" />{card.next_review_date}</div>
                  </div>
                  {card.example_sentence && <p className="text-xs text-slate-400 mt-2 italic">{card.example_sentence}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
