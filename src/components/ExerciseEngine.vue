<template>
  <div class="exercise-page">
    <!-- Header -->
    <div class="ex-header">
      <button class="back-btn" @click="exit">✕</button>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="header-right">
        <span class="combo-badge" v-if="combo >= 2" :class="{ fire: combo >= 5 }">
          {{ combo }}×🔥
        </span>
        <span class="xp-badge">+{{ xpEarned }}</span>
      </div>
    </div>

    <!-- Hearts -->
    <div class="hearts-bar">
      <span v-for="i in maxHearts" :key="i" class="heart" :class="{ lost: i > currentHearts }">
        {{ i > currentHearts ? '🖤' : '❤️' }}
      </span>
    </div>

    <!-- Exercise Area -->
    <transition :name="slideDirection" mode="out-in">
      <div class="exercise-area" :key="currentExerciseIndex" v-if="!showResult">
        <!-- Loading state -->
        <div v-if="!currentExercise" class="loading">
          <div class="loading-spinner"></div>
          <p>准备练习...</p>
        </div>

        <!-- Exercise content rendered by type -->
        <component
          v-else
          :is="exerciseComponent"
          :exercise="currentExercise"
          :combo="combo"
          :muted="muted"
          @answer="onAnswer"
          @skip="onSkip"
        />

        <!-- Hint button -->
        <div class="hint-area" v-if="currentExercise && !answered">
          <button class="hint-btn" @click="showHint = !showHint">
            💡 提示
          </button>
          <transition name="fade">
            <div v-if="showHint" class="hint-text">
              {{ currentExercise.hint }}
            </div>
          </transition>
        </div>
      </div>
    </transition>

    <!-- Result Screen -->
    <transition name="pop">
      <div v-if="showResult" class="result-screen">
        <div class="result-card">
          <h2 class="result-title">{{ resultTitle }}</h2>
          <div class="result-emoji">{{ resultEmoji }}</div>
          <div class="result-stats">
            <div class="stat">
              <span class="stat-value">{{ correctCount }}</span>
              <span class="stat-label">答对</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ totalCount }}</span>
              <span class="stat-label">总题</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ xpEarned }}</span>
              <span class="stat-label">XP</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ maxCombo }}</span>
              <span class="stat-label">最高连击</span>
            </div>
          </div>
          <div class="result-stars">
            <span v-for="i in 3" :key="i" class="result-star" :class="{ earned: i <= starCount }">
              {{ i <= starCount ? '⭐' : '☆' }}
            </span>
          </div>
          <button class="continue-btn" @click="finish">
            继续 →
          </button>
        </div>
      </div>
    </transition>

    <!-- Confetti canvas -->
    <canvas ref="confettiCanvas" class="confetti-canvas" v-show="showConfetti"></canvas>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, shallowRef } from 'vue'
import { useGameStore } from '../stores/game'
import { sfx } from '../lib/sfx'
import { EXERCISE_TYPES } from '../data/exercises'

// Exercise components (lazy loaded)
import TranslationChoice from './exercises/TranslationChoice.vue'
import FillBlank from './exercises/FillBlank.vue'
import WordBank from './exercises/WordBank.vue'
import ListeningChoice from './exercises/ListeningChoice.vue'
import ImageMatch from './exercises/ImageMatch.vue'

const props = defineProps({
  exercises: { type: Array, required: true },
  moduleId: { type: Number, default: null },
})

const emit = defineEmits(['complete', 'exit'])

const game = useGameStore()

// ===== State =====
const currentExerciseIndex = ref(0)
const combo = ref(0)
const maxCombo = ref(0)
const xpEarned = ref(0)
const correctCount = ref(0)
const totalCount = ref(0)
const answered = ref(false)
const showResult = ref(false)
const showHint = ref(false)
const showConfetti = ref(false)
const muted = ref(false)
const slideDirection = ref('slide-left')
const confettiCanvas = ref(null)

