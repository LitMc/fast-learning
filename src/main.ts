// src/main.ts
import './styles.css';
import type { Card, Stat } from './types';
import { renderCard } from './cardRenderer';
import { loadHistory, saveHistory } from './historyStorage';
import Papa from 'papaparse';
import { quizConfigs } from './quizConfig';

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
const progressBtn = document.getElementById('progress-btn') as HTMLButtonElement;

/* ------------------------------ runtime state ------------------------------ */
let cards: Card[] = [];
let idx = 0;
let running = false;
let history = loadHistory();

/* 学習状況画面を描画 */
async function showProgress() {
  running = false;                 // 出題ループ停止
  root.innerHTML = '';

  // 問題セット選択ドロップダウン
  const sets = ['demo','phone'];
  const select = document.createElement('select');
  sets.forEach(s => {
    const opt = document.createElement('option'); opt.value = s; opt.textContent = s; select.appendChild(opt);
  });
  const label = document.createElement('label'); label.textContent = '問題セット: '; label.appendChild(select);
  root.appendChild(label);

  let cardsData = await loadCards(select.value);
  select.onchange = async () => {
    cardsData = await loadCards(select.value);
    renderStats();
  };

  const table = document.createElement('table');
  table.className = 'stat-table';
  table.innerHTML = `
    <thead><tr>
      <th>問題</th><th>正答</th><th>正答数</th><th>出題数</th><th>正答率</th>
    </tr></thead>
    <tbody></tbody>`;
  const tbody = table.tBodies[0];

  // ソート設定（正答列も含む）
  let sortKey: 'prompt'|'answer'|'correct'|'asked'|'rate' = 'rate';
  let sortOrder: 1|-1 = -1;
  const renderStats = () => {
    tbody.innerHTML = '';
    const stats = buildStats();
    const rows = cardsData.map(c => ({
      card: c,
      stat: stats[c.id] ?? { asked:0,correct:0 }
    }));
    const sorted = rows.sort((a,b) => {
      let diff=0;
      if(sortKey==='prompt') diff = (a.card.prompt.type==='text'?a.card.prompt.text:'').localeCompare(b.card.prompt.type==='text'?b.card.prompt.text:'');
      else if(sortKey==='answer') {
        const ta = (a.card.choices.find(ch => ch.id === a.card.answer) ?? { type:'text', text:'' }).type === 'text'
          ? (a.card.choices.find(ch => ch.id === a.card.answer) as any).text : '';
        const tb = (b.card.choices.find(ch => ch.id === b.card.answer) ?? { type:'text', text:'' }).type === 'text'
          ? (b.card.choices.find(ch => ch.id === b.card.answer) as any).text : '';
        diff = ta.localeCompare(tb);
      }
      else if(sortKey==='correct') diff = a.stat.correct - b.stat.correct;
      else if(sortKey==='asked') diff = a.stat.asked - b.stat.asked;
      else diff = (a.stat.asked? a.stat.correct/a.stat.asked:0) - (b.stat.asked?b.stat.correct/b.stat.asked:0);
      return diff * sortOrder;
    });
    sorted.forEach(({card,stat})=>{
      const rate = stat.asked?((stat.correct/stat.asked)*100).toFixed(0):'0';
      const tr = document.createElement('tr');
      // 正答のテキスト取得
      const correctChoice = card.choices.find(ch => ch.id === card.answer);
      const correctText = correctChoice?.type==='text' ? correctChoice.text : '[画像]';
      tr.innerHTML = `
        <td>${card.prompt.type==='text'?card.prompt.text.slice(0,20):'[画像]'}</td>
        <td>${correctText.slice(0,20)}</td>
        <td>${stat.correct}</td>
        <td>${stat.asked}</td>
        <td>${rate}%</td>`;
      tbody.appendChild(tr);
    });
  };
  // ヘッダークリックでソート
  const headers = table.tHead!.rows[0].cells;
  ['prompt','answer','correct','asked','rate'].forEach((key,i)=>{
    headers[i].style.cursor='pointer';
    headers[i].onclick=()=>{
      if(sortKey===key) sortOrder = sortOrder === 1 ? -1 : 1;
      else { sortKey = key as any; sortOrder = -1; }
      // ヘッダー表示更新
      ['問題','正答','正答数','出題数','正答率'].forEach((txt,j)=>headers[j].textContent=txt);
      headers[i].textContent += sortOrder===-1?' ▼':' ▲';
      renderStats();
    };
  });
  headers[4].textContent += ' ▼';
  root.appendChild(table);
  renderStats();

  /* 戻るボタン */
  const back = document.createElement('button');
  back.textContent = '戻る';
  back.onclick = () => { root.innerHTML=''; running=true; ask(); };
  root.appendChild(back);
}

/* ボタンを結線 */
progressBtn.onclick = showProgress;

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
/**
 * 汎用CSV → Card 生成
 */
const loadCards = async (setName: string): Promise<Card[]> => {
  const cfg = quizConfigs.find(c => c.id === setName);
  if (!cfg) throw new Error(`Unknown quiz config: ${setName}`);
  const raw = await (await fetch(cfg.csvPath)).text();
  const { data } = Papa.parse<Record<string, string>>(raw, { header: true });
  // data may include empty trailing row
  const rows = data.filter(r => Object.values(r).some(v => v));
  return shuffle(
    rows.map(r => {
      const correct = r[cfg.answerKey];
      // 他のレコードからダミー選択肢
      const distractors = shuffle(
        rows.map(x => x[cfg.answerKey]).filter(v => v !== correct)
      ).slice(0, cfg.choiceCount - 1);
      const choices = shuffle([correct!, ...distractors]).map(v => ({ id: v!, type: 'text' as const, text: v! }));
      return {
        id: `${setName}:${r[cfg.promptKey]}`,
        prompt: { type: 'text' as const, text: cfg.promptTemplate(r) },
        choices,
        answer: correct!,
        tags: [setName]
      };
    })
  );
};

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
  progressBtn.hidden = true;

  running = true;
  ask();
};

const stop = () => {
  running = false;
  root.innerHTML = '';

  stopBtn.hidden = true;
  nav.hidden     = false;
  progressBtn.hidden = false;
};

/* ---------------------------- event bindings ------------------------------ */
nav.querySelectorAll<HTMLButtonElement>('button').forEach(btn => {
  btn.onclick = () => start(btn.dataset.set!);
});

stopBtn.onclick = stop;
