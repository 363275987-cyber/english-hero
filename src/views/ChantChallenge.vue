<template>
  <div class="chant-page">
    <!-- Header -->
    <div class="learn-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="header-info">
        <h1 class="module-title">🎤 歌谣挑战</h1>
        <p class="module-sub">{{ moduleInfo.name }}</p>
      </div>
    </div>

    <!-- Mode Tabs -->
    <div class="mode-tabs">
      <button class="mode-tab" :class="{ active: mode === 'follow' }" @click="switchMode('follow')">
        🎵 跟读模式
      </button>
      <button class="mode-tab" :class="{ active: mode === 'fill' }" @click="switchMode('fill')">
        ✏️ 填空挑战
      </button>
    </div>

    <!-- Progress bar -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <!-- ===== Follow Mode ===== -->
    <div v-if="mode === 'follow'" class="chant-content">
      <!-- Playing / Finished -->
      <div v-if="followFinished" class="result-area anim-slide-up">
        <div class="result-emoji">🎉🎵🎉</div>
        <h2 class="result-title">歌谣完成！</h2>
        <p class="result-sub">你已经跟着读完了整首歌谣！</p>
        <div class="result-stars">+5⭐</div>
        <div class="result-btns">
          <button class="chant-btn primary" @click="restartFollow">🔄 再来一次</button>
          <button class="chant-btn secondary" @click="switchMode('fill')">✏️ 试试填空</button>
          <button class="chant-btn secondary" @click="goBack">🏠 返回</button>
        </div>
      </div>

      <!-- Lyrics display -->
      <div v-else class="lyrics-area">
        <div class="lyrics-box">
          <div
            v-for="(line, i) in lines"
            :key="i"
            class="lyric-line"
            :class="{ active: i === currentLine }"
            :style="{ animationDelay: i * 0.05 + 's' }"
          >
            {{ line }}
          </div>
        </div>

        <!-- Play / Pause button -->
        <div class="play-area">
          <button v-if="!isPlaying" class="play-btn anim-breathe-gold" @click="startFollow">
            ▶ 开始跟读
          </button>
          <button v-else class="play-btn" @click="stopFollow">
            ⏸ 暂停
          </button>
        </div>

        <p class="play-hint" v-if="!isPlaying && currentLine === 0">
          点击播放，逐句跟读歌谣 🎤
        </p>
      </div>
    </div>

    <!-- ===== Fill Mode ===== -->
    <div v-if="mode === 'fill'" class="chant-content">
      <!-- Finished -->
      <div v-if="fillFinished" class="result-area anim-slide-up">
        <div class="result-emoji">🏆✨🏆</div>
        <h2 class="result-title">挑战完成！</h2>
        <p class="result-sub">{{ fillCorrect }}/{{ blanks.length }} 正确</p>
        <div class="result-grade" :class="'grade-' + grade">{{ grade }}</div>
        <div class="result-stars">+{{ fillCorrect * 2 }}⭐</div>
        <div class="result-btns">
          <button class="chant-btn primary" @click="restartFill">🔄 再来一次</button>
          <button class="chant-btn secondary" @click="goBack">🏠 返回</button>
        </div>
      </div>

      <!-- Fill questions -->
      <div v-else class="fill-area">
        <!-- Play chant button -->
        <div class="fill-play-row">
          <button class="small-play-btn" @click="playFullChant" :disabled="isPlayingFull">
            {{ isPlayingFull ? '🔊 播放中...' : '🔊 听歌谣' }}
          </button>
          <span class="fill-progress">{{ answeredCount }}/{{ blanks.length }}</span>
        </div>

        <!-- Lyrics with blanks -->
        <div class="lyrics-box">
          <template v-for="(line, li) in lines" :key="li">
            <!-- Check if this line has blanks -->
            <div v-if="getBlanksForLine(li).length > 0" class="lyric-line lyric-fill-line">
              <template v-for="(token, ti) in tokenizeLine(line, li)" :key="ti">
                <span v-if="token.type === 'text'" class="token-text">{{ token.text }}</span>
                <span v-else-if="token.type === 'blank'" class="blank-slot" :class="{
                  'blank-correct': token.answered && token.correct,
                  'blank-wrong': token.answered && !token.correct
                }">
                  {{ token.answered ? token.selected : '___' }}
                </span>
              </template>
              <!-- Options for blanks in this line -->
              <div class="blank-options">
                <template v-for="b in getBlanksForLine(li)" :key="b.index">
                  <button
                    v-for="opt in b.options"
                    :key="opt"
                    class="opt-btn"
                    :class="{
                      'opt-correct': b.answered && opt === b.word,
                      'opt-wrong': b.answered && opt !== b.word && opt === b.selected,
                      'opt-disabled': b.answered
                    }"
                    :disabled="b.answered"
                    @click="answerBlank(b.index, opt)"
                  >
                    {{ opt }}
                  </button>
                </template>
              </div>
            </div>
            <div v-else class="lyric-line text-white/50">{{ line }}</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { moduleContent } from '../data/content'
