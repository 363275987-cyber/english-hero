<template>
  <div class="learn-page">
    <!-- Header -->
    <div class="learn-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="header-info">
        <h1 class="module-title">{{ moduleInfo.name }}</h1>
        <p class="module-sub">{{ moduleInfo.nameEn }}</p>
      </div>
      <span class="progress-text">{{ currentIndex + 1 }} / {{ words.length }}</span>
    </div>

    <!-- Progress bar -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <!-- Word Card -->
    <div class="word-card" v-if="currentWord" :key="currentWord.id">
      <!-- Image area -->
      <div class="image-area" :style="{ background: moduleInfo.gradient }">
        <span class="word-emoji" :key="currentWord.word">{{ getEmoji(currentWord) }}</span>
        <p class="image-desc">{{ currentWord.funImage || '记忆这个单词的画面...' }}</p>
      </div>

      <!-- Word display -->
      <div class="word-display">
        <h2 class="the-word">{{ currentWord.word }}</h2>
        <span class="phonetic">{{ currentWord.phonetic }}</span>
        <button class="speak-btn" @click="speakWord">🔊 听发音</button>
      </div>

      <!-- Meaning -->
      <div class="meaning-box">
        <span class="meaning-label">中文意思</span>
        <span class="meaning-text">{{ currentWord.meaning }}</span>
      </div>

      <!-- Fun memory tip -->
      <div class="tip-box">
        <span class="tip-label">💡 记忆法</span>
        <p class="tip-text">{{ currentWord.funnyTip }}</p>
      </div>

      <!-- Fun sentence -->
      <div class="sentence-box">
        <span class="sentence-label">📝 趣味例句</span>
        <p class="sentence-text">{{ currentWord.funSentence || currentWord.example }}</p>
        <button class="speak-btn small" @click="speakSentence">🔊 听例句</button>
      </div>

      <!-- Custom memory hint -->
      <div class="custom-box">
        <span class="custom-label">✏️ 我来编一个（自己编的记得最牢）</span>
        <textarea v-model="customHint" class="custom-input" :placeholder="'例如：' + currentWord.word + '让我想起...'" rows="2"></textarea>
        <button v-if="customHint.trim()" class="save-hint-btn" @click="saveHint">💾 保存</button>
      </div>
    </div>

    <!-- Navigation -->
    <div class="nav-buttons">
      <button class="nav-btn prev" @click="prevWord" :disabled="currentIndex === 0">
        ← 上一个
      </button>
      <button class="nav-btn learn" @click="markLearned" :class="{ learned: isLearned }">
        {{ isLearned ? '✅ 已学会' : '学会了 ✓' }}
      </button>
      <button class="nav-btn next" @click="nextWord" :disabled="currentIndex >= words.length - 1">
        下一个 →
      </button>
    </div>

    <!-- Story popup (when all learned) -->
    <Teleport to="body">
      <div v-if="showStory" class="story-overlay" @click.self="showStory = false">
        <div class="story-card">
          <h2 class="story-title">📖 {{ moduleInfo.name }} 搞笑故事</h2>
          <div class="story-content">
            <p v-for="(line, i) in storyLines" :key="i">{{ line }}</p>
          </div>
          <button class="story-btn" @click="goToBoss">⚔️ 挑战Boss！</button>
          <button class="story-btn secondary" @click="showStory = false">稍后再说</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { getWordsByModule, moduleStories } from '../data/words'
import { speakWord as playWord, speakSentence as playSentence } from '../lib/tts'

const router = useRouter()
const route = useRoute()
const game = useGameStore()

const moduleId = parseInt(route.params.moduleId) || 1
const words = ref(getWordsByModule(moduleId))
const currentIndex = ref(0)
const customHint = ref('')
const showStory = ref(false)

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

const currentWord = computed(() => words.value[currentIndex.value])
const progressPercent = computed(() => ((currentIndex.value + 1) / words.value.length) * 100)
const isLearned = computed(() => game.state.wordProgress[currentWord.value?.id]?.status === 'learned')

const storyText = computed(() => moduleStories[moduleId] || '故事加载中...')
const storyLines = computed(() => storyText.value.split(/[。！？]/).filter(s => s.trim()))

function getEmoji(word) {
  const emojis = { cook: '👨‍🍳', doctor: '👨‍⚕️', nurse: '👩‍⚕️', teacher: '👩‍🏫', pilot: '✈️', waiter: '🍽️', singer: '🎤', photographer: '📸', reporter: '📰', lawyer: '⚖️', astronaut: '🚀', computer: '💻', smartphone: '📱', hamburger: '🍔', pizza: '🍕', spaghetti: '🍝', sushi: '🍣' }
  return emojis[word.word] || '📖'
}

function speakWord() {
  if (currentWord.value) playWord(currentWord.value.id)
}

function speakSentence() {
  if (currentWord.value) playSentence(currentWord.value.id)
}

function markLearned() {
  if (!currentWord.value) return
  const id = currentWord.value.id
  if (!isLearned.value) {
    game.learnWordById(id)
    const allLearned = words.value.every(w => game.state.wordProgress[w.id]?.status === 'learned')
    if (allLearned) {
      setTimeout(() => { showStory.value = true }, 500)
    } else {
      nextUnlearned()
    }
  }
}

function nextUnlearned() {
  const unlearnedIdx = words.value.findIndex(w => game.state.wordProgress[w.id]?.status !== 'learned')
  if (unlearnedIdx >= 0) currentIndex.value = unlearnedIdx
  else if (currentIndex.value < words.value.length - 1) currentIndex.value++
}

