<template>
  <div class="explore-page">
    <!-- Header -->
    <div class="learn-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="header-info">
        <h1 class="module-title">{{ moduleInfo.name }}</h1>
        <p class="module-sub">{{ moduleInfo.nameEn }}</p>
      </div>
      <span class="progress-text">{{ learnedCount }}/{{ words.length }}</span>
    </div>

    <!-- Progress bar -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <!-- ===== Gas Station (every 4 words) ===== -->
    <div v-if="showGasStation" class="gas-station anim-slide-up" :key="'gas-' + completedWords.length">
      <div class="gas-card">
        <h2 class="gas-title">⛽ 加油站</h2>
        <p class="gas-desc">快速复习！选出正确答案！</p>
        <div class="gas-timer">
          <div class="gas-timer-fill" :style="{ width: gasTimerPercent + '%' }"></div>
        </div>
        <p class="gas-time">{{ gasTimeLeft }}s</p>
        <div class="gas-question" v-if="gasQuestion">
          <span class="gas-emoji">{{ getEmoji(gasQuestion) }}</span>
          <p class="gas-question-text">这是什么？</p>
        </div>
        <div class="gas-options" v-if="!gasAnswered">
          <button v-for="opt in gasOptions" :key="opt" class="gas-opt-btn" @click="answerGas(opt)">
            {{ opt }}
          </button>
        </div>
        <p v-if="gasAnswered && gasSelected === gasQuestion?.meaning" class="gas-result correct">✅ 正确！+5⭐</p>
        <p v-else-if="gasAnswered && gasSelected && gasSelected !== gasQuestion?.meaning" class="gas-result wrong">❌ 是 "{{ gasQuestion?.meaning }}"</p>
      </div>
    </div>

    <!-- ===== Celebration Page (all done) ===== -->
    <div v-else-if="allDone" class="celebration anim-slide-up">
      <div class="celeb-emoji">🎉🏆🎉</div>
      <h2 class="celeb-title">全部完成！</h2>
      <p class="celeb-sub">{{ moduleInfo.name }} — {{ words.length }}个单词已学会</p>
      <div class="celeb-stars">+{{ celebStars }}⭐</div>
      <div class="celeb-words">
        <span v-for="w in words" :key="w.id" class="celeb-word-chip">{{ getEmoji(w) }}</span>
      </div>
      <button class="celeb-btn" @click="goToChant">🎵 去歌谣</button>
      <button class="celeb-btn secondary" @click="goToBoss">⚔️ 挑战Boss</button>
      <button class="celeb-btn secondary" @click="goHome">🏠 回首页</button>
    </div>

    <!-- ===== 6-Step Learning Flow ===== -->
    <div v-else-if="currentWord" class="step-container" :key="currentWord.id">
      <!-- Word indicator -->
      <div class="word-indicator">
        <span v-for="(w, i) in words" :key="w.id" class="dot" :class="{ done: isWordLearned(w.id), current: i === wordIndex }">
          {{ getEmoji(w) }}
        </span>
      </div>

      <!-- Step 1: Guess -->
      <div v-if="currentStep === 1" class="step-card anim-slide-up" :key="'step1-' + currentWord.id">
        <div class="guess-emoji-area" :style="{ background: moduleInfo.gradient }">
          <span class="guess-emoji">{{ getEmoji(currentWord) }}</span>
        </div>
        <p class="sprite-text">猜猜这是什么？🤔</p>
        <div class="guess-options">
          <button v-for="opt in guessOptions" :key="opt" class="guess-btn" @click="guessWord(opt)" :class="{ correct: guessState === 'correct' && opt === currentWord.meaning, wrong: guessState === 'wrong' && guessSelected === opt }">
            {{ opt }}
          </button>
        </div>
        <p v-if="guessState === 'wrong' && guessWrongCount >= 2" class="guess-answer">答案是：<strong>{{ currentWord.meaning }}</strong></p>
      </div>

      <!-- Step 2: Listen -->
      <div v-else-if="currentStep === 2" class="step-card anim-slide-up" :key="'step2-' + currentWord.id">
        <div class="listen-area">
          <div class="listen-circle" @click="playPronunciation">
            <span class="listen-icon">🔊</span>
          </div>
          <p class="listen-phonetic">{{ currentWord.phonetic }}</p>
          <button class="listen-btn" @click="playPronunciation">再听一次</button>
          <p class="listen-hint">仔细听发音...</p>
        </div>
      </div>

      <!-- Step 3: Reveal (3D flip) -->
      <div v-else-if="currentStep === 3" class="step-card step3-card" :key="'step3-' + currentWord.id">
        <div class="flip-container" :class="{ flipped: cardFlipped }" @click="flipCard">
          <div class="flip-card">
            <div class="flip-front" :style="{ background: moduleInfo.gradient }">
              <span class="flip-emoji">{{ getEmoji(currentWord) }}</span>
              <p class="flip-front-hint">点击翻转 👆</p>
            </div>
            <div class="flip-back">
              <h2 class="reveal-word">{{ currentWord.word }}</h2>
              <p class="reveal-phonetic">{{ currentWord.phonetic }}</p>
              <p class="reveal-meaning">{{ currentWord.meaning }}</p>
            </div>
          </div>
        </div>
        <div v-if="cardFlipped" class="reveal-details anim-slide-up">
          <div class="reveal-tip-box anim-slide-up stagger-1">
            <span class="reveal-label">💡 记忆法</span>
            <p class="reveal-tip-text">{{ currentWord.funnyTip }}</p>
          </div>
          <div class="reveal-sentence-box anim-slide-up stagger-2">
            <span class="reveal-label">📝 趣味例句</span>
            <p class="reveal-sentence-text">{{ currentWord.funSentence || currentWord.example }}</p>
            <button class="listen-small-btn" @click="playSentenceAudio(currentWord.id)">🔊 听例句</button>
          </div>
          <div class="reveal-actions">
            <button class="listen-small-btn" @click="playWordAudio(currentWord.id)">🔊 听单词</button>
            <button class="reveal-next-btn" @click="goStep(4)">我记住了 →</button>
          </div>
        </div>
      </div>

      <!-- Step 4: Context Practice -->
      <div v-else-if="currentStep === 4" class="step-card anim-slide-up" :key="'step4-' + currentWord.id">
        <h3 class="step4-title">📖 语境运用</h3>
        <p class="context-hint" v-if="contextHint">💡 {{ contextHint }}</p>
        <div class="context-card">
          <p class="context-prompt">{{ contextQuestion }}</p>
          <div class="context-options">
            <button v-for="opt in contextOptions" :key="opt" class="context-btn" @click="answerContext(opt)" :class="{ correct: contextAnswered && opt === contextCorrectAnswer, wrong: contextAnswered && contextSelected === opt && opt !== contextCorrectAnswer }">
              {{ opt }}
            </button>
          </div>
          <p v-if="contextAnswered && contextSelected === contextCorrectAnswer" class="context-result correct">✅ 太棒了！+1⭐</p>
          <p v-else-if="contextAnswered && contextSelected !== contextCorrectAnswer" class="context-result wrong">❌ 正确答案：{{ contextCorrectAnswer }}</p>
        </div>
      </div>

      <!-- Step 5: Custom Memory -->
      <div v-else-if="currentStep === 5" class="step-card anim-slide-up" :key="'step5-' + currentWord.id">
        <div class="custom-card">
          <h3 class="custom-title">✏️ {{ currentWord.word }} 让我想起...</h3>
          <textarea v-model="customText" class="custom-textarea" placeholder="编一个自己的记忆法，记得最牢！" rows="3"></textarea>
          <div class="custom-actions">
            <button v-if="customText.trim()" class="custom-save-btn" @click="saveCustom">💾 保存记忆</button>
            <button class="custom-skip-btn" @click="goStep(6)">跳过 →</button>
          </div>
        </div>
      </div>

      <!-- Step 6: Complete -->
      <div v-else-if="currentStep === 6" class="step-card anim-slide-up" :key="'step6-' + currentWord.id">
        <div class="complete-card">
          <div class="complete-check">✅</div>
          <h3 class="complete-title">学会了！</h3>
          <p class="complete-word">{{ getEmoji(currentWord) }} {{ currentWord.word }} — {{ currentWord.meaning }}</p>
          <div class="complete-stars">+1⭐</div>
          <button class="complete-next-btn" @click="nextWord">
            <template v-if="wordIndex < words.length - 1">下一个 →</template>
            <template v-else>🎉 全部完成！</template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { getWordsByModule } from '../data/words'
