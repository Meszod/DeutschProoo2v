import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { translate } from './i18n';
import type { Profile, Lang } from './types';

interface StoreState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  lang: Lang;
  t: (key: string) => string;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLang: (lang: Lang) => void;
  signOut: () => Promise<void>;
}

function getInitialLang(): Lang {
  const saved = localStorage.getItem('lang');
  if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved;
  return 'uz';
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  lang: getInitialLang(),
  t: (key: string) => translate(get().lang, key),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLang: (lang) => {
    localStorage.setItem('lang', lang);
    set({ lang });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
