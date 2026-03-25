<template>
  <div class="assess-page">
    <div v-if="phase === 'intro'" class="intro-section">
      <div class="intro-icon">🎯</div>
      <h1 class="intro-title">英语基础小测试</h1>
      <p class="intro-desc">在开始冒险之前，先测测你的英语基础吧！</p>
      <p class="intro-sub">共 {{ questions.length }} 题，很快就能完成</p>
      <button class="start-btn" @click="startQuiz">开始测试 →</button>
    </div>

    <div v-if="phase === 'quiz'" class="quiz-section">
      <div class="quiz-header">
        <div class="quiz-progress">{{ currentIdx + 1 }} / {{ questions.length }}</div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: (currentIdx / questions.length * 100) + '%' }"></div>
        </div>
      </div>

      <div class="quiz-card card">
        <div class="quiz-label">{{ currentQ.label }}</div>
        <div class="quiz-prompt">{{ currentQ.prompt }}</div>

        <!-- Choice type -->
        <div v-if="currentQ.type === 'choice'" class="quiz-options">
          <button v-for="(opt, i) in currentQ.options" :key="i"
                  class="option-btn"
                  :class="{ selected: selectedOption === i, correct: showResult && opt.correct, wrong: showResult && selectedOption === i && !opt.correct }"
                  @click="selectOption(i)"
                  :disabled="showResult">
            {{ opt.text }}
          </button>
        </div>

        <!-- Spelling type -->
        <input v-if="currentQ.type === 'spelling'" && !showResult
               v-model="spellingInput" @keyup.enter="submitSpelling"
               class="spell-input"
               placeholder="输入英文..." autocomplete="off" />
        <div v-if="showResult && currentQ.type === 'spelling'" class="spell-result">
          <span v-if="spellingCorrect" class="correct-text">✅ 正确！</span>
          <span v-else class="wrong-text">❌ 正确答案：{{ currentQ.answer }}</span>
        </div>

        <!-- TTS button -->
        <button v-if="currentQ.speak" class="speak-btn" @click="speakPrompt">🔊 听发音</button>

        <button v-if="showResult" class="next-btn" @click="nextQuestion">
          {{ currentIdx < questions.length - 1 ? '下一题 →' : '查看结果' }}
        </button>
      </div>
    </div>

    <div v-if="phase === 'result'" class="result-section">
      <div class="result-icon">{{ score >= 80 ? '🎉' : score >= 50 ? '👍' : '💪' }}</div>
      <h1 class="result-title">{{ score >= 80 ? '基础很棒！' : score >= 50 ? '基础不错！' : '基础需要补一补' }}</h1>
      <div class="result-score">
        <span class="score-num">{{ score }}</span>
        <span class="score-label">/ {{ questions.length }} 分</span>
      </div>

      <div class="result-card card" v-if="weakAreas.length > 0">
        <h3 class="result-label">📚 建议补课</h3>
        <div v-for="(area, i) in weakAreas" :key="i" class="weak-item">
          {{ area }}
        </div>
      </div>

      <div class="result-card card" v-else>
        <h3 class="result-label">🌟 你可以开始冒险了！</h3>
        <p class="result-desc">你的基础很好，直接从 Module 1 开始吧！</p>
      </div>

      <button class="start-btn" @click="goAdventure">⚔️ 开始冒险！</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'

const router = useRouter()
const game = useGameStore()

const phase = ref('intro')
const currentIdx = ref(0)
const score = ref(0)
const selectedOption = ref(-1)
const showResult = ref(false)
const spellingInput = ref('')
const spellingCorrect = ref(false)
const weakAreas = ref([])

const questions = [
  { type: 'choice', label: '第1题 — 看图选词', prompt: '🍎 这个是什么？', options: [
    { text: 'apple 苹果', correct: true }, { text: 'orange 橙子', correct: false },
    { text: 'banana 香蕉', correct: false }, { text: 'grape 葡萄', correct: false },
  ], speak: 'apple' },
  { type: 'choice', label: '第2题 — 选颜色', prompt: '天空是什么颜色？', options: [
    { text: 'red 红色', correct: false }, { text: 'blue 蓝色', correct: true },
    { text: 'green 绿色', correct: false }, { text: 'yellow 黄色', correct: false },
  ]},
  { type: 'choice', label: '第3题 — 选数字', prompt: '3 + 4 = ?', options: [
    { text: 'six 6', correct: false }, { text: 'seven 7', correct: true },
    { text: 'eight 8', correct: false }, { text: 'nine 9', correct: false },
  ]},
  { type: 'spelling', label: '第4题 — 拼写', prompt: '猫🐱', answer: 'cat', speak: 'cat' },
  { type: 'spelling', label: '第5题 — 拼写', prompt: '狗🐶', answer: 'dog', speak: 'dog' },
  { type: 'choice', label: '第6题 — 选动作', prompt: 'What do you do in the morning?（你早上做什么？）', options: [
    { text: 'go to school 去上学', correct: true }, { text: 'go to sleep 去睡觉', correct: false },
    { text: 'go shopping 去购物', correct: false }, { text: 'go swimming 去游泳', correct: false },
  ]},
  { type: 'choice', label: '第7题 — 选时间', prompt: 'Today is Monday. 明天是星期几？', options: [
    { text: 'Saturday 星期六', correct: false }, { text: 'Tuesday 星期二', correct: true },
    { text: 'Wednesday 星期三', correct: false }, { text: 'Sunday 星期天', correct: false },
  ]},
  { type: 'choice', label: '第8题 — 选人称', prompt: '___ is my friend.（___是我的朋友。）', options: [
    { text: 'I 我', correct: false }, { text: 'She 她', correct: true },
    { text: 'Me 我（宾格）', correct: false }, { text: 'My 我的', correct: false },
  ]},
]

