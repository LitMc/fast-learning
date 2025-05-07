import './styles.css';
import type { Card } from './types';
import { renderCard } from './cardRenderer';

/* ---------- トースト ---------- */
function showToast(text: string, ok: boolean, ms = 1000): void {
  const t = document.createElement('div');
  t.className = `toast ${ok ? 'ok' : 'fail'}`;
  t.textContent = text;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, ms);
}

/* ---------- ユーティリティ ---------- */
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

async function loadCards(): Promise<Card[]> {
  const res = await fetch('/cards/demo.json');
  return shuffle(await res.json());
}

/* ---------- メインループ ---------- */
(async () => {
  const cards = await loadCards();
  let idx = 0;

  const ask = () => {
    // 末尾まで行ったら再シャッフル
    if (idx >= cards.length) {
      idx = 0;
      shuffle(cards);
    }
    const card = cards[idx++];
    renderCard(card, (correct) => {
      showToast(correct ? '⭕ 正解！' : '❌ 不正解', correct);
      ask(); // ★ ここで即 次の問題を描画
    });
  };

  ask();
})();
