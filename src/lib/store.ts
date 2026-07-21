import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from './types';
import { translations, type TranslationKey, type Lang } from './i18n';
import { supabase } from './supabase';

interface AppState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  lang: Lang;
  loading: boolean;
  setSession: (s: Session | null) => void;
  setProfile: (p: Profile | null) => void;
  setLang: (l: Lang) => void;
  setLoading: (b: boolean) => void;
  signOut: () => Promise<void>;
  t: (key: TranslationKey) => string;
}

export const useStore = create<AppState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  lang: (localStorage.getItem('lang') as Lang) || 'uz',
  loading: true,
  setSession: (s) => set({ session: s, user: s?.user ?? null }),
  setProfile: (p) => set({ profile: p }),
  setLang: (l) => {
    localStorage.setItem('lang', l);
    set({ lang: l });
  },
  setLoading: (b) => set({ loading: b }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
  t: (key) => {
    const lang = get().lang;
    return translations[lang][key] || translations.uz[key] || key;
  },
}));
