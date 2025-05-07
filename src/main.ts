import './styles.css';
import type { Card } from './types';
import { renderCard } from './cardRenderer';

/* ---------- トーストを生成するユーティリティ ---------- */
function showToast(text: string, ok: boolean, ms = 1000): Promise<void> {
  return new Promise((resolve) => {
    const t = document.createElement('div');
    t.className = `toast ${ok ? 'ok' : 'fail'}`;
    t.textContent = text;
    document.body.appendChild(t);

    // 次フレームで .show 追加 → CSS transition 発火
    requestAnimationFrame(() => t.classList.add('show'));

    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => {
        t.remove();
        resolve();
      }, 300);                     // フェードアウト完了を待つ
    }, ms);
  });
}

/* ---------- カード読み込み ---------- */
async function loadCards(): Promise<Card[]> {
  const res = await fetch('/cards/demo.json');
  return res.json();
}

(async () => {
  const cards = await loadCards();
  let idx = 0;

  const next = () => {
    if (idx >= cards.length) idx = 0;
    const card = cards[idx++];

    renderCard(card, async (correct) => {
      await showToast(correct ? '⭕ 正解！' : '❌ 不正解', correct);
      next();                      // トースト完了後に次のカードへ
    });
  };

  next();
})();
