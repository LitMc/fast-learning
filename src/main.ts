// src/main.ts
import './styles.css';
import type { Card, Stat } from './types';
import { renderCard } from './cardRenderer';
import { loadHistory, saveHistory } from './historyStorage';
import Papa from 'papaparse';
import { quizConfigs } from './quizConfig';

/* ---------------------------------- util ---------------------------------- */
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

/* --------------------------------- DOM refs -------------------------------- */
const nav     = document.getElementById('nav')      as HTMLElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const root    = document.getElementById('app')      as HTMLDivElement;
const progressBtn = document.getElementById('progress-btn') as HTMLButtonElement;
const themeToggleBtn = document.getElementById('theme-toggle-btn') as HTMLButtonElement;

/* Render the main menu dynamically */
const renderMainMenu = () => {
  root.innerHTML = ''; // Clear the main content area

  const list = document.createElement('div');
  list.className = 'main-menu'; // Add a class for styling

  quizConfigs.forEach(cfg => {
    const btn = document.createElement('button');
    btn.textContent = cfg.name;
    btn.onclick = () => start(cfg.id);
    list.appendChild(btn);
  });

  root.appendChild(list);
};

// Render the main menu initially
renderMainMenu();

/* ------------------------------ runtime state ------------------------------ */
let cards: Card[] = [];
let idx = 0;
let running = false;
let history = loadHistory();

