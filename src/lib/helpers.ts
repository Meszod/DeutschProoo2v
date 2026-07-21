import type { Level } from './types';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const EXAM_TYPES = ['Goethe', 'telc', 'OSD'] as const;

export const SKILL_NAMES = ['lesen', 'hoeren', 'schreiben', 'sprechen'] as const;

export const TIME_LIMITS: Record<Level, Record<string, number>> = {
  A1: { lesen: 20, hoeren: 15, schreiben: 20, sprechen: 10 },
  A2: { lesen: 30, hoeren: 20, schreiben: 30, sprechen: 10 },
  B1: { lesen: 65, hoeren: 40, schreiben: 60, sprechen: 15 },
  B2: { lesen: 80, hoeren: 40, schreiben: 60, sprechen: 15 },
  C1: { lesen: 80, hoeren: 40, schreiben: 70, sprechen: 20 },
};

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
