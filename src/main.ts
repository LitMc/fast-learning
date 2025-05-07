import './styles.css';
import type { Card } from './types';
import { renderCard } from './cardRenderer';

/* ---------- ユーティリティ ---------- */
const shuffle = <T,>(a: T[]) => [...a].sort(() => 0.5 - Math.random());

/* ---------- トースト ---------- */
function showToast(text: string, ok: boolean, ms = 800) {
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

/* ---------- DOM 取得 ---------- */
const nav     = document.getElementById('nav') as HTMLElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const root    = document.getElementById('app') as HTMLDivElement;

/* ---------- グローバル状態 ---------- */
let cards: Card[] = [];
let idx   = 0;
let running = false;

/* ---------- データ読み込み ---------- */
async function loadCards(name: string): Promise<Card[]> {
  const res = await fetch(`/cards/${name}.json`);
  return shuffle(await res.json());
}

/* ---------- 出題ループ ---------- */
function ask() {
  if (!running) return;                      // 停止フラグ
  if (idx >= cards.length) {
    idx = 0;
    shuffle(cards);
  }
  const card = cards[idx++];
  renderCard(card, (correct) => {
    showToast(correct ? '⭕ 正解！' : '❌ 不正解', correct);
    ask();                                   // 即 次へ
  });
}

/* ---------- 開始 / 停止 ---------- */
async function start(setName: string) {
  running = false;           // 念のため停止
  root.innerHTML = '';       // 画面クリア
  cards = await loadCards(setName);
  idx = 0;
  nav.hidden = true;          // 左側メニューを隠す
  stopBtn.hidden = false;     // 右側「やめる」を表示
  running = true;
  ask();
}

function stop() {
  running = false;
  root.innerHTML = '';
  stopBtn.hidden = true;      // 右側を隠す
  nav.hidden = false;         // 左側メニューを戻す
}

/* ---------- ボタンのイベント ---------- */
// セット選択
nav.querySelectorAll<HTMLButtonElement>('button').forEach((btn) => {
  btn.onclick = () => start(btn.dataset.set!);
});
// やめる
stopBtn.onclick = stop;