function prevWord() { if (currentIndex.value > 0) currentIndex.value-- }
function nextWord() { if (currentIndex.value < words.value.length - 1) currentIndex.value++ }

function saveHint() {
  if (currentWord.value && customHint.value.trim()) {
    game.saveCustomHint(currentWord.value.id, customHint.value.trim())
    customHint.value = ''
  }
}

function goToBoss() {
  showStory.value = false
  router.push('/boss/' + moduleInfo.value.bossId)
}

function goBack() { router.push('/adventure') }

onMounted(() => {
  game.updateStreak()
  game.setLastLearnPosition(moduleId)
  if (currentWord.value) {
    customHint.value = game.state.customMemoryHints[currentWord.value.id] || ''
  }
})

watch(currentIndex, () => {
  if (currentWord.value) {
    customHint.value = game.state.customMemoryHints[currentWord.value.id] || ''
  }
})
</script>

<style scoped>
.learn-page { min-height: 100vh; background: linear-gradient(180deg, #0f172a, #1e293b); padding-bottom: max(16px, env(safe-area-inset-bottom)); }

.learn-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
.back-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 8px; font-family: inherit; }
.header-info { text-align: center; flex: 1; }
.module-title { font-size: 18px; font-weight: 900; color: #fbbf24; margin: 0; }
.module-sub { font-size: 12px; color: #64748b; margin: 2px 0 0; }
.progress-text { font-size: 14px; font-weight: 700; color: #e2e8f0; }

.progress-track { height: 4px; background: rgba(255,255,255,0.08); margin: 0 16px 16px; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 2px; transition: width 0.4s ease; }

.word-card { margin: 0 16px; background: rgba(30, 41, 59, 0.8); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); animation: cardEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes cardEnter {
  from { opacity: 0; transform: translateX(30px) scale(0.96); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes cardLeave {
  from { opacity: 1; transform: translateX(0) scale(1); }
  to { opacity: 0; transform: translateX(-30px) scale(0.96); }
}

.image-area { padding: 28px 20px; text-align: center; color: white; position: relative; overflow: hidden; }
.word-emoji { font-size: 72px; display: block; margin-bottom: 8px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)); animation: emojiBounce 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes emojiBounce {
  0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
  60% { transform: scale(1.1) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.image-desc { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.4; max-width: 280px; margin: 0 auto; }

.word-display { text-align: center; padding: 20px 16px 16px; }
.the-word { font-size: 32px; font-weight: 900; color: #f1f5f9; margin: 0; }
.phonetic { font-size: 16px; color: #94a3b8; display: block; margin: 4px 0 12px; }
.speak-btn { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; padding: 8px 20px; border-radius: 16px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease; }
.speak-btn:active { transform: scale(0.97); background: rgba(245, 158, 11, 0.25); }
.speak-btn.small { font-size: 12px; padding: 4px 12px; margin-top: 8px; }

.meaning-box, .tip-box, .sentence-box { margin: 0 16px; padding: 14px 16px; background: rgba(255,255,255,0.04); border-radius: 16px; margin-top: 12px; }
.meaning-label, .tip-label, .sentence-label, .custom-label { font-size: 12px; font-weight: 700; color: #64748b; display: block; margin-bottom: 6px; }
.meaning-text { font-size: 20px; font-weight: 800; color: #f1f5f9; }
.tip-text, .sentence-text { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0; }

.custom-box { margin: 12px 16px 0; padding: 14px 16px; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; }
.custom-label { color: #a78bfa !important; }
.custom-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 10px 12px; color: #e2e8f0; font-size: 14px; resize: none; outline: none; font-family: inherit; margin-top: 8px; box-sizing: border-box; }
.custom-input:focus { border-color: rgba(139, 92, 246, 0.5); }
.custom-input::placeholder { color: #475569; }
.save-hint-btn { margin-top: 8px; background: rgba(139, 92, 246, 0.2); border: none; color: #a78bfa; padding: 6px 16px; border-radius: 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease; }
.save-hint-btn:active { transform: scale(0.97); }

.nav-buttons { display: flex; gap: 12px; padding: 20px 16px; }
.nav-btn { flex: 1; padding: 14px 8px; border-radius: 16px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; font-family: inherit; transition: all 0.15s ease; }
.nav-btn:active { transform: scale(0.97); }
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.nav-btn.prev { background: rgba(255,255,255,0.06); color: #94a3b8; }
.nav-btn.learn { background: linear-gradient(135deg, #34d399, #10b981); color: #022c22; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
.nav-btn.learn:active { box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2); }
.nav-btn.learn.learned { background: rgba(52, 211, 153, 0.15); color: #34d399; box-shadow: none; }
.nav-btn.next { background: rgba(255,255,255,0.06); color: #94a3b8; text-align: right; }

.story-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 24px; backdrop-filter: blur(8px); }
.story-card { width: 100%; max-width: 360px; max-height: 80vh; overflow-y: auto; background: linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98)); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 24px; text-align: center; animation: storyPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
@keyframes storyPop {
  from { opacity: 0; transform: scale(0.8) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.story-title { font-size: 20px; font-weight: 800; color: #fbbf24; margin: 0 0 16px; }
.story-content { text-align: left; margin-bottom: 20px; }
.story-content p { font-size: 14px; color: #cbd5e1; line-height: 1.7; margin: 0 0 12px; }
.story-btn { display: block; width: 100%; padding: 14px; border: none; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #0f172a; margin-bottom: 10px; transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); }
.story-btn:active { transform: scale(0.96); box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2); }
.story-btn.secondary { background: rgba(255,255,255,0.08); color: #94a3b8; box-shadow: none; }
</style>
