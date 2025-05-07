export type Prompt =
  | { type: 'text'; text: string }
  | { type: 'image'; src: string };

export type Choice =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image'; src: string };

export type Card = {
  id: string;
  prompt: Prompt;
  choices: Choice[];
  answer: string;   // choices[].id と対応
  tags: string[];
};
