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
    name: '市外局番 から 都道府県',
    csvPath: '/data/phone.csv',
    promptKey: 'phoneCode',
    answerKey: 'prefecture',
    choiceCount: 4,
    promptTemplate: r => `${r.phoneCode} の都道府県は？`
  },
  {
    id: 'phone-to-region',
    name: '市外局番 から 地域',
    csvPath: '/data/phone.csv',
    promptKey: 'phoneCode',
    answerKey: 'region',
    choiceCount: 4,
    promptTemplate: r => `${r.phoneCode} の地域は？`
  },
  {
    id: 'region-to-pref',
    name: '地域 から 都道府県',
    csvPath: '/data/phone.csv',
    promptKey: 'region',
    answerKey: 'prefecture',
    choiceCount: 4,
    promptTemplate: r => `${r.region} の都道府県は？`
  },
  {
    id: 'pref-to-region',
    name: '都道府県 から 地域',
    csvPath: '/data/phone.csv',
    promptKey: 'prefecture',
    answerKey: 'region',
    choiceCount: 4,
    promptTemplate: r => `${r.prefecture} の地域は？`
  }
]