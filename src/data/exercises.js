// ===== Core Exercise Types =====
// Each type defines a unique exercise with config for rendering

export const EXERCISE_TYPES = {
  // ===== P0 题型 =====
  TRANSLATION_CHOICE: 'translation_choice',     // 选择翻译（英→中 / 中→英）
  FILL_BLANK: 'fill_blank',                     // 填空补全
  WORD_BANK: 'word_bank',                       // 拼写构建（拖拽单词块拼句子）
  LISTENING_CHOICE: 'listening_choice',         // 听音选择
  IMAGE_MATCH: 'image_match',                   // 图片配对

  // ===== P1 题型 =====
  MATCH_PAIRS: 'match_pairs',                   // 连线匹配
  READING_COMP: 'reading_comp',                 // 阅读理解
  LETTER_SCRAMBLE: 'letter_scramble',           // 字母拼词
  TRUE_FALSE: 'true_false',                     // 判断对错

  // ===== P2 题型 =====
  SENTENCE_TRANSFORM: 'sentence_transform',     // 句型变换
  TRANSLATION_TYPE: 'translation_type',         // 填空翻译（手动输入）
  SPEAKING: 'speaking',                         // 口语跟读
}

// ===== Exercise Generator =====
// Generates exercises from words for a given module

import { allWords, getWordsByModule, getWrongOptions } from '../data/words'
import { moduleContent } from '../data/content'

const { shuffle } = Array

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pick random items from array
function pickRandom(arr, n) {
  return shuffleArray(arr).slice(0, n)
}

// ---- Generators ----

function genTranslationChoiceEnToCn(words) {
  const word = pickRandom(words, 1)[0]
  const wrongs = getWrongOptions(word, 3).map(w => w.meaning)
  const options = shuffleArray([word.meaning, ...wrongs])
  return {
    type: EXERCISE_TYPES.TRANSLATION_CHOICE,
    wordId: word.id,
    module: word.module,
    prompt: word.word,
    promptPhonetic: word.phonetic,
    promptEmoji: getEmojiForWord(word.word),
    correctAnswer: word.meaning,
    options,
    direction: 'en2cn',
    hint: word.funnyTip,
  }
}

function genTranslationChoiceCnToEn(words) {
  const word = pickRandom(words, 1)[0]
  const wrongs = getWrongOptions(word, 3).map(w => w.word)
  const options = shuffleArray([word.word, ...wrongs])
  return {
    type: EXERCISE_TYPES.TRANSLATION_CHOICE,
    wordId: word.id,
    module: word.module,
    prompt: word.meaning,
    promptEmoji: getEmojiForWord(word.word),
    correctAnswer: word.word,
    options,
    direction: 'cn2en',
    hint: word.funnyTip,
  }
}

function genFillBlank(words) {
  const word = pickRandom(words, 1)[0]
  // Build a sentence with a blank
  const sentenceTemplates = getFillBlankTemplates(word)
  const template = pickRandom(sentenceTemplates, 1)[0]
  const wrongs = getWrongOptions(word, 3).map(w => w.word)
  const options = shuffleArray([word.word, ...wrongs])
  return {
    type: EXERCISE_TYPES.FILL_BLANK,
    wordId: word.id,
    module: word.module,
    sentence: template.sentence,
    blankWord: template.blankWord || word.word,
    correctAnswer: word.word,
    options,
    hint: word.meaning,
  }
}

function genWordBank(words) {
  const word = pickRandom(words, 1)[0]
  const sentence = word.example || `I want to be a ${word.word}.`
  const correctWords = sentence.split(/\s+/).filter(w => w.match(/[a-zA-Z]/))
  // Add some distractor words
  const distractorPool = allWords.filter(w => w.module === word.module && w.word !== word.word)
  const distractors = pickRandom(distractorPool, Math.max(2, 6 - correctWords.length)).map(w => w.word)
  const allTokens = shuffleArray([...correctWords, ...distractors])
  return {
    type: EXERCISE_TYPES.WORD_BANK,
    wordId: word.id,
    module: word.module,
    prompt: word.meaning,
    correctAnswer: correctWords.join(' '),
    correctWords,
    wordBank: allTokens,
    hint: word.funnyTip,
  }
}

function genListeningChoice(words) {
  const word = pickRandom(words, 1)[0]
  const wrongs = getWrongOptions(word, 3).map(w => w.meaning)
  const options = shuffleArray([word.meaning, ...wrongs])
  return {
    type: EXERCISE_TYPES.LISTENING_CHOICE,
    wordId: word.id,
    module: word.module,
    listenWord: word.word,
    correctAnswer: word.meaning,
    options,
    promptEmoji: getEmojiForWord(word.word),
    hint: word.phonetic,
  }
}