// Hearts
const maxHearts = computed(() => game.state.maxHp || 5)
const currentHearts = ref(maxHearts.value)

// Progress
const progressPercent = computed(() =>
  props.exercises.length > 0 ? ((currentExerciseIndex.value) / props.exercises.length) * 100 : 0
)

// Current exercise
const currentExercise = computed(() => props.exercises[currentExerciseIndex.value] || null)

// Result
const starCount = computed(() => {
  const rate = totalCount.value > 0 ? correctCount.value / totalCount.value : 0
  if (rate >= 0.95 && maxCombo.value >= 5) return 3
  if (rate >= 0.8) return 2
  if (rate >= 0.5) return 1
  return 0
})

const resultTitle = computed(() => {
  if (starCount.value === 3) return '完美通关！'
  if (starCount.value === 2) return '做得不错！'
  if (starCount.value === 1) return '继续加油！'
  return '再试一次'
})

const resultEmoji = computed(() => {
  if (starCount.value === 3) return '🏆'
  if (starCount.value === 2) return '🌟'
  if (starCount.value === 1) return '💪'
  return '📖'
})

// Component map
const componentMap = {
  [EXERCISE_TYPES.TRANSLATION_CHOICE]: TranslationChoice,
  [EXERCISE_TYPES.FILL_BLANK]: FillBlank,
  [EXERCISE_TYPES.WORD_BANK]: WordBank,
  [EXERCISE_TYPES.LISTENING_CHOICE]: ListeningChoice,
  [EXERCISE_TYPES.IMAGE_MATCH]: ImageMatch,
}

const exerciseComponent = computed(() => {
  if (!currentExercise.value) return null
  return componentMap[currentExercise.value.type] || null
})

// ===== Methods =====

function onAnswer({ correct, wordId }) {
  if (answered.value) return
  answered.value = true
  totalCount.value++
  game.recordAnswer(correct)

  if (correct) {
    correctCount.value++
    combo.value++
    if (combo.value > maxCombo.value) maxCombo.value = combo.value
    xpEarned.value += 10 + Math.min(combo.value, 10)
    sfx.correct()
    if (combo.value >= 3) sfx.combo(combo.value)

    // Mark word learned if applicable
    if (wordId && game.state.wordProgress[wordId]?.status !== 'learned') {
      game.learnWordById(wordId)
    } else if (wordId) {
      game.reviewWord(wordId, true)
    }
  } else {
    combo.value = 0
    currentHearts.value--
    sfx.wrong()
    if (wordId) game.reviewWord(wordId, false)
  }

  // Auto advance
  setTimeout(() => {
    if (currentHearts.value <= 0) {
      showResult.value = true
      if (starCount.value >= 2) triggerConfetti()
      return
    }
    advance()
  }, correct ? 800 : 1200)
}

function onSkip() {
  answered.value = true
  totalCount.value++
  combo.value = 0
  setTimeout(() => advance(), 400)
}

function advance() {
  if (currentExerciseIndex.value >= props.exercises.length - 1) {
    // Lesson complete
    showResult.value = true
    game.addStars(xpEarned.value / 10)
    game.addTimeMinutes(Math.ceil(totalCount.value / 3))
    if (starCount.value >= 2) {
      sfx.complete()
      triggerConfetti()
    }
    return
  }
  slideDirection.value = 'slide-left'
  currentExerciseIndex.value++
  answered.value = false
  showHint.value = false
}

function exit() {
  emit('exit')
}

function finish() {
  emit('complete', {
    correct: correctCount.value,
    total: totalCount.value,
    xp: xpEarned.value,
    stars: starCount.value,
    combo: maxCombo.value,
  })
}

// ===== Confetti =====
let confettiAnim = null

function triggerConfetti() {
  showConfetti.value = true
  const canvas = confettiCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles = []
  const colors = ['#f59e0b', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa']

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      life: 1,
    })
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false

    for (const p of particles) {
      if (p.life <= 0) continue
      alive = true
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.4 // gravity
      p.rotation += p.rotSpeed
      p.life -= 0.012

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    }

    if (alive) {
      confettiAnim = requestAnimationFrame(animate)
    } else {
      showConfetti.value = false
    }
  }

  animate()
}

