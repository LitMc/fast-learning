// src/main.ts
import './styles.css';
import type { Card, Stat } from './types';
import { renderCard } from './cardRenderer';
import { loadHistory, saveHistory } from './historyStorage';

/* ---------------------------------- util ---------------------------------- */
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const showToast = (msg: string, ok: boolean, ms = 800) => {
  const el = document.createElement('div');
  el.className = `toast ${ok ? 'ok' : 'fail'}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, ms);
};

/* --------------------------------- DOM refs -------------------------------- */
const nav     = document.getElementById('nav')      as HTMLElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const root    = document.getElementById('app')      as HTMLDivElement;

/* ------------------------------ runtime state ------------------------------ */
let cards: Card[] = [];
let idx = 0;
let running = false;
let history = loadHistory();

/* ---------------------------- stats (正答率) ----------------------------- */
const buildStats = (): Record<string, Stat> => {
  const stats: Record<string, Stat> = {};
  history.forEach(h => {
    const s = (stats[h.cardId] ??= { asked: 0, correct: 0 });
    s.asked += 1;
    if (h.correct) s.correct += 1;
  });
  return stats;
};

/* ------------------------------ data loading ------------------------------- */
const loadCards = async (setName: string): Promise<Card[]> =>
  shuffle(await (await fetch(`/cards/${setName}.json`)).json());

/* ------------------------------ quiz routine ------------------------------ */
const ask = () => {
  if (!running) return;
  if (idx >= cards.length) {
    idx = 0;
    shuffle(cards);
  }

  const card  = cards[idx++];
  const stats = buildStats();

  renderCard(card, stats[card.id], (correct, choiceId) => {
    // 履歴追加
    history.push({
      ts: Date.now(),
      cardId:   card.id,
      choiceId,
      correct,
    });
    saveHistory(history);

    showToast(correct ? '⭕ 正解！' : '❌ 不正解', correct);
    ask();                          // すぐ次の問題
  });
};

/* -------------------------- start / stop handlers -------------------------- */
const start = async (setName: string) => {
  running = false;                 // 念のため停止
  root.innerHTML = '';
  cards = await loadCards(setName);
  idx   = 0;

  nav.hidden     = true;
  stopBtn.hidden = false;

  running = true;
  ask();
};

const stop = () => {
  running = false;
  root.innerHTML = '';

  stopBtn.hidden = true;
  nav.hidden     = false;
};

/* ---------------------------- event bindings ------------------------------ */
nav.querySelectorAll<HTMLButtonElement>('button').forEach(btn => {
  btn.onclick = () => start(btn.dataset.set!);
});

stopBtn.onclick = stop;
