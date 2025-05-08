import type { QuizConfig } from './types'
export const quizConfigs: QuizConfig[] = [
  {
    id: 'phone',
    name: '市外局番 から 都道府県',
    csvPath: '/data/phone.csv',
    promptKey: 'phoneCode',
    answerKey: 'prefecture',
    choiceCount: 4,
    promptTemplate: r => `市外局番 ${r.phoneCode} はどの県？`,
    choiceTemplate: r => r.prefecture
  },
  {
    id: 'phone-to-region',
    name: '市外局番 から 地域',
    csvPath: '/data/phone.csv',
    promptKey: 'phoneCode',
    answerKey: 'region',
    choiceCount: 4,
    promptTemplate: r => `${r.phoneCode} の地域は？`,
    choiceTemplate: r => `${r.region}（${r.yomigana}）`
  },
  {
    id: 'region-to-phone',
    name: '地域 から 市外局番',
    csvPath: '/data/phone.csv',
    promptKey: 'region',
    answerKey: 'phoneCode',
    choiceCount: 4,
    promptTemplate: r => `${r.region}（${r.yomigana}） の市外局番は？`,
    choiceTemplate: r => `${r.phoneCode}`
  },
  {
    id: 'region-to-pref',
    name: '地域 から 都道府県',
    csvPath: '/data/phone.csv',
    promptKey: 'region',
    answerKey: 'prefecture',
    choiceCount: 4,
    promptTemplate: r => `${r.region}（${r.yomigana}） の都道府県は？`,
    choiceTemplate: r => r.prefecture // デフォルトの選択肢表示
  },
  {
    id: 'pref-to-region',
    name: '都道府県 から 地域',
    csvPath: '/data/phone.csv',
    promptKey: 'prefecture',
    answerKey: 'region',
    choiceCount: 4,
    promptTemplate: r => `${r.prefecture} の地域は？`,
    choiceTemplate: r => `${r.region}（${r.yomigana}）`
  },
  {
    id: 'prefecture-to-phone',
    name: '都道府県 から 市外局番',
    csvPath: '/data/phone.csv',
    promptKey: 'prefecture',
    answerKey: 'phoneCode',
    choiceCount: 4,
    promptTemplate: r => `${r.prefecture}の市外局番は？`,
    choiceTemplate: r => `${r.phoneCode}`
  }
]