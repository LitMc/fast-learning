import type { QuizConfig } from './types'
export const quizConfigs: QuizConfig[] = [
  {
    id: 'demo',
    csvPath: '/data/demo.csv',
    promptKey: 'city',
    answerKey: 'prefecture',
    choiceCount: 4,
    promptTemplate: r => `${r.city}はどの都道府県？`
  },
  {
    id: 'phone',
    csvPath: '/data/phone.csv',
    promptKey: 'phoneCode',
    answerKey: 'city',
    choiceCount: 4,
    promptTemplate: r => `市外局番 ${r.phoneCode} はどの市？`
  }
]