import { getWordsByModule } from '../data/words'
import { useGameStore } from '../stores/game'

const router = useRouter()
const route = useRoute()
const game = useGameStore()

const moduleId = parseInt(route.params.moduleId) || 1
const chant = moduleContent[moduleId]?.chant || ''

const _moduleMap = {
  1: { name: '职业', nameEn: 'Jobs', bossId: 'boss_jobs' },
  2: { name: '通讯', nameEn: 'Communication', bossId: 'boss_tech' },
  3: { name: '食物', nameEn: 'Food & Diet', bossId: 'boss_food' },
  4: { name: '美食', nameEn: 'World Food', bossId: 'boss_cook' },
  5: { name: '活动', nameEn: 'Activities', bossId: 'boss_fun' },
  6: { name: '环保', nameEn: 'Environment', bossId: 'boss_earth' },
}
const moduleInfo = computed(() => _moduleMap[moduleId] || { name: '歌谣', nameEn: 'Chant' })

// ===== Parse chant lines =====
function parseChant(text) {
  return text
    .split('\n')
    .map(line => line.replace(/^(\s*\p{Emoji_Presentation}|\p{Extended_Pictographic}\s*)+/u, '').trim())
    .filter(line => line.length > 0)
}

const lines = ref(parseChant(chant))

// ===== Mode =====
const mode = ref('follow')

function switchMode(m) {
  stopFollow()
  isPlayingFull.value = false
  mode.value = m
}

// ===== Follow Mode =====
const currentLine = ref(0)
const isPlaying = ref(false)
const followFinished = ref(false)
let speechUtterance = null

const progressPercent = computed(() => {
  if (mode.value === 'follow') {
    return lines.value.length > 0 ? (currentLine.value / lines.value.length) * 100 : 0
  }
  // fill mode
  return blanks.value.length > 0 ? (answeredCount.value / blanks.value.length) * 100 : 0
})

function speak(text) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.7
    speechUtterance = u
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function startFollow() {
  isPlaying.value = true
  followFinished.value = false
  currentLine.value = 0

  for (let i = 0; i < lines.value.length; i++) {
    currentLine.value = i
    await speak(lines.value[i])
    if (!isPlaying.value) break
    await sleep(1500) // pause for child to repeat
  }

  if (isPlaying.value) {
    isPlaying.value = false
    followFinished.value = true
    game.addStars(5)
  }
}

function stopFollow() {
  isPlaying.value = false
  window.speechSynthesis?.cancel()
}

function restartFollow() {
  followFinished.value = false
  currentLine.value = 0
  startFollow()
}

// ===== Fill Mode =====
const fillFinished = ref(false)
const fillCorrect = ref(0)
const isPlayingFull = ref(false)

