import type { HistoryEntry } from './types';

export const LS_KEY = 'memorizer-history-v1';

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveHistory(h: HistoryEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(h));
}