import { moduleContent } from '../data/content'
import { speakWord as playWordAudio, speakSentence as playSentenceAudio } from '../lib/tts'

const router = useRouter()
const route = useRoute()
const game = useGameStore()

const moduleId = parseInt(route.params.moduleId) || 1
const words = ref(getWordsByModule(moduleId))
const wordIndex = ref(0)
const currentStep = ref(1)
const cardFlipped = ref(false)
const guessSelected = ref(null)
const guessState = ref(null)
const guessWrongCount = ref(0)
const customText = ref('')
const showGasStation = ref(false)
const gasTimeLeft = ref(10)
const gasSelected = ref(null)
const gasAnswered = ref(false)
const gasQuestion = ref(null)
const contextSelected = ref(null)
const contextAnswered = ref(false)
const celebStars = ref(0)

let gasTimer = null
let autoNextTimer = null

const _moduleMap = {
  1: { name: '职业迷宫', nameEn: 'Jobs Labyrinth', gradient: 'linear-gradient(135deg, #581c87, #9333ea)', bossId: 'm1_boss' },
  2: { name: '电子迷宫', nameEn: 'E-age Maze', gradient: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', bossId: 'm2_boss' },
  3: { name: '美食火山', nameEn: 'Food Volcano', gradient: 'linear-gradient(135deg, #7c2d12, #f97316)', bossId: 'm3_boss' },
  4: { name: '黑暗厨房', nameEn: 'Dark Kitchen', gradient: 'linear-gradient(135deg, #78350f, #ef4444)', bossId: 'm4_boss' },
  5: { name: '风之神殿', nameEn: 'Wind Temple', gradient: 'linear-gradient(135deg, #134e4a, #14b8a6)', bossId: 'm5_boss' },
  6: { name: '最终城堡', nameEn: 'Final Castle', gradient: 'linear-gradient(135deg, #450a0a, #dc2626)', bossId: 'm6_boss' },
}
const defaultInfo = { name: 'Module ' + moduleId, nameEn: '', gradient: 'linear-gradient(135deg, #1e293b, #475569)', bossId: 'm' + moduleId + '_boss' }
const moduleInfo = computed(() => _moduleMap[moduleId] || defaultInfo)

const currentWord = computed(() => words.value[wordIndex.value])
const completedWords = ref([])
const learnedCount = computed(() => completedWords.value.length)
const allDone = computed(() => completedWords.value.length >= words.value.length)
const progressPercent = computed(() => (completedWords.value.length / words.value.length) * 100)
const gasTimerPercent = computed(() => (gasTimeLeft.value / 10) * 100)

function isWordLearned(id) {
  return completedWords.value.includes(id)
}

// ===== Emoji Map =====
const emojiMap = {
  cook: '👨‍🍳', doctor: '👨‍⚕️', nurse: '👩‍⚕️', teacher: '👩‍🏫',
  pilot: '✈️', waiter: '🍽️', singer: '🎤', photographer: '📸',
  reporter: '📰', lawyer: '⚖️', astronaut: '🚀', 'tour guide': '🗺️',
  'security guard': '🛡️', 'shop assistant': '🛍️', 'bus driver': '🚌', waitress: '🍽️',
  computer: '💻', smartphone: '📱', tablet: '📲', 'chat online': '💬',
  'send an e-mail': '📧', 'send a text message': '📲', 'surf the Internet': '🌐',
  'upload a photo': '📸', 'write a letter': '✉️', 'fax machine': '📠',
  'digital camera': '📷', 'send a telegram': '📱', 'once a day': '📅',
  'twice a week': '📅', quill: '🪶',
  vegetables: '🥦', hamburgers: '🍔', 'a balanced diet': '⚖️',
  'dairy products': '🥛', 'fast food': '🍟', cereals: '🌾',
  salty: '🧂', fatty: '🍗', strawberries: '🍓', cheese: '🧀',
  'spring rolls': '🥟', chicken: '🍗', fruit: '🍎', noodles: '🍜',
  fish: '🐟', rice: '🍚', snacks: '🍪', 'soft drinks': '🥤',
  sugar: '🍬', 'food pyramid': '🔺',
  spaghetti: '🍝', sushi: '🍣', curry: '🍛', pizza: '🍕',
  sashimi: '🐟', 'dim sum': '🥟', 'hot dog': '🌭', tempura: '🍤',
  tiramisu: '🍰', cappuccino: '☕', 'naan bread': '🫓',
  'pineapple fried rice': '🍍', 'tom yum soup': '🍲', frankfurters: '🌭',
  snail: '🐌', seaweed: '🌊', 'sesame seeds': '🫘', salmon: '🐟',
  'soy sauce': '🫘', wasabi: '💚',
  'ride horses': '🐴', 'climb walls': '🧗', 'pick fruit': '🍎', dangerous: '⚠️',
}

function getEmoji(word) {
  if (!word) return '📖'
  const key = typeof word === 'string' ? word : word.word
  return emojiMap[key] || '📖'
}

// ===== TTS (use pre-recorded native audio) =====
function speakText(text) {
  // This is only used as fallback for non-word text
  if (!text || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.8
  window.speechSynthesis.speak(u)
}

function playPronunciation() {
  if (currentWord.value) playWordAudio(currentWord.value.id)
}

// ===== Utilities =====
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ===== Step Navigation =====
function goStep(step) {
  currentStep.value = step
  guessSelected.value = null
  guessState.value = null
  guessWrongCount.value = 0
  cardFlipped.value = false
  contextSelected.value = null
  contextAnswered.value = false
  customText.value = ''
}

function flipCard() {
  if (!cardFlipped.value) {
    cardFlipped.value = true
    if (currentWord.value) speakText(currentWord.value.word)
  }
}

// ===== Step 1: Guess =====
const guessOptions = ref([])
function buildGuessOptions() {
  if (!currentWord.value) { guessOptions.value = []; return }
  const correct = currentWord.value.meaning
  const pool = words.value.filter(w => w.meaning !== correct).map(w => w.meaning)
  const others = shuffle(pool).slice(0, 3)
  guessOptions.value = shuffle([...others, correct])
}

function guessWord(opt) {
  if (guessState.value === 'correct') return
  guessSelected.value = opt
  if (opt === currentWord.value.meaning) {
    guessState.value = 'correct'
    setTimeout(() => goStep(2), 800)
  } else {
    guessState.value = 'wrong'
    guessWrongCount.value++
    setTimeout(() => {
      if (guessState.value === 'wrong') guessState.value = null
    }, 600)
    if (guessWrongCount.value >= 2) {
      setTimeout(() => goStep(2), 2000)
    }
  }
}

// ===== Step 2: Listen (auto-advance) =====
watch(currentStep, (val) => {
  if (val === 1 && currentWord.value) {
    buildGuessOptions()
  }
  if (val === 2) {
    nextTick(() => {
      setTimeout(() => playWordAudio(currentWord.value?.id), 300)
    })
    clearTimeout(autoNextTimer)
    autoNextTimer = setTimeout(() => {
      if (currentStep.value === 2) goStep(3)
    }, 2500)
  }
})

// ===== Step 4: Context (from dialogue data) =====
const contextQuestion = ref('')
const contextOptions = ref([])
const contextCorrectAnswer = ref('')
const contextHint = ref('')

function buildContextOptions() {
  if (!currentWord.value) { contextQuestion.value = ''; contextOptions.value = []; return }

  const word = currentWord.value
  const dialogues = moduleContent[moduleId]?.dialogues || []

  // Try to find a sentence containing this word from dialogues
  let foundLine = null
  for (const d of dialogues) {
    for (const line of d.lines) {
      // Check if the word appears in the English part
      const englishMatch = line.match(/^(S\d):\s*(.+?)(?:（|$)/)
      if (englishMatch) {
        const eng = englishMatch[1]
        // Case-insensitive check for word.word as a whole word
        const regex = new RegExp(`\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (regex.test(eng)) {
          foundLine = eng
          break
        }
      }
    }
    if (foundLine) break
  }

  if (foundLine) {
    // Create a fill-in-the-blank question
    const blanked = foundLine.replace(
      new RegExp(`\\b(${word.word})\\b`, 'i'),
      '___'
    )
    contextQuestion.value = blanked
    contextCorrectAnswer.value = word.word
    contextHint.value = `"${word.word}" = ${word.meaning}`

    // Generate wrong options from same module words
    const pool = getWordsByModule(moduleId)
      .filter(w => w.word !== word.word && w.word.length > 2)
      .map(w => w.word)
    const others = shuffle(pool).slice(0, 3)
    contextOptions.value = shuffle([...others, word.word])
  } else {
    // Fallback: simple translation question
    contextQuestion.value = `"${word.meaning}" 的英文是什么？`
    contextCorrectAnswer.value = word.word
    contextHint.value = `提示：${word.phonetic}`

    const pool = getWordsByModule(moduleId)
      .filter(w => w.word !== word.word)
      .map(w => w.word)
    const others = shuffle(pool).slice(0, 3)
    contextOptions.value = shuffle([...others, word.word])
  }
}

function answerContext(opt) {
  if (contextAnswered.value) return
  contextSelected.value = opt
  contextAnswered.value = true
  if (opt === contextCorrectAnswer.value) {
    game.addStars(1)
    celebStars.value++
  }
  setTimeout(() => goStep(5), 1500)
}

// ===== Step 5: Custom =====
function saveCustom() {
  if (currentWord.value && customText.value.trim()) {
    game.saveCustomHint(currentWord.value.id, customText.value.trim())
    goStep(6)
  }
}

// ===== Step 6: Complete → Next =====
function nextWord() {
  if (!currentWord.value) return
  game.learnWordById(currentWord.value.id)
  if (!completedWords.value.includes(currentWord.value.id)) {
    completedWords.value.push(currentWord.value.id)
  }

  // Gas station: every 4 words
  if (completedWords.value.length > 0 && completedWords.value.length % 4 === 0 && completedWords.value.length < words.value.length) {
    startGasStation()
    return
  }

  if (wordIndex.value < words.value.length - 1) {
    wordIndex.value++
    goStep(1)
    buildContextOptions()
  }
}

// ===== Gas Station =====
function startGasStation() {
  showGasStation.value = true
  gasTimeLeft.value = 10
  gasAnswered.value = false
  gasSelected.value = null

  const pool = completedWords.value
  const randomId = pool[Math.floor(Math.random() * pool.length)]
  const word = words.value.find(w => w.id === randomId)
  gasQuestion.value = word ? { emoji: getEmoji(word), meaning: word.meaning, word: word.word } : null

  buildGasOptions()

  clearInterval(gasTimer)
  gasTimer = setInterval(() => {
    gasTimeLeft.value--
    if (gasTimeLeft.value <= 0) {
      clearInterval(gasTimer)
      gasAnswered.value = true
      gasSelected.value = ''
      setTimeout(() => closeGasStation(), 2000)
    }
  }, 1000)
}

const gasOptions = ref([])
function buildGasOptions() {
  if (!gasQuestion.value) { gasOptions.value = []; return }
  const correct = gasQuestion.value.meaning
  const pool = words.value.filter(w => w.meaning !== correct).map(w => w.meaning)
  const others = shuffle(pool).slice(0, 3)
  gasOptions.value = shuffle([...others, correct])
}

function answerGas(opt) {
  if (gasAnswered.value) return
  gasAnswered.value = true
  gasSelected.value = opt
  clearInterval(gasTimer)
  if (opt === gasQuestion.value?.meaning) {
    game.addStars(5)
    celebStars.value += 5
  }
  setTimeout(() => closeGasStation(), 2000)
}

function closeGasStation() {
  showGasStation.value = false
  clearInterval(gasTimer)
  if (wordIndex.value < words.value.length - 1) {
    wordIndex.value++
    goStep(1)
    buildContextOptions()
  }
}

// ===== Navigation =====
function goBack() { router.push('/adventure') }
function goToChant() { router.push('/chant/' + moduleId) }
function goToBoss() { router.push('/boss/' + moduleInfo.value.bossId) }
function goHome() { router.push('/home') }

// ===== Init =====
onMounted(() => {
  game.updateStreak()
  game.setLastLearnPosition(moduleId)
  goStep(1)
  buildGuessOptions()
  buildContextOptions()
})

onUnmounted(() => {
  clearInterval(gasTimer)
  clearTimeout(autoNextTimer)
  if (window.speechSynthesis) window.speechSynthesis.cancel()
})
</script>

<style scoped>
.explore-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}

/* ===== Header ===== */
.learn-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
.back-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 8px; font-family: inherit; }
.header-info { text-align: center; flex: 1; }
.module-title { font-size: 18px; font-weight: 900; color: #fbbf24; margin: 0; }
.module-sub { font-size: 12px; color: #64748b; margin: 2px 0 0; }
.progress-text { font-size: 14px; font-weight: 700; color: #e2e8f0; }

.progress-track { height: 4px; background: rgba(255,255,255,0.08); margin: 0 16px 12px; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 2px; transition: width 0.4s ease; }

/* ===== Word Indicator ===== */
.word-indicator { display: flex; gap: 4px; padding: 8px 16px; overflow-x: auto; scrollbar-width: none; }
.word-indicator::-webkit-scrollbar { display: none; }
.dot {
  width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
  font-size: 18px; background: rgba(255,255,255,0.04); border: 2px solid transparent;
  flex-shrink: 0; transition: all 0.3s ease;
}
.dot.done { background: rgba(52, 211, 153, 0.15); border-color: rgba(52, 211, 153, 0.4); }
.dot.current { border-color: #fbbf24; background: rgba(251, 191, 36, 0.1); transform: scale(1.1); }

/* ===== Step Card ===== */
.step-card {
  margin: 8px 16px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  overflow: hidden;
}

/* ===== Step 1: Guess ===== */
.guess-emoji-area { padding: 32px 20px 24px; text-align: center; position: relative; overflow: hidden; }
.guess-emoji {
  font-size: 72px; display: block;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
  animation: emojiFloat 2s ease-in-out infinite;
}
@keyframes emojiFloat {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
}
.sprite-text { text-align: center; font-size: 16px; font-weight: 700; color: #cbd5e1; margin: 16px 0 12px; padding: 0 16px; }
.guess-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 16px 20px; }
.guess-btn {
  padding: 14px 10px; border-radius: 14px; font-size: 15px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0;
  transition: all 0.15s ease;
}
.guess-btn:active { transform: scale(0.97); }
.guess-btn.correct { background: rgba(52, 211, 153, 0.2); border-color: #34d399; color: #34d399; animation: greenPulse 0.5s ease; }
@keyframes greenPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(52, 211, 153, 0); }
  50% { box-shadow: 0 0 20px rgba(52, 211, 153, 0.4); }
}
.guess-btn.wrong { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #ef4444; animation: shake 0.4s ease; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
.guess-answer { text-align: center; padding: 8px 16px 20px; font-size: 15px; color: #fbbf24; animation: slideUp 0.3s ease both; }

/* ===== Step 2: Listen ===== */
.listen-area { padding: 40px 20px; text-align: center; }
.listen-circle {
  width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
  border: 2px solid rgba(245, 158, 11, 0.3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease;
}
.listen-circle:active { transform: scale(0.95); }
.listen-icon { font-size: 40px; }
.listen-phonetic { font-size: 24px; color: #e2e8f0; font-weight: 700; margin: 0 0 16px; }
.listen-btn {
  background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24; padding: 10px 24px; border-radius: 20px;
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease;
}
.listen-btn:active { transform: scale(0.97); }
.listen-hint { font-size: 13px; color: #64748b; margin-top: 12px; }

/* ===== Step 3: Reveal (3D Flip) ===== */
.step3-card { padding-bottom: 0 !important; }
.flip-container { perspective: 1000px; width: 200px; height: 200px; margin: 28px auto 0; cursor: pointer; }
.flip-card {
  width: 100%; height: 100%; position: relative;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.flip-container.flipped .flip-card { transform: rotateY(180deg); }
.flip-front, .flip-back {
  position: absolute; inset: 0; border-radius: 20px;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.flip-front { border: 2px solid rgba(255,255,255,0.15); }
.flip-emoji { font-size: 64px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); }
.flip-front-hint { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 8px; }
.flip-back {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
  border: 2px solid rgba(251, 191, 36, 0.3); transform: rotateY(180deg); padding: 16px;
}
.reveal-word { font-size: 28px; font-weight: 900; color: #f1f5f9; margin: 0; }
.reveal-phonetic { font-size: 14px; color: #94a3b8; margin: 4px 0; }
.reveal-meaning { font-size: 18px; font-weight: 700; color: #fbbf24; margin: 0; }
.reveal-details { padding: 0 16px 20px; }
.reveal-tip-box, .reveal-sentence-box { margin-top: 12px; padding: 14px 16px; background: rgba(255,255,255,0.04); border-radius: 14px; }
.reveal-label { font-size: 12px; font-weight: 700; color: #64748b; display: block; margin-bottom: 6px; }
.reveal-tip-text { font-size: 14px; color: #cbd5e1; line-height: 1.5; margin: 0; }
.reveal-sentence-text { font-size: 14px; color: #cbd5e1; line-height: 1.5; margin: 0 0 8px; }
.reveal-actions { display: flex; gap: 10px; margin-top: 16px; }
.listen-small-btn {
  background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24; padding: 8px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease; white-space: nowrap;
}
.listen-small-btn:active { transform: scale(0.97); }
.reveal-next-btn {
  flex: 1; background: linear-gradient(135deg, #34d399, #10b981); border: none;
  color: #022c22; padding: 12px 20px; border-radius: 16px;
  font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit;
  transition: all 0.15s ease; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}
.reveal-next-btn:active { transform: scale(0.97); }

/* ===== Step 4: Context ===== */
.step4-title { font-size: 18px; font-weight: 800; color: #e2e8f0; margin: 0; padding: 20px 16px 0; text-align: center; }
.context-hint { font-size: 12px; color: #fbbf24; text-align: center; margin: 0 16px 12px; }
.context-card { padding: 16px; }
.context-prompt { font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px; text-align: center; }
.context-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.context-btn {
  padding: 14px 10px; border-radius: 14px; font-size: 15px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0;
  transition: all 0.15s ease;
}
.context-btn:active { transform: scale(0.97); }
.context-btn.correct { background: rgba(52, 211, 153, 0.2); border-color: #34d399; color: #34d399; }
.context-btn.wrong { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #ef4444; animation: shake 0.4s ease; }
.context-result { text-align: center; font-size: 14px; margin-top: 12px; padding: 8px; border-radius: 10px; }
.context-result.correct { color: #34d399; background: rgba(52, 211, 153, 0.08); }
.context-result.wrong { color: #ef4444; background: rgba(239, 68, 68, 0.08); }

/* ===== Step 5: Custom ===== */
.custom-card { padding: 20px 16px; text-align: center; }
.custom-title { font-size: 17px; font-weight: 700; color: #c4b5fd; margin: 0 0 14px; }
.custom-textarea {
  width: 100%; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 14px; padding: 12px 14px; color: #e2e8f0; font-size: 14px;
  resize: none; outline: none; font-family: inherit; box-sizing: border-box;
}
.custom-textarea:focus { border-color: rgba(139, 92, 246, 0.5); }
.custom-textarea::placeholder { color: #475569; }
.custom-actions { display: flex; gap: 10px; margin-top: 14px; justify-content: center; }
.custom-save-btn {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6); border: none;
  color: white; padding: 10px 20px; border-radius: 14px;
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease;
}
.custom-save-btn:active { transform: scale(0.97); }
.custom-skip-btn {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; padding: 10px 20px; border-radius: 14px;
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease;
}
.custom-skip-btn:active { transform: scale(0.97); }

/* ===== Step 6: Complete ===== */
.complete-card { padding: 36px 20px; text-align: center; }
.complete-check { font-size: 64px; animation: checkBounce 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes checkBounce {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.complete-title { font-size: 24px; font-weight: 900; color: #34d399; margin: 12px 0 8px; }
.complete-word { font-size: 16px; color: #cbd5e1; margin: 0 0 12px; }
.complete-stars { font-size: 24px; font-weight: 800; color: #fbbf24; animation: starPop 0.4s ease both; }
@keyframes starPop {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
.complete-next-btn {
  display: block; width: calc(100% - 32px); margin: 20px 16px 0;
  background: linear-gradient(135deg, #34d399, #10b981); border: none;
  color: #022c22; padding: 16px; border-radius: 16px;
  font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit;
  transition: all 0.15s ease; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}
.complete-next-btn:active { transform: scale(0.97); }

/* ===== Gas Station ===== */
.gas-station { padding: 16px; }
.gas-card {
  background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px 20px; text-align: center;
}
.gas-title { font-size: 22px; font-weight: 900; color: #fbbf24; margin: 0 0 4px; }
.gas-desc { font-size: 13px; color: #94a3b8; margin: 0 0 12px; }
.gas-timer { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
.gas-timer-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); border-radius: 3px; transition: width 1s linear; }
.gas-time { font-size: 14px; font-weight: 700; color: #ef4444; margin: 0 0 16px; }
.gas-question { margin-bottom: 16px; }
.gas-emoji { font-size: 56px; display: block; margin-bottom: 8px; }
.gas-question-text { font-size: 16px; color: #e2e8f0; font-weight: 600; margin: 0; }
.gas-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.gas-opt-btn {
  padding: 14px 10px; border-radius: 14px; font-size: 15px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0;
  transition: all 0.15s ease;
}
.gas-opt-btn:active { transform: scale(0.97); }
.gas-result { font-size: 16px; font-weight: 700; margin-top: 14px; }
.gas-result.correct { color: #34d399; }
.gas-result.wrong { color: #ef4444; }

/* ===== Celebration ===== */
.celebration { padding: 32px 16px; text-align: center; }
.celeb-emoji { font-size: 56px; margin-bottom: 12px; animation: celebBounce 1s ease-in-out infinite; }
@keyframes celebBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.celeb-title { font-size: 28px; font-weight: 900; color: #fbbf24; margin: 0 0 8px; }
.celeb-sub { font-size: 14px; color: #94a3b8; margin: 0 0 16px; }
.celeb-stars { font-size: 32px; font-weight: 900; color: #fbbf24; margin-bottom: 20px; animation: starPop 0.5s ease both; }
.celeb-words { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 24px; }
.celeb-word-chip {
  font-size: 28px; width: 48px; height: 48px; border-radius: 12px;
  background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center;
  animation: chipPop 0.3s ease both;
}
@keyframes chipPop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.celeb-btn {
  display: block; width: 100%; padding: 16px; border: none; border-radius: 16px;
  font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit;
  background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #0f172a;
  margin-bottom: 10px; transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}
.celeb-btn:active { transform: scale(0.97); }
.celeb-btn.secondary { background: rgba(255,255,255,0.08); color: #94a3b8; box-shadow: none; }
</style>