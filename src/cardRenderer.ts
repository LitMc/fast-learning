import type { Card, Prompt, Choice } from './types';

const root = document.getElementById('app') as HTMLDivElement;

/* ------------- 描画ヘルパー ------------- */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (HTMLElement | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  children.forEach((c) =>
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
  );
  return node;
}

/* ------------- Prompt ------------- */
function renderPrompt(p: Prompt): HTMLElement {
  if (p.type === 'text') return el('h2', {}, [p.text]);
  if (p.type === 'image')
    return el('img', { src: p.src, width: '200', height: 'auto' });
  return el('p', {}, ['Unsupported prompt']);
}

/* ------------- Choice ------------- */
function renderChoice(
  c: Choice,
  onClick: () => void
): HTMLButtonElement | HTMLElement {
  if (c.type === 'text') {
    const btn = el('button', { class: 'choice' }, [c.text]) as HTMLButtonElement;
    btn.onclick = onClick;
    return btn;
  }
  if (c.type === 'image') {
    const btn = el('button', { class: 'choice img-choice' }) as HTMLButtonElement;
    btn.appendChild(el('img', { src: c.src, width: '120' }));
    btn.onclick = onClick;
    return btn;
  }
  return el('span', {}, ['?']);
}

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

export function renderCard(
  card: Card,
  onAnswered: (ok: boolean) => void
) {
  root.innerHTML = '';

  root.appendChild(renderPrompt(card.prompt));

  const list = el('div', { class: 'choices' });

  /* ★ ここで毎回ランダム並びに */
  const randomized = shuffle(card.choices);

  randomized.forEach((choice) => {
    list.appendChild(
      renderChoice(choice, () => {
        const ok = choice.id === card.answer;
        onAnswered(ok);
      })
    );
  });

  root.appendChild(list);
}