import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { VocabCard } from '@/lib/types';
import { todayISO } from '@/lib/helpers';
import { Layers, Plus, RotateCcw, Check, X, Calendar, BookOpen, Sparkles } from 'lucide-react';

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
      const { data } = await supabase
        .from('vocabulary_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setCards(data || []);
      const due = (data || []).filter((c) => c.next_review_date <= todayISO());
      setDueCards(due);
      setLoading(false);
    })();
  }, [user]);

  async function addCard() {
    if (!user || !newWord.trim() || !newTranslation.trim()) return;
    const { data } = await supabase
      .from('vocabulary_cards')
      .insert({
        user_id: user.id,
        word: newWord.trim(),
        translation: newTranslation.trim(),
        example_sentence: newExample.trim() || null,
      })
      .select()
      .single();
    if (data) {
      setCards([data, ...cards]);
      if (data.next_review_date <= todayISO()) setDueCards([data, ...dueCards]);
    }
    setNewWord('');
    setNewTranslation('');
    setNewExample('');
    setShowAdd(false);
  }

  async function reviewCard(cardId: string, quality: number) {
    await supabase.rpc('review_vocab_card', { p_card_id: cardId, p_quality: quality });
    const next = dueCards.filter((_, i) => i !== reviewIdx);
    setDueCards(next);
    setFlipped(false);
    if (reviewIdx >= next.length) setReviewIdx(0);

    // Refresh card data
    const { data: updated } = await supabase
      .from('vocabulary_cards')
      .select('*')
      .eq('id', cardId)
      .single();
    if (updated) {
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    }
  }

  const currentCard = dueCards[reviewIdx];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{t('vocabulary')}</h1>
            <p className="text-sm text-slate-500">SM-2 spaced repetition</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('addCard')}
        </button>
      </div>

      {showAdd && (
        <div className="card p-6 space-y-4 animate-slide-up">
          <h3 className="font-semibold text-slate-900">{t('newCard')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('word')}</label>
              <input className="input" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="z.B. der Tisch" />
            </div>
            <div>
              <label className="label">{t('translation')}</label>
              <input className="input" value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} placeholder="stol" />
            </div>
          </div>
          <div>
            <label className="label">{t('example')}</label>
            <input className="input" value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="Der Tisch ist aus Holz." />
          </div>
          <div className="flex gap-2">
            <button onClick={addCard} className="btn-primary">{t('save')}</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">{t('cancel')}</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{cards.length}</p>
          <p className="text-xs text-slate-500 mt-1">{t('vocabulary')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{dueCards.length}</p>
          <p className="text-xs text-slate-500 mt-1">{t('dueToday')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{cards.length - dueCards.length}</p>
          <p className="text-xs text-slate-500 mt-1">{t('review')}</p>
        </div>
      </div>

      {/* Review card */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
        </div>
      ) : dueCards.length > 0 && currentCard ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {reviewIdx + 1} / {dueCards.length}
            </span>
            <span className="badge bg-amber-50 text-amber-600">{t('dueToday')}</span>
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            className="card p-12 min-h-[280px] flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all"
          >
            {!flipped ? (
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-slate-900">{currentCard.word}</p>
                <p className="text-sm text-slate-400 mt-4">{t('flip')}</p>
              </div>
            ) : (
              <div className="text-center animate-fade-in">
                <p className="font-display text-2xl font-bold text-sky-600">{currentCard.translation}</p>
                {currentCard.example_sentence && (
                  <p className="text-sm text-slate-500 mt-4 italic border-l-2 border-sky-200 pl-3 mx-auto inline-block text-left">
                    {currentCard.example_sentence}
                  </p>
                )}
              </div>
            )}
          </div>

          {flipped && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <button
                onClick={() => reviewCard(currentCard.id, 2)}
                className="btn-secondary border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                {t('didntKnow')}
              </button>
              <button
                onClick={() => reviewCard(currentCard.id, 5)}
                className="btn-secondary border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Check className="w-4 h-4" />
                {t('knew')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-500">{t('noReviews')}</p>
        </div>
      )}

      {/* All cards list */}
      {cards.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">{t('vocabulary')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((card) => (
              <div key={card.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{card.word}</p>
                    <p className="text-sm text-slate-500">{card.translation}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {card.next_review_date}
                  </div>
                </div>
                {card.example_sentence && (
                  <p className="text-xs text-slate-400 mt-2 italic">{card.example_sentence}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
