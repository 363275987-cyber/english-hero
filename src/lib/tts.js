// ===== TTS Engine v2 =====
// 方案 C（混合方案）：
// 1. 单词发音 → 预生成 mp3（本地文件，即时响应）
// 2. 例句 → 预生成 mp3（本地文件）
// 3. 歌谣 → 预生成 mp3（本地文件）
// 4. 故事/长文本 → 有道词典 TTS（实时，支持中英混合）
// 5. 降级 → 浏览器 speechSynthesis

let youdaoAudio = null
let preloadedWords = null
let preloadedSentences = null

// 预加载索引（只加载一次）
function loadIndex(name) {
  return fetch(`/audio/${name}-index.json`)
    .then(r => r.json())
    .catch(() => ({}))
}

// 获取单词发音路径
export async function getWordAudioPath(wordId) {
  if (!preloadedWords) preloadedWords = await loadIndex('words')
  return preloadedWords[wordId] || null
}

// 获取例句发音路径
export async function getSentenceAudioPath(wordId) {
  if (!preloadedSentences) preloadedSentences = await loadIndex('sentences')
  return preloadedSentences[wordId] || null
}

/**
 * 播放单词发音（使用预生成 mp3）
 */
export async function speakWord(wordId) {
  const path = await getWordAudioPath(wordId)
  if (path) {
    playAudio(path)
    return
  }
  // 降级：从 allWords 查找单词文本
  const { allWords } = await import('../data/words')
  const w = allWords.find(w => w.id === wordId)
  if (w) speak(w.word)
}

/**
 * 播放例句发音（使用预生成 mp3）
 */
export async function speakSentence(wordId) {
  const path = await getSentenceAudioPath(wordId)
  if (path) {
    playAudio(path)
    return
  }
  // 降级
  const { allWords } = await import('../data/words')
  const w = allWords.find(w => w.id === wordId)
  if (w) speak(w.funSentence || w.example)
}

/**
 * 播放歌谣（使用预生成 mp3）
 */
export function speakChant(moduleId) {
  playAudio(`/audio/chants/m${moduleId}.mp3`)
}

/**
 * 通用 TTS（有道词典真人发音，支持英文文本）
 * 适用于故事、对话等非预生成内容
 */
export function speak(text, options = {}) {
  if (!text || typeof text !== 'string') return

  // 过滤掉纯中文（有道对中文支持不好）
  const hasEnglish = /[a-zA-Z]/.test(text)
  if (!hasEnglish) return

  // 提取英文部分（去掉 emoji 和中文）
  const cleanText = text
    .replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g, ' ')  // 去掉中文字符
    .replace(/[\U0001F300-\U0001F9FF]/g, '')  // 去掉 emoji
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanText) return

  stop()

  try {
    youdaoAudio = new Audio()
    youdaoAudio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&type=2`
    youdaoAudio.preload = 'auto'
    youdaoAudio.play().catch(() => {
      browserSpeak(cleanText, options)
    })
  } catch {
    browserSpeak(cleanText, options)
  }
}

/** 播放本地音频文件 */
function playAudio(src) {
  stop()
  try {
    youdaoAudio = new Audio(src)
    youdaoAudio.preload = 'auto'
    youdaoAudio.play().catch(() => {})
  } catch {}
}

/** 停止当前发音 */
export function stop() {
  if (youdaoAudio) {
    try { youdaoAudio.pause(); youdaoAudio.currentTime = 0; } catch {}
    youdaoAudio = null
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

/** 浏览器 TTS 最终降级 */
function browserSpeak(text, options = {}) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = options.rate || 0.8
  u.pitch = 1.1

  const voices = speechSynthesis.getVoices()
  const preferred = ['Samantha', 'Karen', 'Google US English', 'Microsoft Zira', 'en-US']
  const voice = voices.find(v => preferred.some(p => v.name.includes(p)))
  if (voice) u.voice = voice

  speechSynthesis.speak(u)
}