const currentQ = computed(() => questions[currentIdx.value])

function startQuiz() {
  phase.value = 'quiz'
  currentIdx.value = 0
  score.value = 0
  showResult.value = false
}

function selectOption(idx) {
  if (showResult.value) return
  selectedOption.value = idx
  showResult.value = true
  if (currentQ.value.options[idx].correct) {
    score.value++
  }
}

function submitSpelling() {
  if (showResult.value || !spellingInput.value.trim()) return
  spellingCorrect.value = spellingInput.value.trim().toLowerCase() === currentQ.value.answer.toLowerCase()
  if (spellingCorrect.value) score.value++
  showResult.value = true
}

function speakPrompt() {
  if (currentQ.value?.speak && 'speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(currentQ.value.speak)
    u.lang = 'en-US'; u.rate = 0.7
    speechSynthesis.speak(u)
  }
}

function nextQuestion() {
  if (currentIdx.value < questions.length - 1) {
    currentIdx.value++
    selectedOption.value = -1
    showResult.value = false
    spellingInput.value = ''
    spellingCorrect.value = false
  } else {
    // Calculate weak areas
    weakAreas.value = []
    const total = questions.length
    const pct = score.value / total * 100
    if (pct < 80) weakAreas.value.push('建议复习基础单词（apple, cat, dog 等）')
    if (pct < 60) weakAreas.value.push('建议复习颜色和数字')
    if (pct < 40) weakAreas.value.push('建议从自然拼读开始学习')
    phase.value = 'result'
    game.checkAchievements()
  }
}

function goAdventure() {
  router.push('/adventure')
}
</script>

<style scoped>
.assess-page { min-height: 100vh; background: linear-gradient(180deg, #0f172a, #1e293b); padding-bottom: 40px; }

.intro-section, .result-section { display: flex; flex-direction: column; align-items: center; padding: 60px 32px; text-align: center; }
.intro-icon, .result-icon { font-size: 64px; margin-bottom: 16px; }
.intro-title, .result-title { font-size: 22px; font-weight: 900; color: #f1f5f9; margin: 0 0 8px; }
.intro-desc, .result-desc { font-size: 15px; color: #cbd5e1; margin: 0 0 4px; }
.intro-sub { font-size: 13px; color: #94a3b8; margin: 0 0 24px; }

.start-btn { padding: 14px 40px; border: none; border-radius: 14px; background: linear-gradient(135deg, #34d399, #10b981); color: #022c22; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 16px; }
.start-btn:active { transform: scale(0.96); }

.quiz-section { padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
.quiz-header { margin-bottom: 16px; }
.quiz-progress { font-size: 14px; font-weight: 700; color: #fbbf24; text-align: center; margin-bottom: 8px; }
.progress-track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b); border-radius: 3px; transition: width 0.3s; }

.card { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; }
.quiz-card { }
.quiz-label { font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
.quiz-prompt { font-size: 20px; font-weight: 800; color: #f1f5f9; margin-bottom: 16px; }

.quiz-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.option-btn { padding: 14px 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #e2e8f0; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; text-align: left; transition: all 0.2s; }
.option-btn:active { transform: scale(0.98); }
.option-btn:disabled { cursor: default; }
.option-btn.correct { background: rgba(52, 211, 153, 0.2); border-color: #34d399; color: #34d399; }
.option-btn.wrong { background: rgba(239, 68, 68, 0.2); border-color: #f87171; color: #f87171; }

.spell-input { width: 100%; padding: 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: #f1f5f9; font-size: 18px; text-align: center; font-family: inherit; margin-bottom: 12px; }
.spell-input:focus { outline: none; border-color: #fbbf24; }
.spell-result { font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 12px; }
.correct-text { color: #34d399; }
.wrong-text { color: #f87171; }

.speak-btn { width: 100%; padding: 10px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; margin-bottom: 12px; }

.next-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #34d399, #10b981); color: #022c22; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }

.result-score { margin: 16px 0; }
.score-num { font-size: 48px; font-weight: 900; color: #fbbf24; }
.score-label { font-size: 18px; color: #94a3b8; }

.result-card { padding: 16px; width: 100%; margin-top: 8px; }
.result-label { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 10px; }
.weak-item { font-size: 14px; color: #f87171; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
</style>
