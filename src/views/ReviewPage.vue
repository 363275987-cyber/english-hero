<template>
  <div class="review-page">
    <!-- Header -->
    <div class="review-header">
      <button class="back-btn" @click="$router.push('/home')">← 返回</button>
      <h1 class="header-title">🔄 复习单词</h1>
      <span class="review-count" v-if="reviewQueue.length > 0">{{ currentIndex + 1 }} / {{ reviewQueue.length }}</span>
      <span v-else class="review-count">0</span>
    </div>

    <!-- Empty state -->
    <div v-if="reviewQueue.length === 0" class="empty-state">
      <div class="empty-icon">🎉</div>
      <h2 class="empty-title">暂时没有需要复习的单词</h2>
      <p class="empty-desc">学过的单词记忆还很牢固，过几天再来看看吧！</p>
      <button class="empty-btn" @click="$router.push('/adventure')">去学习新单词 →</button>
    </div>

    <!-- Review card -->
    <div v-else-if="currentReviewWord" class="review-card">
      <!-- Progress -->
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: reviewProgress + '%' }"></div>
      </div>

      <!-- Urgency indicator -->
      <div class="urgency-bar" :class="currentProgress.durability < 25 ? 'urgent' : 'warning'">
        <span v-if="currentProgress.durability < 25">🔴 武器快碎了！赶紧复习</span>
        <span v-else>🟡 武器磨损中，需要复习</span>
      </div>

      <!-- Word display (quiz mode) -->
      <div v-if="!showAnswer" class="quiz-area">
        <div class="quiz-prompt">这个词你还记得吗？</div>
        <h2 class="quiz-word">{{ currentReviewWord.word }}</h2>
        <span class="quiz-phonetic">{{ currentReviewWord.phonetic }}</span>
        <button class="speak-btn" @click="speakWord">🔊 听发音</button>
        <div class="quiz-options" v-if="quizOptions.length > 0">
          <button v-for="(opt, i) in quizOptions" :key="i"
                  class="option-btn"
                  :class="{ correct: showAnswer && opt.correct, wrong: showAnswer && !opt.correct && selectedOption === i }"
                  @click="selectOption(i)">
            {{ opt.text }}
          </button>
        </div>
        <button class="show-answer-btn" @click="showAnswer = true">
          想不起来了，看看答案
        </button>
      </div>

      <!-- Answer revealed -->
      <div v-else class="answer-area">
        <h2 class="answer-word">{{ currentReviewWord.word }}</h2>
        <span class="answer-phonetic">{{ currentReviewWord.phonetic }}</span>
        <div class="answer-meaning">
          <span class="meaning-label">中文意思</span>
          <span class="meaning-text">{{ currentReviewWord.meaning }}</span>
        </div>
        <div class="answer-tip">
          <span class="tip-label">💡 记忆法</span>
          <p class="tip-text">{{ currentReviewWord.funnyTip }}</p>
        </div>
        <div class="answer-sentence">
          <span class="sentence-label">📝 例句</span>
          <p class="sentence-text">{{ currentReviewWord.funSentence || currentReviewWord.example }}</p>
        </div>
        <!-- Durability bar -->
        <div class="durability-section">
          <div class="durability-header">
            <span>🗡️ {{ game.getWordWeaponLabel(reviewQueue[currentIndex]) }}</span>
            <span>{{ currentProgress.durability }}%</span>
          </div>
          <div class="durability-track">
            <div class="durability-fill" :style="{ width: currentProgress.durability + '%' }"
                 :class="currentProgress.durability < 25 ? 'critical' : currentProgress.durability < 50 ? 'low' : 'good'">
            </div>
          </div>
          <div class="srs-info" v-if="currentProgress.reviewCount > 0">
            复习 {{ currentProgress.reviewCount }} 次 · {{ game.getSrsLevel(currentProgress.reviewCount).intervalDays }}天复习间隔
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <button v-if="!showAnswer" class="action-btn forgot" @click="markForgot">
          😵 忘了
        </button>
        <button v-else class="action-btn forgot" @click="markForgot">
          😵 还是没记住
        </button>
        <button v-if="!showAnswer && quizOptions.length > 0" class="action-btn remembered" disabled>
          答对后继续
        </button>
        <button v-else class="action-btn remembered" @click="markRemembered">
          ✅ 记住了！
        </button>
      </div>
    </div>

    <!-- Completion -->
    <div v-if="reviewQueue.length > 0 && currentIndex >= reviewQueue.length" class="completion">
      <div class="completion-icon">🏆</div>
      <h2 class="completion-title">复习完成！</h2>
      <p class="completion-stats">
        记住了 {{ rememberedCount }} 个，忘了 {{ reviewQueue.length - rememberedCount }} 个
      </p>
      <div class="completion-stars">+{{ rememberedCount }} ⭐</div>
      <p class="completion-hint" v-if="rememberedCount > 0">武器升级了！去武器库看看 →</p>
      <div class="completion-btns">
        <button class="completion-btn" @click="$router.push('/home')">返回首页</button>
        <button v-if="rememberedCount > 0" class="completion-btn" style="background: linear-gradient(135deg, #ef4444, #f87171); color: #fff;" @click="$router.push('/weapons')">🗡️ 武器库</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { allWords, getWrongOptions } from '../data/words'