function genImageMatch(words) {
  const word = pickRandom(words, 1)[0]
  const wrongs = getWrongOptions(word, 3)
  const options = shuffleArray([
    { word: word.word, meaning: word.meaning, emoji: getEmojiForWord(word.word) },
    ...wrongs.map(w => ({ word: w.word, meaning: w.meaning, emoji: getEmojiForWord(w.word) })),
  ])
  return {
    type: EXERCISE_TYPES.IMAGE_MATCH,
    wordId: word.id,
    module: word.module,
    prompt: word.word,
    correctAnswer: word.meaning,
    options,
    hint: word.meaning,
  }
}

function genTrueFalse(words) {
  const word = pickRandom(words, 1)[0]
  const isTrue = Math.random() > 0.5
  const wrongs = getWrongOptions(word, 1)
  const wrongWord = wrongs[0]
  const statement = isTrue
    ? `"${word.word}" means "${word.meaning}".`
    : `"${word.word}" means "${wrongWord.meaning}".`
  return {
    type: EXERCISE_TYPES.TRUE_FALSE,
    wordId: word.id,
    module: word.module,
    statement,
    correctAnswer: isTrue,
    hint: `"${word.word}" = ${word.meaning}`,
  }
}

// ===== Fill Blank Templates =====
function getFillBlankTemplates(word) {
  const w = word.word
  const m = word.module
  const templates = []

  if (m === 1) {
    templates.push(
      { sentence: `She works as a ___ in a hospital.`, blankWord: w === 'nurse' ? 'nurse' : w === 'doctor' ? 'doctor' : null },
      { sentence: `What does he do? He is a ___.`, blankWord: w },
      { sentence: `A ___ works in a restaurant.`, blankWord: (w === 'waiter' || w === 'waitress' || w === 'cook') ? w : null },
    )
  } else if (m === 2) {
    templates.push(
      { sentence: `I use a ___ to chat online.`, blankWord: (w === 'computer' || w === 'smartphone' || w === 'tablet') ? w : null },
      { sentence: `I send an ___ to my friend.`, blankWord: 'e-mail' },
      { sentence: `I ___ the Internet twice a day.`, blankWord: 'surf' },
    )
  } else if (m === 3) {
    templates.push(
      { sentence: `We should eat more ___.`, blankWord: (w === 'vegetables' || w === 'fruit' || w === 'fish') ? w : null },
      { sentence: `Hamburgers are ___ food.`, blankWord: 'fast' },
      { sentence: `There is too much ___ in this cake.`, blankWord: 'sugar' },
    )
  } else if (m === 4) {
    templates.push(
      { sentence: `We need rice to make ___.`, blankWord: 'sushi' },
      { sentence: `___ is popular in Italy.`, blankWord: (w === 'pizza' || w === 'spaghetti' || w === 'tiramisu') ? w : null },
      { sentence: `First, cook the rice. ___, put the fish on top.`, blankWord: 'Next' },
    )
  } else if (m === 5) {
    templates.push(
      { sentence: `Have you ever ___ a horse?`, blankWord: 'ridden' },
      { sentence: `It's too ___ to climb that wall.`, blankWord: (w === 'dangerous' || w === 'crowded' || w === 'boring') ? w : null },
      { sentence: `I have ___ kites before.`, blankWord: 'flown' },
    )
  } else if (m === 6) {
    templates.push(
      { sentence: `We should ___ water.`, blankWord: (w === 'save' || w === 'recycle' || w === 'reduce') ? w : null },
      { sentence: `Have you turned off the lights ___?`, blankWord: 'yet' },
      { sentence: `I have already ___ the paper.`, blankWord: 'recycled' },
    )
  }

  // Generic fallback
  templates.push({ sentence: word.example.replace(new RegExp(w, 'i'), '___'), blankWord: w })

  return templates.filter(t => t.blankWord !== null && t.sentence.includes('___'))
}

