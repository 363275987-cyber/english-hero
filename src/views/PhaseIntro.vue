<template>
  <div class="intro-page" :class="themeClass">
    <!-- 场景背景装饰 -->
    <div class="scene-bg" :class="{ expanded: sceneExpanded }">
      <div class="scene-overlay"></div>
      <div class="scene-emoji-top">{{ theme.emoji }}</div>
      <div class="scene-emoji-float scene-emoji-float-1">{{ theme.emoji }}</div>
      <div class="scene-emoji-float scene-emoji-float-2">{{ theme.emoji }}</div>
    </div>

    <!-- 粒子/装饰层 -->
    <div class="particles" v-if="sceneExpanded">
      <span v-for="i in 12" :key="i" class="particle" :style="particleStyle(i)"></span>
    </div>

    <!-- Dodo 精灵 -->
    <div class="dodo-container" :class="{ entered: dodoEntered }">
      <div class="dodo-bubble" v-if="showBubble">
        <p class="bubble-text">{{ displayText }}<span class="cursor-blink">|</span></p>
      </div>
      <div class="dodo-emoji">🦜</div>
    </div>

    <!-- 按钮区域 -->
    <div class="actions-area" :class="{ visible: showButtons }">
      <button class="btn-explore" @click="goExplore">
        🔍 开始探索
      </button>
      <button class="btn-preview" @click="showPreview = true">
        📋 看看要学什么
      </button>
    </div>

    <!-- 单词预览面板 -->
    <transition name="slide-up-fade">
      <div v-if="showPreview" class="preview-panel">
        <div class="preview-header">
          <span class="preview-title">📖 {{ theme.name }} 单词列表</span>
          <button class="preview-close" @click="showPreview = false">✕</button>
        </div>
        <div class="preview-scroll">
          <div class="word-card" v-for="word in words" :key="word.id" :class="{ learned: isLearned(word) }">
            <span class="word-emoji">{{ theme.emoji }}</span>
            <div class="word-info">
              <span class="word-en">{{ word.word }}</span>
              <span class="word-cn">{{ word.meaning }}</span>
            </div>
            <span v-if="isLearned(word)" class="word-check">✓</span>
          </div>
        </div>
        <button class="btn-start-learn" @click="goExplore">
          🚀 开始学习
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWordsByModule } from '../data/words'
import { useGameStore } from '../stores/game'
import { moduleContent } from '../data/content'

const route = useRoute()
const router = useRouter()
const game = useGameStore()

const moduleId = computed(() => parseInt(route.params.moduleId))

const moduleThemes = {
  1: { name: '职业小镇', bg: 'from-purple-900 via-red-900 to-purple-950', emoji: '🏘️' },
  2: { name: '电子迷宫', bg: 'from-blue-900 via-cyan-900 to-blue-950', emoji: '📡' },
  3: { name: '美食火山', bg: 'from-red-900 via-orange-800 to-red-950', emoji: '🌋' },
  4: { name: '黑暗厨房', bg: 'from-amber-900 via-red-800 to-orange-950', emoji: '👨‍🍳' },
  5: { name: '风之神殿', bg: 'from-teal-800 via-emerald-700 to-cyan-950', emoji: '🏔️' },
  6: { name: '最终城堡', bg: 'from-red-950 via-gray-900 to-black', emoji: '🏰' },
}

const theme = computed(() => moduleThemes[moduleId.value] || moduleThemes[1])
const themeClass = computed(() => `bg-gradient-to-b ${theme.value.bg}`)

const words = computed(() => getWordsByModule(moduleId.value))

// Animation states
const dodoEntered = ref(false)
const sceneExpanded = ref(false)
const showBubble = ref(false)
const displayText = ref('')
const showButtons = ref(false)
const showPreview = ref(false)

let typeTimer = null

function isLearned(word) {
  return game.state.wordProgress[word.id]?.status === 'learned'
}

function typeText(text, callback) {
  let i = 0
  displayText.value = ''
  showBubble.value = true
  typeTimer = setInterval(() => {
    if (i < text.length) {
      displayText.value += text[i]
      i++
    } else {
      clearInterval(typeTimer)
      typeTimer = null
      if (callback) callback()
    }
  }, 60)
}