/* 学習状況画面を描画 */
async function showProgress() {
  running = false;                 // 出題ループ停止
  root.innerHTML = '';

  /* 戻るボタンを最初に描画 */
  stopBtn.hidden = false;

  // 問題セット選択ドロップダウン
  const select = document.createElement('select');
  quizConfigs.forEach(cfg => {
    const opt = document.createElement('option');
    opt.value = cfg.id; // idは内部的に使用
    opt.textContent = cfg.name; // 表示名を使用
    select.appendChild(opt);
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
  const rows = data.filter(r => Object.values(r).some(v => v));

  // ユニーク化処理
  const uniqueMap = new Map<string, Record<string, string>>();
  rows.forEach(row => {
    const key = `${row[cfg.promptKey]}|${row[cfg.answerKey]}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, row);
    }
  });
  const uniqueRows = Array.from(uniqueMap.values());

  return shuffle(
    uniqueRows.map(r => {
      const correct = r[cfg.answerKey];
      const prompt = r[cfg.promptKey];

      // 他のレコードからダミー選択肢を取得し、promptKeyとanswerKeyが正解と異なり、answerKeyが重複しないものを選択
      const distractors = shuffle(
        uniqueRows.filter(x => x[cfg.promptKey] !== r[cfg.promptKey] && x[cfg.answerKey] !== correct)
          .map(x => x[cfg.answerKey])
      ).filter((v, i, self) => self.indexOf(v) === i) // answerKeyの重複を除外
      .slice(0, cfg.choiceCount - 1);

      const choices = shuffle([correct!, ...distractors]).map(v => {
        const choiceRow = uniqueRows.find(x => x[cfg.answerKey] === v);
        return {
          id: v!,
          type: 'text' as const,
          text: cfg.choiceTemplate(choiceRow!) // カスタム選択肢表示
        };
      });
      return {
        id: `${setName}:${prompt}:${correct}`, // Update card ID generation to include both prompt and answer
        prompt: { type: 'text' as const, text: cfg.promptTemplate(r) },
        choices,
        answer: correct!,
        tags: [setName]
      };
    })
  );
};

/* ------------------------------ quiz routine ------------------------------ */
const N = 3; // Number of consecutive correct answers to exclude a question

const updateQuestionCountDisplay = () => {
  const totalQuestions = cards.length;
  const remainingQuestions = cards.filter(card => {
    const cardHistory = history.filter(h => h.cardId === card.id);
    const recentHistory = cardHistory.slice(-N);
    return recentHistory.length < N || recentHistory.some(h => !h.correct);
  }).length;

  const countDisplay = document.getElementById('question-count');
  if (countDisplay) {
    countDisplay.textContent = `残り ${remainingQuestions} 問 / 全 ${totalQuestions} 問`;
  }
};

const ask = () => {
  if (!running) return;

  updateQuestionCountDisplay(); // Update the question count display

  // Build stats for prioritization
  const stats = buildStats();

  // Filter out cards with N consecutive correct answers
  const filteredCards = cards.filter(card => {
    const cardHistory = history.filter(h => h.cardId === card.id);
    const recentHistory = cardHistory.slice(-N); // Get the last N attempts

    // Exclude if there are at least N attempts and all are correct
    return recentHistory.length < N || recentHistory.some(h => !h.correct);
  });

  if (filteredCards.length === 0) {
    // No cards left to ask, show completion message
    root.innerHTML = '<h1>コンプリートです！</h1>';
    stopBtn.hidden = false;
    return;
  }

  // Prioritize cards based on the existing logic
  const prioritizedCards = shuffle(filteredCards).sort((a, b) => {
    const statA = stats[a.id] || { asked: 0, correct: 0 };
    const statB = stats[b.id] || { asked: 0, correct: 0 };

    // Unattempted cards (asked === 0) come first
    if (statA.asked === 0 && statB.asked > 0) return -1;
    if (statA.asked > 0 && statB.asked === 0) return 1;

    // Incorrectly answered cards (correct < asked) come next
    const incorrectRateA = statA.asked > 0 ? (statA.asked - statA.correct) / statA.asked : 1;
    const incorrectRateB = statB.asked > 0 ? (statB.asked - statB.correct) / statB.asked : 1;
    if (incorrectRateA !== incorrectRateB) return incorrectRateB - incorrectRateA;

    // Correctly answered cards (correct === asked) are deprioritized
    const correctRateA = statA.asked > 0 ? statA.correct / statA.asked : 0;
    const correctRateB = statB.asked > 0 ? statB.correct / statB.asked : 0;
    return correctRateA - correctRateB;
  });

  // Select the next card to ask
  const card = prioritizedCards[idx++ % prioritizedCards.length];

  renderCard(card, stats[card.id], (correct, choiceId) => {
    // Update history
    history.push({
      ts: Date.now(),
      cardId: card.id,
      choiceId,
      correct,
    });
    saveHistory(history);

    // Highlight correct/incorrect choices
    const selectedChoice = document.querySelector(`.choice[data-id="${choiceId}"]`);
    const correctChoice = document.querySelector(`.choice[data-id="${card.answer}"]`);

    if (correct) {
      selectedChoice?.classList.add('highlight-correct');
    } else {
      selectedChoice?.classList.add('highlight-incorrect');
      correctChoice?.classList.add('highlight-correct');
    }

    // Proceed to the next question on button click
    document.querySelectorAll<HTMLButtonElement>('.choice').forEach(button => {
      button.onclick = () => {
        ask();
      };
    });
  });
};

/* -------------------------- start / stop handlers -------------------------- */
const start = async (setName: string) => {
  running = false;                 // 念のため停止
  root.innerHTML = '';

  const countDisplay = document.createElement('div');
  countDisplay.id = 'question-count';
  countDisplay.style.marginBottom = '1rem';
  root.appendChild(countDisplay);

  cards = await loadCards(setName);
  idx   = 0;

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

  const countDisplay = document.getElementById('question-count');
  if (countDisplay) {
    countDisplay.textContent = ''; // Clear the question count display
  }

  renderMainMenu(); // Re-render the main menu when stopping the quiz
};

/* ---------------------------- event bindings ------------------------------ */
nav.querySelectorAll<HTMLButtonElement>('button').forEach(btn => {
  const cfg = quizConfigs.find(c => c.id === btn.dataset.set);
  if (cfg) {
    btn.textContent = cfg.name; // 表示名を設定
    btn.onclick = () => start(cfg.id);
  }
});

stopBtn.onclick = stop;

// Load theme from localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggleBtn.textContent = 'ライトモード';
}

// ダークモード切り替え機能
const toggleTheme = () => {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  themeToggleBtn.textContent = isDarkMode ? 'ライトモード' : 'ダークモード';
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
};

themeToggleBtn.onclick = toggleTheme;