import { speakWord as playWord } from '../lib/tts'

const router = useRouter()
const game = useGameStore()

const reviewQueue = ref([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const selectedOption = ref(-1)
const rememberedCount = ref(0)
const quizOptions = ref([])

// Initialize review queue
function initReview() {
  const queue = game.getReviewQueue(20)
  reviewQueue.value = queue
  currentIndex.value = 0
  showAnswer.value = false
  rememberedCount.value = 0
  selectedOption.value = -1
  if (currentReviewWord.value) {
    generateQuizOptions()
  }
}

const currentReviewWord = computed(() => {
  if (currentIndex.value >= reviewQueue.value.length) return null
  const wordId = reviewQueue.value[currentIndex.value]
  return allWords.find(w => w.id === wordId)
})

const currentProgress = computed(() => {
  const wordId = reviewQueue.value[currentIndex.value]
  return game.state.wordProgress[wordId] || { durability: 0, status: 'new' }
})

const reviewProgress = computed(() => {
  if (reviewQueue.value.length === 0) return 0
  return Math.round((currentIndex.value / reviewQueue.value.length) * 100)
})

function generateQuizOptions() {
  if (!currentReviewWord.value) { quizOptions.value = []; return }
  const correct = currentReviewWord.value
  const wrongs = getWrongOptions(correct, 3)
  const options = [
    ...wrongs.map(w => ({ text: w.meaning, correct: false })),
    { text: correct.meaning, correct: true }
  ].sort(() => Math.random() - 0.5)
  quizOptions.value = options
}

function selectOption(idx) {
  selectedOption.value = idx
  showAnswer.value = true
  const opt = quizOptions.value[idx]
  if (opt && opt.correct) {
    markRemembered()
  }
}

function speakWord() {
  if (!currentReviewWord.value) return
  playWord(currentReviewWord.value.id)
}

function markRemembered() {
  if (!reviewQueue.value[currentIndex.value]) return
  game.reviewWord(reviewQueue.value[currentIndex.value], true)
  rememberedCount.value++
  nextCard()
}

function markForgot() {
  if (!reviewQueue.value[currentIndex.value]) return
  game.reviewWord(reviewQueue.value[currentIndex.value], false)
  nextCard()
}

function nextCard() {
  currentIndex.value++
  showAnswer.value = false
  selectedOption.value = -1
  if (currentReviewWord.value) {
    generateQuizOptions()
  }
}

initReview()
</script>

<style scoped>
.review-page { min-height: 100vh; background: linear-gradient(180deg, #0f172a, #1e293b); padding-bottom: max(16px, env(safe-area-inset-bottom)); }

.review-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
.back-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 8px; font-family: inherit; }
.header-title { font-size: 18px; font-weight: 900; color: #fbbf24; margin: 0; }
.review-count { font-size: 14px; font-weight: 700; color: #e2e8f0; }

.progress-track { height: 4px; background: rgba(255,255,255,0.08); margin: 0 16px 16px; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 2px; transition: width 0.4s ease; }

.empty-state { text-align: center; padding: 60px 32px; }
.empty-icon { font-size: 64px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px; }
.empty-desc { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px; }
.empty-btn { background: linear-gradient(135deg, #34d399, #10b981); border: none; color: #022c22; padding: 12px 32px; border-radius: 16px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s ease; }
.empty-btn:active { transform: scale(0.97); }

.urgency-bar { text-align: center; padding: 10px; margin: 0 16px 12px; border-radius: 16px; font-size: 13px; font-weight: 600; }
.urgency-bar.urgent { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.urgency-bar.warning { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }

.review-card { margin: 0 16px; background: rgba(30, 41, 59, 0.8); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }

.quiz-area { padding: 32px 20px; text-align: center; }
.quiz-prompt { font-size: 14px; color: #64748b; margin-bottom: 16px; }
.quiz-word { font-size: 36px; font-weight: 900; color: #f1f5f9; margin: 0; }
.quiz-phonetic { font-size: 16px; color: #94a3b8; display: block; margin: 8px 0 16px; }
.speak-btn { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; padding: 8px 20px; border-radius: 16px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; margin-bottom: 20px; transition: all 0.15s ease; }
.speak-btn:active { transform: scale(0.97); }

.quiz-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.option-btn { padding: 14px 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: #e2e8f0; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease; text-align: left; }
.option-btn:active { transform: scale(0.97); }
.option-btn.correct { background: rgba(52, 211, 153, 0.2); border-color: #34d399; color: #34d399; }
.option-btn.wrong { background: rgba(239, 68, 68, 0.2); border-color: #f87171; color: #f87171; }

.show-answer-btn { background: none; border: none; color: #64748b; font-size: 13px; cursor: pointer; font-family: inherit; text-decoration: underline; }

.answer-area { padding: 24px 20px; }
.answer-word { font-size: 32px; font-weight: 900; color: #f1f5f9; margin: 0; text-align: center; }
.answer-phonetic { font-size: 16px; color: #94a3b8; display: block; text-align: center; margin: 4px 0 16px; }

.answer-meaning, .answer-tip, .answer-sentence { margin-top: 14px; padding: 14px 16px; background: rgba(255,255,255,0.04); border-radius: 16px; }
.meaning-label, .tip-label, .sentence-label { font-size: 12px; font-weight: 700; color: #64748b; display: block; margin-bottom: 6px; }
.meaning-text { font-size: 20px; font-weight: 800; color: #f1f5f9; }
.tip-text, .sentence-text { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0; }

.durability-section { margin-top: 16px; padding: 12px 16px; background: rgba(255,255,255,0.04); border-radius: 16px; }
.durability-header { display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.durability-track { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.durability-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.durability-fill.good { background: linear-gradient(90deg, #34d399, #6ee7b7); }
.durability-fill.low { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.durability-fill.critical { background: linear-gradient(90deg, #ef4444, #f87171); }

.srs-info { font-size: 11px; color: #64748b; margin-top: 6px; text-align: center; }

.action-buttons { display: flex; gap: 12px; padding: 16px; }
.action-btn { flex: 1; padding: 14px; border-radius: 16px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; font-family: inherit; transition: all 0.15s ease; }
.action-btn:active { transform: scale(0.97); }
.action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.action-btn.forgot { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.action-btn.remembered { background: linear-gradient(135deg, #34d399, #10b981); color: #022c22; }

.completion { text-align: center; padding: 60px 32px; }
.completion-icon { font-size: 64px; margin-bottom: 16px; }
.completion-title { font-size: 20px; font-weight: 800; color: #f1f5f9; margin: 0 0 8px; }
.completion-stats { font-size: 14px; color: #94a3b8; margin: 0 0 12px; }
.completion-stars { font-size: 18px; font-weight: 700; color: #fbbf24; margin-bottom: 8px; }
.completion-hint { font-size: 13px; color: #34d399; margin-bottom: 16px; }
.completion-btn { background: linear-gradient(135deg, #34d399, #10b981); border: none; color: #022c22; padding: 12px 32px; border-radius: 16px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s ease; }
.completion-btn:active { transform: scale(0.97); }
.completion-btns { display: flex; gap: 10px; justify-content: center; }
</style>
