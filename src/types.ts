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

export type QuizConfig = {
  /** 問題セットの識別子 */
  id: string;
  /** 問題セットの表示名 */
  name: string;
  /** CSVファイルのパス */
  csvPath: string;
  /** CSVレコードから問いを作るカラム名 */
  promptKey: string;
  /** CSVレコードから答えを取るカラム名 */
  answerKey: string;
  /** 選択肢数 */
  choiceCount: number;
  /** プロンプト文字列を生成する関数 */
  promptTemplate: (row: Record<string, string>) => string;
  /** 選択肢文字列を生成する関数 */
  choiceTemplate: (row: Record<string, string>) => string;
};