function particleStyle(i) {
  const size = 4 + Math.random() * 8
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${4 + Math.random() * 6}s`,
  }
}

function goExplore() {
  router.push(`/explore/${moduleId.value}`)
}

onMounted(() => {
  // Timeline:
  // 0ms    → Dodo flies in
  // 800ms  → First speech starts
  // ~3000ms → First speech done, 1.5s pause
  // 4500ms → Scene expands
  // 6500ms → Second speech starts
  // ~9000ms → Buttons appear

  // Step 1: Dodo enters
  setTimeout(() => {
    dodoEntered.value = true
  }, 100)

  // Step 2: First speech
  setTimeout(() => {
    const name = moduleContent[moduleId.value]
      ? (moduleContent[moduleId.value]?.grammarPoint ? theme.value.name : theme.value.name)
      : theme.value.name
    typeText(`嘿！欢迎来到${theme.value.name}！`, () => {
      // Step 3: After first speech, expand scene
      setTimeout(() => {
        sceneExpanded.value = true

        // Step 4: Second speech after scene expand
        setTimeout(() => {
          const newCount = words.value.filter(w => !isLearned(w)).length
          typeText(`今天要学 ${newCount} 个新单词！准备好了吗？`, () => {
            // Step 5: Show buttons
            setTimeout(() => {
              showButtons.value = true
            }, 400)
          })
        }, 2000)
      }, 1500)
    })
  }, 900)
})

onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer)
})
</script>

<style scoped>
.intro-page {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
}

/* ===== Scene Background ===== */
.scene-bg {
  position: absolute;
  inset: 0;
  transition: all 2s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0.3;
}
.scene-bg.expanded {
  opacity: 1;
}
.scene-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 80%, transparent 0%, rgba(0,0,0,0.4) 100%);
}
.scene-emoji-top {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 80px;
  opacity: 0.15;
  filter: blur(2px);
  transition: all 2s cubic-bezier(0.22, 1, 0.36, 1);
}
.scene-bg.expanded .scene-emoji-top {
  top: 8%;
  opacity: 0.25;
  filter: blur(1px);
}
.scene-emoji-float {
  position: absolute;
  font-size: 32px;
  opacity: 0;
  transition: opacity 2s ease 1s;
}
.scene-bg.expanded .scene-emoji-float {
  opacity: 0.12;
}
.scene-emoji-float-1 {
  top: 30%;
  left: 10%;
  animation: floatSlow 6s ease-in-out infinite;
}
.scene-emoji-float-2 {
  bottom: 25%;
  right: 12%;
  animation: floatSlow 8s ease-in-out infinite 1s;
}

/* ===== Particles ===== */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.particle {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: rgba(251, 191, 36, 0.4);
  animation: particleRise linear infinite;
}
@keyframes particleRise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) scale(0.3);
    opacity: 0;
  }
}

/* ===== Dodo ===== */
.dodo-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  transform: translate(100vw, -100vh) scale(0.3);
  opacity: 0;
  transition: all 1s cubic-bezier(0.22, 1, 0.36, 1);
}
.dodo-container.entered {
  transform: translate(0, 0) scale(1);
  opacity: 1;
}

.dodo-emoji {
  font-size: 72px;
  line-height: 1;
  animation: dodoFloat 3s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.4));
}

@keyframes dodoFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(3deg); }
  75% { transform: translateY(5px) rotate(-2deg); }
}

/* ===== Speech Bubble ===== */
.dodo-bubble {
  max-width: 300px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  border-bottom-left-radius: 4px;
  position: relative;
  animation: bubbleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.bubble-text {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.6;
  margin: 0;
}

.cursor-blink {
  animation: blink 0.8s step-end infinite;
  color: #fbbf24;
  font-weight: 400;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ===== Buttons ===== */
.actions-area {
  position: absolute;
  bottom: 15%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}
.actions-area.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.btn-explore {
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 900;
  color: #1e293b;
  background: linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b);
  background-size: 200% 100%;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.3);
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  font-family: inherit;
  animation: shimmerGold 2s ease-in-out infinite;
}

@keyframes shimmerGold {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.btn-explore:active {
  transform: scale(0.95);
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.3);
}

.btn-preview {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  font-family: inherit;
}
.btn-preview:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.14);
}

/* ===== Preview Panel ===== */
.preview-panel {
  position: fixed;
  inset: 0;
  z-index: 210;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
}

.preview-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  padding-top: max(20px, env(safe-area-inset-top));
}

.preview-title {
  font-size: 18px;
  font-weight: 800;
  color: #f1f5f9;
}

.preview-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.preview-close:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.15);
}

.preview-scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  gap: 12px;
  padding: 0 20px 16px;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
}

.word-card {
  flex-shrink: 0;
  width: 160px;
  padding: 20px 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  scroll-snap-align: start;
  position: relative;
  transition: all 0.2s ease;
}
.word-card.learned {
  background: rgba(52, 211, 153, 0.1);
  border-color: rgba(52, 211, 153, 0.2);
}

.word-emoji {
  font-size: 36px;
  line-height: 1;
}

.word-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.word-en {
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
}

.word-cn {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.5);
}

.word-check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #34d399;
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
  border-radius: 50%;
}

.btn-start-learn {
  flex-shrink: 0;
  margin: 16px 20px;
  margin-bottom: max(16px, env(safe-area-inset-bottom));
  padding: 16px;
  font-size: 17px;
  font-weight: 800;
  color: #1e293b;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.35);
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  font-family: inherit;
}
.btn-start-learn:active {
  transform: scale(0.97);
}

/* ===== Transition ===== */
.slide-up-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-up-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-up-fade-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-fade-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ===== Float animation ===== */
@keyframes floatSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
</style>