onMounted(() => {
  game.updateStreak()
})

onUnmounted(() => {
  if (confettiAnim) cancelAnimationFrame(confettiAnim)
})
</script>

<style scoped>
.exercise-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Header */
.ex-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  flex-shrink: 0;
}
.back-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: inherit;
  transition: all 0.15s;
}
.back-btn:active { transform: scale(0.9); }

.progress-bar {
  flex: 1;
  height: 12px;
  background: rgba(255,255,255,0.08);
  border-radius: 6px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #34d399, #10b981);
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.header-right {
  display: flex; align-items: center; gap: 8px;
}

.combo-badge {
  font-size: 14px; font-weight: 800;
  color: #f59e0b;
  animation: comboPulse 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.combo-badge.fire {
  color: #ef4444;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  animation: fireGlow 1s ease-in-out infinite;
}
@keyframes comboPulse {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes fireGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
  50% { text-shadow: 0 0 25px rgba(239, 68, 68, 0.8), 0 0 50px rgba(245, 158, 11, 0.3); }
}

.xp-badge {
  font-size: 13px; font-weight: 700; color: #fbbf24;
  background: rgba(245, 158, 11, 0.15);
  padding: 4px 10px;
  border-radius: 12px;
}

/* Hearts */
.hearts-bar {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 0 16px 8px;
  flex-shrink: 0;
}
.heart { font-size: 18px; transition: all 0.3s; }
.heart.lost { opacity: 0.3; filter: grayscale(1); }

/* Exercise Area */
.exercise-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
}
.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Hint */
.hint-area { padding: 12px 0; text-align: center; }
.hint-btn {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.hint-btn:active { transform: scale(0.95); }
.hint-text {
  margin-top: 8px;
  padding: 10px 16px;
  background: rgba(245, 158, 11, 0.08);
  border-radius: 12px;
  color: #fbbf24;
  font-size: 13px;
  line-height: 1.5;
}

/* Result Screen */
.result-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  padding: 24px;
}
.result-card {
  width: 100%;
  max-width: 340px;
  background: linear-gradient(180deg, #1e293b, #0f172a);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 32px 24px;
  text-align: center;
}
.result-title { font-size: 24px; font-weight: 900; color: #f1f5f9; margin: 0 0 8px; }
.result-emoji { font-size: 64px; margin: 16px 0; animation: resultBounce 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes resultBounce {
  0% { transform: scale(0) rotate(-20deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 20px 0;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-value { font-size: 22px; font-weight: 900; color: #fbbf24; }
.stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }

.result-stars { margin: 16px 0 24px; }
.result-star {
  font-size: 36px;
  margin: 0 4px;
  display: inline-block;
  transition: all 0.3s;
}
.result-star.earned { animation: starPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
.result-star:nth-child(1).earned { animation-delay: 0.1s; }
.result-star:nth-child(2).earned { animation-delay: 0.3s; }
.result-star:nth-child(3).earned { animation-delay: 0.5s; }
@keyframes starPop {
  0% { transform: scale(0) rotate(-30deg); }
  60% { transform: scale(1.3) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
}

.continue-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #0f172a;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}
.continue-btn:active { transform: scale(0.96); }

/* Confetti */
.confetti-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 200;
}

/* Transitions */
.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-left-enter-from { opacity: 0; transform: translateX(60px); }
.slide-left-leave-to { opacity: 0; transform: translateX(-60px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-60px); }
.slide-right-leave-to { opacity: 0; transform: translateX(60px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pop-enter-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.pop-leave-active { transition: all 0.2s; }
.pop-enter-from { opacity: 0; transform: scale(0.85); }
.pop-leave-to { opacity: 0; transform: scale(0.9); }
</style>
