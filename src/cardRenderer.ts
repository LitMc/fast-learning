// src/cardRenderer.ts
import type { Card, Prompt, Choice, Stat } from './types';

/* ------------------------------ basic helpers ----------------------------- */
const root = document.getElementById('app') as HTMLDivElement;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (HTMLElement | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  children.forEach(c =>
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
  );
  return node;
}

/* ----------------------------- prompt render ----------------------------- */
function renderPrompt(p: Prompt): HTMLElement {
  if (p.type === 'text')  return el('h2', {}, [p.text]);
  if (p.type === 'image') return el('img', { src: p.src, width: '200' });
  return el('p', {}, ['Unsupported prompt']);
}

/* ---------------------------- choice render ------------------------------ */
function renderChoice(
  c: Choice,
  onClick: () => void
): HTMLButtonElement {
  const btn = el('button', { class: 'choice', 'data-id': c.id }) as HTMLButtonElement;

  if (c.type === 'text') {
    btn.textContent = c.text;
  } else {
    btn.classList.add('img-choice');
    btn.appendChild(el('img', { src: c.src, width: '120' }));
  }
  btn.onclick = onClick;
  return btn;
}

/* ----------------------------- public API -------------------------------- */
export function renderCard(
  card: Card,
  stat: Stat | undefined,
  onAnswered: (correct: boolean, choiceId: string) => void
) {
  root.innerHTML = '';

  // 正答率パネル（あれば）
  if (stat) {
    const rate = ((stat.correct / stat.asked) * 100).toFixed(0);
    root.appendChild(
      el('p', { class: 'stat' }, [`正答 ${stat.correct}/${stat.asked} (${rate}%)`])
    );
  } else {
    root.appendChild(
      el('p', { class: 'stat' }, ['正答 0/0 (0%)'])
    );
  }

  // 本文
  root.appendChild(renderPrompt(card.prompt));

  // 選択肢グリッド
  const container = el('div', { class: 'choices' });
  // 並び順ランダム
  const shuffled = [...card.choices].sort(() => Math.random() - 0.5);

  shuffled.forEach(choice =>
    container.appendChild(
      renderChoice(choice, () => {
        const ok = choice.id === card.answer;
        onAnswered(ok, choice.id);
      })
    )
  );
  root.appendChild(container);
}