// Candidate words: length > 3 English words
function getCandidates() {
  const candidates = []
  const seen = new Set()
  lines.value.forEach((line, lineIdx) => {
    const words = line.match(/[a-zA-Z']+/g) || []
    words.forEach(w => {
      const clean = w.toLowerCase()
      if (clean.length > 3 && !seen.has(clean)) {
        seen.add(clean)
        candidates.push({ word: clean, lineIdx, posInLine: line.indexOf(w) })
      }
    })
  })
  return candidates
}

function generateBlanks() {
  const candidates = getCandidates()
  // shuffle
  const shuffled = candidates.sort(() => Math.random() - 0.5)
  // pick 3-5
  const count = Math.min(Math.floor(Math.random() * 3) + 3, shuffled.length)
  const picked = shuffled.slice(0, count)

  // module words for wrong options
  const moduleWords = getWordsByModule(moduleId)
  const allWordsPool = moduleWords.map(w => w.word.toLowerCase())

  return picked.map((c, i) => {
    // correct answer (preserve original case)
    const originalWord = lines.value[c.lineIdx].match(/[a-zA-Z']+/g)
      ?.find(w => w.toLowerCase() === c.word) || c.word

    // wrong options from module words
    let wrongPool = allWordsPool.filter(w => w !== c.word)
    const wrongShuffled = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3)

    // if not enough wrong options, fill with common words
    const fallbackWords = ['teacher', 'doctor', 'student', 'school', 'hospital', 'house', 'people', 'about']
    while (wrongShuffled.length < 3) {
      const fb = fallbackWords[Math.floor(Math.random() * fallbackWords.length)]
      if (fb !== c.word && !wrongShuffled.includes(fb)) wrongShuffled.push(fb)
    }

    const options = [originalWord, ...wrongShuffled.slice(0, 3)].sort(() => Math.random() - 0.5)

    return {
      index: i,
      word: originalWord,
      lineIdx: c.lineIdx,
      options,
      answered: false,
      correct: false,
      selected: null
    }
  })
}

const blanks = ref([])

function initFill() {
  fillFinished.value = false
  fillCorrect.value = 0
  blanks.value = generateBlanks()
}

const answeredCount = computed(() => blanks.value.filter(b => b.answered).length)
const grade = computed(() => {
  const total = blanks.value.length
  if (total === 0) return 'D'
  const ratio = fillCorrect.value / total
  if (ratio === 1) return 'S'
  if (ratio >= 0.8) return 'A'
  if (ratio >= 0.6) return 'B'
  if (ratio >= 0.4) return 'C'
  return 'D'
})

function getBlanksForLine(lineIdx) {
  return blanks.value.filter(b => b.lineIdx === lineIdx)
}

function tokenizeLine(line, lineIdx) {
  const lineBlanks = getBlanksForLine(lineIdx)
  if (lineBlanks.length === 0) return [{ type: 'text', text: line }]

  // Split line by blank words, keeping blanks as tokens
  // We need to replace blank words with blank slots
  const tokens = []
  let remaining = line

  // Sort blanks by position in line
  const sortedBlanks = [...lineBlanks].sort((a, b) => {
    const posA = remaining.toLowerCase().indexOf(a.word.toLowerCase())
    const posB = remaining.toLowerCase().indexOf(b.word.toLowerCase())
    return posA - posB
  })

  // Actually, let's use a simpler approach: regex replace
  const blankSet = new Set(lineBlanks.map(b => b.word.toLowerCase()))
  const parts = line.split(/(\b[a-zA-Z']+\b)/)

  let blankIdx = 0
  parts.forEach(part => {
    if (/^[a-zA-Z']+$/.test(part) && blankSet.has(part.toLowerCase())) {
      const b = lineBlanks[blankIdx]
      if (b) {
        tokens.push({
          type: 'blank',
          answered: b.answered,
          correct: b.correct,
          selected: b.selected
        })
        blankIdx++
      } else {
        tokens.push({ type: 'text', text: part })
      }
    } else {
      tokens.push({ type: 'text', text: part })
    }
  })

  return tokens
}

function answerBlank(blankIndex, opt) {
  const b = blanks.value.find(x => x.index === blankIndex)
  if (!b || b.answered) return

  b.answered = true
  b.selected = opt
  b.correct = opt === b.word

  if (b.correct) {
    fillCorrect.value++
    game.addStars(2)
  }
  game.recordAnswer(b.correct)

  // Check if all answered
  if (blanks.value.every(x => x.answered)) {
    setTimeout(() => { fillFinished.value = true }, 800)
  }
}

async function playFullChant() {
  isPlayingFull.value = true
  for (let i = 0; i < lines.value.length; i++) {
    if (!isPlayingFull.value) break
    await speak(lines.value[i])
    await sleep(800)
  }
  isPlayingFull.value = false
}

function restartFill() {
  initFill()
}

// ===== Navigation =====
function goBack() {
  stopFollow()
  isPlayingFull.value = false
  router.back()
}

// ===== Lifecycle =====
onUnmounted(() => {
  stopFollow()
  window.speechSynthesis?.cancel()
})

// Init fill blanks when component mounts (pre-generate)
initFill()
</script>

<style scoped>
.chant-page {
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  padding-bottom: 100px;
}

.learn-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  background: none;
  border: none;
  color: #f59e0b;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}

.header-info {
  flex: 1;
}

.module-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.module-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

/* Mode Tabs */
.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.mode-tab {
  flex: 1;
  padding: 10px;
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.5);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-tab.active {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

/* Progress */
.progress-track {
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  border-radius: 2px;
  transition: width 0.3s;
}

/* Lyrics */
.lyrics-box {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 20px 16px;
  margin-bottom: 20px;
}

.lyric-line {
  font-size: 20px;
  line-height: 2;
  color: rgba(255,255,255,0.35);
  transition: all 0.4s;
  padding: 2px 8px;
  border-radius: 8px;
}

.lyric-line.active {
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
  background: rgba(251, 191, 36, 0.08);
  transform: scale(1.02);
}

/* Follow mode buttons */
.play-area {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.play-btn {
  padding: 16px 40px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:active {
  transform: scale(0.95);
}

.play-hint {
  text-align: center;
  color: rgba(255,255,255,0.3);
  font-size: 14px;
}

/* Result */
.result-area {
  text-align: center;
  padding: 40px 20px;
}

.result-emoji {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-title {
  font-size: 28px;
  font-weight: 900;
  color: #fbbf24;
  margin-bottom: 8px;
}

.result-sub {
  font-size: 16px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 12px;
}

.result-grade {
  display: inline-block;
  font-size: 72px;
  font-weight: 900;
  margin: 12px 0;
  text-shadow: 0 0 30px currentColor;
}

.grade-S { color: #fbbf24; }
.grade-A { color: #34d399; }
.grade-B { color: #60a5fa; }
.grade-C { color: #a78bfa; }
.grade-D { color: rgba(255,255,255,0.4); }

.result-stars {
  font-size: 24px;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 24px;
}

.result-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 280px;
  margin: 0 auto;
}

.chant-btn {
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.chant-btn:active {
  transform: scale(0.97);
}

.chant-btn.primary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
}

.chant-btn.secondary {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.1);
}

/* Fill Mode */
.fill-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fill-play-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.small-play-btn {
  padding: 10px 20px;
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.small-play-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.small-play-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.fill-progress {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
}

.lyric-fill-line {
  color: rgba(255,255,255,0.7) !important;
}

.token-text {
  color: inherit;
}

.blank-slot {
  display: inline-block;
  min-width: 60px;
  text-align: center;
  padding: 2px 8px;
  border-bottom: 2px solid #f59e0b;
  color: #fbbf24;
  font-weight: 700;
  margin: 0 2px;
  transition: all 0.3s;
}

.blank-correct {
  border-color: #34d399;
  color: #34d399;
}

.blank-wrong {
  border-color: #f87171;
  color: #f87171;
}

.blank-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 0;
}

.opt-btn {
  padding: 8px 16px;
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.opt-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.opt-btn:disabled {
  cursor: default;
}

.opt-correct {
  border-color: #34d399;
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.opt-wrong {
  border-color: #f87171;
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}
</style>