// ===== Emoji Map =====
const EMOJI_MAP = {
  cook: '👨‍🍳', doctor: '👨‍⚕️', nurse: '👩‍⚕️', teacher: '👩‍🏫', pilot: '✈️',
  waiter: '🍽️', waitress: '🍽️', singer: '🎤', photographer: '📸', reporter: '📰',
  lawyer: '⚖️', astronaut: '🚀', 'tour guide': '🗺️', 'security guard': '🛡️',
  'shop assistant': '🛍️', 'bus driver': '🚌',
  computer: '💻', smartphone: '📱', tablet: '📲', 'digital camera': '📷',
  'fax machine': '📠', quill: '🪶',
  vegetables: '🥦', hamburgers: '🍔', strawberries: '🍓', cheese: '🧀',
  'spring rolls': '🥟', chicken: '🍗', fruit: '🍎', noodles: '🍜',
  fish: '🐟', rice: '🍚', snacks: '🍪', sugar: '🍬',
  spaghetti: '🍝', sushi: '🍣', curry: '🍛', pizza: '🍕', sashimi: '🐟',
  'dim sum': '🥟', 'hot dog': '🌭', tempura: '🍤', tiramisu: '🍰',
  cappuccino: '☕', 'naan bread': '🫓', 'pineapple fried rice': '🍍',
  'tom yum soup': '🍲', frankfurters: '🌭', snail: '🐌', seaweed: '🌿',
  'sesame seeds': '🫘', salmon: '🐟', 'soy sauce': '🫘', wasabi: '💚',
  'ride horses': '🐴', 'climb walls': '🧗', 'pick fruit': '🍎',
  dangerous: '⚠️', crowded: '👥', boring: '😴', exciting: '🎉',
  'play on rides': '🎠', 'play badminton': '🏸', 'fly kites': '🪁',
  'watch snails': '🐌', 'take photos': '📷', 'go ice skating': '⛸️',
  'make candles': '🕯️', 'make clay pots': '🏺', 'feed goats': '🐐',
  'go fishing': '🎣', fun: '🎉',
  recycle: '♻️', pollute: '🏭', 'save energy': '💡', 'turn off': '🔄',
  reduce: '📉', rubbish: '🗑️', factory: '🏭', environment: '🌍',
  protect: '🛡️', 'second-hand': '✋', 'dripping taps': '🚿',
  'public transport': '🚌', 'save water': '💧', reuse: '♻️', newsletter: '📰',
  'a balanced diet': '⚖️', 'dairy products': '🥛', 'fast food': '🍟',
  cereals: '🌾', salty: '🧂', fatty: '🍗', 'soft drinks': '🥤',
  'food pyramid': '🔺', 'chat online': '💬', 'send an e-mail': '📧',
  'send a text message': '📲', 'surf the Internet': '🌐', 'upload a photo': '📸',
  'write a letter': '✉️', 'send a telegram': '📱', 'once a day': '📅',
  'twice a week': '📅', 'cartoon characters': '🧽️',
  'play on a rope course': '🫨',
}

function getEmojiForWord(word) {
  return EMOJI_MAP[word.toLowerCase()] || '📖'
}

// ===== Main Generator =====
export function generateExercises(moduleId, count = 8) {
  const words = getWordsByModule(moduleId)
  if (words.length === 0) return []

  const exercises = []
  const generators = [
    // 40% translation choice (mix en2cn and cn2en)
    () => Math.random() > 0.5 ? genTranslationChoiceEnToCn(words) : genTranslationChoiceCnToEn(words),
    () => genTranslationChoiceEnToCn(words),
    () => genTranslationChoiceCnToEn(words),
    // 25% fill blank
    () => genFillBlank(words),
    () => genFillBlank(words),
    // 15% word bank
    () => genWordBank(words),
    // 10% listening
    () => genListeningChoice(words),
    // 10% image match
    () => genImageMatch(words),
  ]

  const weights = [3, 2, 2, 2, 2, 1, 1, 1]

  // Weighted random selection
  const weightedGen = []
  weights.forEach((w, i) => { for (let j = 0; j < w; j++) weightedGen.push(i) })

  for (let i = 0; i < count; i++) {
    const genIdx = weightedGen[Math.floor(Math.random() * weightedGen.length)]
    let exercise = null
    let attempts = 0
    // Try to generate valid exercise (retry if null)
    while (!exercise && attempts < 5) {
      exercise = generators[genIdx]()
      attempts++
    }
    if (exercise) {
      exercise._index = i
      exercises.push(exercise)
    }
  }

  return exercises
}

// Generate review exercises from specific word IDs
export function generateReviewExercises(wordIds, count = 8) {
  const words = wordIds.map(id => allWords.find(w => w.id === id)).filter(Boolean)
  if (words.length === 0) return []

  const exercises = []
  const generators = [
    () => Math.random() > 0.5 ? genTranslationChoiceEnToCn(words) : genTranslationChoiceCnToEn(words),
    () => genFillBlank(words),
    () => genListeningChoice(words),
    () => genTrueFalse(words),
  ]

  for (let i = 0; i < count; i++) {
    const gen = generators[Math.floor(Math.random() * generators.length)]
    let exercise = gen()
    let attempts = 0
    while (!exercise && attempts < 5) {
      exercise = gen()
      attempts++
    }
    if (exercise) {
      exercise._index = i
      exercises.push(exercise)
    }
  }
  return exercises
}
