import type { QuizConfig } from './types'
export const quizConfigs: QuizConfig[] = [
  {
    id: 'demo',
    name: 'デモ問題',
    csvPath: '/data/demo.csv',
    promptKey: 'city',
    answerKey: 'prefecture',
    choiceCount: 4,
    promptTemplate: r => `${r.city}はどの都道府県？`
  },
  {
    id: 'phone',
    name: '市外局番 -> 都道府県',
    csvPath: '/data/phone.csv',
    promptKey: 'phoneCode',
    answerKey: 'prefecture',
    choiceCount: 4,
    promptTemplate: r => `市外局番 ${r.phoneCode} はどの県？`
  }
]