// 出題文
export type Prompt =
  | { type: 'text'; text: string }
  | { type: 'image'; src: string };

// 選択肢
export type Choice =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image'; src: string };

// 出題と回答
export type Card = {
  id: string;
  prompt: Prompt;
  choices: Choice[];
  answer: string;   // choices[].id と対応
  tags: string[];
};

// 回答履歴
export type HistoryEntry = {
  ts:       number;         // Epoch ms
  cardId:   string;
  choiceId: string;
  correct:  boolean;
};

// 正答率
export type Stat = {
  asked:   number;
  correct: number;
};