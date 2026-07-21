import type { Level, Skill, ExamType } from './types';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const EXAM_TYPES: ExamType[] = ['Goethe', 'telc', 'OSD'];

export const SKILL_META: Record<string, { color: string; bg: string; icon: string }> = {
  lesen: { color: '#0ea5e9', bg: 'bg-sky-50', icon: '📖' },
  hoeren: { color: '#8b5cf6', bg: 'bg-violet-50', icon: '🎧' },
  schreiben: { color: '#f59e0b', bg: 'bg-amber-50', icon: '✍️' },
  sprechen: { color: '#10b981', bg: 'bg-emerald-50', icon: '🗣️' },
};

export const TIME_LIMITS: Record<Level, Record<string, number>> = {
  A1: { lesen: 20, hoeren: 15, schreiben: 20, sprechen: 10 },
  A2: { lesen: 25, hoeren: 20, schreiben: 25, sprechen: 10 },
  B1: { lesen: 40, hoeren: 25, schreiben: 40, sprechen: 15 },
  B2: { lesen: 50, hoeren: 30, schreiben: 50, sprechen: 15 },
  C1: { lesen: 60, hoeren: 35, schreiben: 60, sprechen: 20 },
};

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSkillName(skill: Skill, lang: string): string {
  const names: Record<string, Record<string, string>> = {
    lesen: { uz: 'O\'qish', ru: 'Чтение', en: 'Reading' },
    hoeren: { uz: 'Tinglash', ru: 'Аудирование', en: 'Listening' },
    schreiben: { uz: 'Yozish', ru: 'Письмо', en: 'Writing' },
    sprechen: { uz: 'So\'zlash', ru: 'Говорение', en: 'Speaking' },
  };
  return names[skill]?.[lang] || skill;
}
