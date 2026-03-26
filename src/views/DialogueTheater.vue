<template>
  <div class="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-4 pb-3">
      <button @click="goBack" class="text-white/50 text-sm">← 返回</button>
      <h1 class="text-lg font-bold text-amber-400">🎭 对话剧场</h1>
      <span class="text-xs text-white/30">{{ moduleName }}</span>
    </div>

    <!-- Mode Tabs -->
    <div class="flex gap-2 px-4 mb-4">
      <button @click="mode = 'roleplay'" class="tab-btn" :class="{ active: mode === 'roleplay' }">🎙️ 角色扮演</button>
      <button @click="startFillMode" class="tab-btn" :class="{ active: mode === 'fill' }">✏️ 填空挑战</button>
    </div>

    <!-- Dialogue Content -->
    <div class="px-4">
      <!-- Scene Title -->
      <div v-if="currentDialogue" class="text-center mb-4">
        <span class="text-xs text-white/40">📍</span>
        <span class="text-sm text-white/70 ml-1">{{ currentDialogue.title }}</span>
      </div>

      <!-- Chat Messages -->
      <div ref="chatBox" class="flex flex-col gap-3 mb-4">
        <template v-for="(msg, idx) in visibleMessages" :key="idx">
          <!-- NPC message (S1) -->
          <div v-if="msg.role === 'S1'" class="flex justify-start anim-slide-up">
            <div class="max-w-[80%] bg-white/10 backdrop-blur rounded-2xl rounded-bl-sm px-4 py-3">
              <span class="text-xs text-amber-400/70 mb-1 block">🗣️ NPC</span>
              <p class="text-sm text-white font-medium">{{ msg.english }}</p>
              <p class="text-xs text-white/40 mt-1">{{ msg.chinese }}</p>
            </div>
          </div>

          <!-- Player message (S2) - roleplay mode -->
          <div v-else-if="msg.role === 'S2' && mode === 'roleplay'" class="flex justify-end anim-slide-up">
            <div class="max-w-[80%] bg-amber-500/15 border border-amber-500/25 rounded-2xl rounded-br-sm px-4 py-3">
              <span class="text-xs text-amber-400 mb-1 block">😊 你</span>
              <p class="text-sm text-white font-medium">{{ msg.english }}</p>
              <p class="text-xs text-white/40 mt-1">{{ msg.chinese }}</p>
            </div>
          </div>

          <!-- Player choices -->
          <div v-if="msg.role === 'S2' && !msg.answered && mode === 'roleplay'" class="flex justify-end anim-slide-up">
            <div class="max-w-[85%] w-full">
              <div class="flex flex-col gap-2">
                <button v-for="(opt, oi) in msg.options" :key="oi"
                        @click="answerRoleplay(idx, oi)"
                        class="text-left bg-white/5 border border-white/10 rounded-xl px-4 py-3 transition-all active:scale-[0.97]"
                        :class="opt.selected ? (opt.correct ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-red-400/50 bg-red-500/10') : 'hover:bg-white/10'">
                  <span class="text-sm text-white/80">{{ opt.english }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Fill mode - S2 with blank -->
          <div v-if="msg.role === 'S2' && mode === 'fill' && !msg.answered" class="flex justify-end anim-slide-up">
            <div class="max-w-[85%] w-full bg-amber-500/15 border border-amber-500/25 rounded-2xl rounded-br-sm px-4 py-3">
              <span class="text-xs text-amber-400 mb-1 block">😊 你</span>
              <p class="text-sm text-white font-medium">{{ msg.displayText }}</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <button v-for="(opt, oi) in msg.options" :key="oi"
                        @click="answerFill(idx, oi)"
                        class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.97]"
                        :class="opt.selected
                          ? (opt.correct ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-red-500/20 border-red-400 text-red-300')
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'">
                  {{ opt.text }}
                </button>
              </div>
            </div>
          </div>

          <!-- Fill mode - S2 answered -->
          <div v-if="msg.role === 'S2' && mode === 'fill' && msg.answered" class="flex justify-end anim-slide-up">
            <div class="max-w-[80%] bg-amber-500/15 border border-amber-500/25 rounded-2xl rounded-br-sm px-4 py-3">
              <span class="text-xs text-amber-400 mb-1 block">😊 你</span>
              <p class="text-sm text-white font-medium">{{ msg.english }}</p>
              <p class="text-xs text-white/40 mt-1">{{ msg.chinese }}</p>
            </div>
          </div>

          <!-- S1 fill mode -->
          <div v-if="msg.role === 'S1' && mode === 'fill' && !msg.answered" class="flex justify-start anim-slide-up">
            <div class="max-w-[85%] w-full bg-white/10 backdrop-blur rounded-2xl rounded-bl-sm px-4 py-3">
              <span class="text-xs text-amber-400/70 mb-1 block">🗣️ NPC</span>
              <p class="text-sm text-white font-medium">{{ msg.displayText }}</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <button v-for="(opt, oi) in msg.options" :key="oi"
                        @click="answerFill(idx, oi)"
                        class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.97]"
                        :class="opt.selected
                          ? (opt.correct ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-red-500/20 border-red-400 text-red-300')
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'">
                  {{ opt.text }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="msg.role === 'S1' && mode === 'fill' && msg.answered" class="flex justify-start anim-slide-up">
            <div class="max-w-[80%] bg-white/10 backdrop-blur rounded-2xl rounded-bl-sm px-4 py-3">
              <span class="text-xs text-amber-400/70 mb-1 block">🗣️ NPC</span>
              <p class="text-sm text-white font-medium">{{ msg.english }}</p>
              <p class="text-xs text-white/40 mt-1">{{ msg.chinese }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Dialogue Nav -->
    <div v-if="dialogues.length > 1 && !isComplete" class="fixed bottom-16 left-0 right-0 px-4 py-2 bg-black/60 backdrop-blur border-t border-white/5">
      <div class="flex items-center justify-center gap-2">
        <span v-for="(d, di) in dialogues" :key="di"
              class="w-2 h-2 rounded-full transition-all"
              :class="di === dialogueIdx ? 'bg-amber-400 w-4' : (di < dialogueIdx ? 'bg-emerald-400' : 'bg-white/20')" />
      </div>
    </div>

    <!-- Complete Screen -->
    <div v-if="isComplete" class="px-4 mt-8 text-center">
      <div class="text-5xl mb-4 anim-bounce-slow">🎉</div>
      <h2 class="text-xl font-bold text-amber-400 mb-2">演出完毕！</h2>
      <p class="text-white/50 text-sm mb-2">获得 ⭐ {{ earnedStars }} 颗星星</p>
      <p class="text-white/30 text-xs mb-6">{{ ratingText }}</p>
      <div class="flex flex-col gap-3 max-w-xs mx-auto">
        <button @click="restart" class="btn-primary">🔄 再来一次</button>
        <button @click="goToBoss" class="btn-gold">⚔️ 挑战Boss</button>
        <button @click="goBack" class="text-white/40 text-sm py-2">← 返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { moduleContent } from '../data/content'
import { getWordsByModule } from '../data/words'
import { speak as youdaoSpeak } from '../lib/tts'

const router = useRouter()
const route = useRoute()
const game = useGameStore()
const chatBox = ref(null)

const moduleId = parseInt(route.params.moduleId)
const mode = ref('roleplay')
const dialogueIdx = ref(0)
const earnedStars = ref(0)
const isComplete = ref(false)
const visibleMessages = ref([])

const moduleThemes = { 1: '职业小镇', 2: '电子迷宫', 3: '美食火山', 4: '黑暗厨房', 5: '风之神殿', 6: '最终城堡' }
const moduleName = computed(() => moduleThemes[moduleId] || `Module ${moduleId}`)
const dialogues = computed(() => moduleContent[moduleId]?.dialogues || [])
const currentDialogue = computed(() => dialogues.value[dialogueIdx.value] || null)

// Rating
const ratingText = computed(() => {
  const total = visibleMessages.value.filter(m => m.answered).length
  const correct = visibleMessages.value.filter(m => m.answered && m.wasCorrect).length
  const rate = total > 0 ? correct / total : 0
  if (rate >= 1) return '💯 完美演出！你是英语天才！'
  if (rate >= 0.8) return '🌟 很棒！继续加油！'
  if (rate >= 0.6) return '👍 不错，多练几次会更好！'
  return '💪 别灰心，再来一次吧！'
})

// Parse dialogue line: "S1: English text（中文翻译）"
function parseLine(line) {
  const match = line.match(/^(S\d):\s*(.+?)（.+?）$/)
  if (!match) {
    const fallback = line.match(/^(S\d):\s*(.+)$/)
    if (fallback) return { role: fallback[1], english: fallback[2].trim(), chinese: '', options: [], answered: false, wasCorrect: false }
    return null
  }
  return { role: match[1], english: match[2].trim(), chinese: '', options: [], answered: false, wasCorrect: false, displayText: match[2].trim() }
}

// Extract Chinese from line
function extractChinese(line) {
  const match = line.match(/（(.+?)）/)
  return match ? match[1] : ''
}

// Generate wrong options for roleplay
function generateRoleplayOptions(dialogue, lineIdx) {
  const correct = parseLine(dialogue.lines[lineIdx])
  if (!correct) return []

  // Collect all S2 lines from ALL dialogues (not just current one) for more variety
  const allS2Lines = []
  for (const d of dialogues.value) {
    for (let i = 0; i < d.lines.length; i++) {
      const p = parseLine(d.lines[i])
      if (p && p.role === 'S2' && p.english !== correct.english) {
        allS2Lines.push(p)
      }
    }
  }

  const options = [{ english: correct.english, correct: true, selected: false }]
  const shuffled = allS2Lines.sort(() => Math.random() - 0.5)
  for (const w of shuffled) {
    if (options.length >= 3) break
    // Make sure wrong options are reasonably different
    if (w.english.length > 10 && w.english !== correct.english) {
      options.push({ english: w.english, correct: false, selected: false })
    }
  }
  // If not enough options, generate plausible wrong answers
  while (options.length < 4) {
    // Common wrong patterns
    const wrongPatterns = [
      "I don't know.", "I like it very much.", "That's interesting!",
      "I'm a student.", "Nice to meet you!", "Sounds great!",
    ]
    const pattern = wrongPatterns[options.length - 1]
    if (!options.find(o => o.english === pattern)) {
      options.push({ english: pattern, correct: false, selected: false })
    }
  }
  return options.sort(() => Math.random() - 0.5)
}

// Generate fill-in-the-blank
function generateFillBlank(msg) {
  const moduleWords = getWordsByModule(moduleId)
  const wordList = moduleWords.map(w => w.word)

  // Find which words in the sentence are in the module word list
  const matchedWords = msg.english.split(/\s+/).filter(w =>
    w.length > 2 && /^[a-zA-Z]+$/.test(w) && wordList.some(mw => mw.toLowerCase() === w.toLowerCase())
  )

  if (matchedWords.length === 0) return msg

  const target = matchedWords[Math.floor(Math.random() * matchedWords.length)]

  // Wrong options: from same module, same word length (±2 chars)
  const wrongOpts = moduleWords
    .filter(w => w.word.toLowerCase() !== target.toLowerCase() && Math.abs(w.word.length - target.length) <= 3)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.word)

  const options = [
    { text: target, correct: true, selected: false },
    ...wrongOpts.map(w => ({ text: w, correct: false, selected: false }))
  ].sort(() => Math.random() - 0.5)

  msg.displayText = msg.english.replace(new RegExp(`\\b${target}\\b`, 'i'), '___')
  msg.options = options
  msg.answer = target
  return msg
}

// Load current dialogue
function loadDialogue() {
  const d = dialogues.value[dialogueIdx.value]
  if (!d) { isComplete.value = true; return }

  visibleMessages.value = d.lines.map((line, idx) => {
    const parsed = parseLine(line)
    if (!parsed) return null
    parsed.chinese = extractChinese(line)
    parsed.displayText = parsed.english
    parsed.options = []
    parsed.answer = ''

    if (parsed.role === 'S2' && mode.value === 'roleplay') {
      // S2 lines get options (except last one which auto-plays)
      const isLastS2 = d.lines.slice(idx + 1).every(l => parseLine(l)?.role !== 'S2')
      if (!isLastS2) {
        parsed.options = generateRoleplayOptions(d, idx)
      } else {
        parsed.answered = true // auto-play last S2 line
      }
    }

    if (mode.value === 'fill') {
      // Every line with long words gets a blank
      const hasTarget = parsed.english.split(/\s+/).some(w => w.length > 3 && /^[a-zA-Z]+$/.test(w))
      if (hasTarget) {
        generateFillBlank(parsed)
      } else {
        parsed.answered = true
      }
    }

    return parsed
  }).filter(Boolean)

  nextTick(() => scrollChat())
}

function scrollChat() {
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}

function answerRoleplay(msgIdx, optIdx) {
  const msg = visibleMessages.value[msgIdx]
  if (!msg || msg.answered) return
  msg.answered = true
  msg.wasCorrect = msg.options[optIdx].correct

  // Mark all options
  msg.options.forEach((o, i) => {
    o.selected = true
  })

  if (msg.wasCorrect) {
    game.addStars(1)
    earnedStars.value++
    game.recordAnswer(true)
    youdaoSpeak(msg.english)
  } else {
    game.recordAnswer(false)
  }

  checkComplete()
  nextTick(() => scrollChat())
}

function answerFill(msgIdx, optIdx) {
  const msg = visibleMessages.value[msgIdx]
  if (!msg || msg.answered) return
  msg.answered = true
  msg.wasCorrect = msg.options[optIdx].correct

  msg.options.forEach((o, i) => { o.selected = true })

  if (msg.wasCorrect) {
    game.addStars(2)
    earnedStars.value += 2
    game.recordAnswer(true)
    youdaoSpeak(msg.english)
  } else {
    game.recordAnswer(false)
  }

  checkComplete()
  nextTick(() => scrollChat())
}

function checkComplete() {
  const unanswered = visibleMessages.value.filter(m => !m.answered)
  if (unanswered.length === 0) {
    // Check if there's next dialogue
    if (dialogueIdx.value < dialogues.value.length - 1) {
      setTimeout(() => {
        dialogueIdx.value++
        loadDialogue()
      }, 1500)
    } else {
      isComplete.value = true
    }
  }
}

function startFillMode() {
  mode.value = 'fill'
  dialogueIdx.value = 0
  earnedStars.value = 0
  isComplete.value = false
  loadDialogue()
}

function restart() {
  earnedStars.value = 0
  isComplete.value = false
  loadDialogue()
}

function goBack() { router.push('/adventure') }
function goToBoss() {
  const bossId = `m${moduleId}_boss`
  router.push(`/boss/${bossId}`)
}

onMounted(() => {
  game.updateStreak()
  loadDialogue()
})
</script>

<style scoped>
.tab-btn {
  flex: 1; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
  background: rgba(30, 41, 59, 0.6); color: rgba(226, 232, 240, 0.5); font-size: 13px;
  font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease;
}
.tab-btn.active { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); color: #f59e0b; }

.btn-primary {
  display: block; width: 100%; padding: 14px; border: none; border-radius: 16px;
  font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit;
  background: linear-gradient(135deg, #7c3aed, #a78bfa); color: white;
  transition: all 0.2s; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
}
.btn-primary:active { transform: scale(0.97); }

.btn-gold {
  display: block; width: 100%; padding: 14px; border: none; border-radius: 16px;
  font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit;
  background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #0f172a;
  transition: all 0.2s; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}
.btn-gold:active { transform: scale(0.97); }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.anim-slide-up { animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
</style>
