<template>
  <div class="grammar-page">
    <div class="grammar-header">
      <button class="back-btn" @click="$router.push('/home')">← 返回</button>
      <h1 class="header-title">📝 语法课堂</h1>
    </div>

    <!-- Module selector -->
    <div class="module-tabs">
      <button v-for="mod in modules" :key="mod.id"
              class="mod-tab" :class="{ active: selectedModule === mod.id }"
              @click="selectedModule = mod.id">
        {{ mod.emoji }} {{ mod.name }}
      </button>
    </div>

    <!-- Grammar point -->
    <div class="grammar-section card" v-if="currentContent">
      <h3 class="section-label">📐 语法要点</h3>
      <div class="grammar-text" v-html="formatGrammar(currentContent.grammarPoint)"></div>
    </div>

    <!-- Dialogues -->
    <div class="dialogue-section" v-if="currentContent">
      <h3 class="section-label">💬 情景对话</h3>
      <div v-for="(dlg, idx) in currentContent.dialogues" :key="idx" class="dialogue-card card">
        <div class="dialogue-title">{{ dlg.title }}</div>
        <div class="dialogue-lines">
          <div v-for="(line, li) in dlg.lines" :key="li"
               class="dialogue-line" :class="line.startsWith('S1') ? 's1' : 's2'"
               @click="speakLine(line)">
            <span class="speaker">{{ line.startsWith('S1') ? '👦' : '👧' }}</span>
            <div class="line-content">
              <span class="english">{{ getEnglish(line) }}</span>
              <span class="chinese" v-if="showTranslation">{{ getChinese(line) }}</span>
            </div>
            <span class="speak-icon">🔊</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chant -->
    <div class="chant-section card" v-if="currentContent?.chant">
      <h3 class="section-label">🎵 歌谣</h3>
      <div class="chant-text">
        <div class="chant-english">{{ getChantEnglish(currentContent.chant) }}</div>
        <div class="chant-chinese">{{ getChantChinese(currentContent.chant) }}</div>
      </div>
      <button class="chant-btn" @click="speakChant">🎵 朗读歌谣</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { moduleContent } from '../data/content'

const router = useRouter()
const game = useGameStore()
const selectedModule = ref(1)
const showTranslation = ref(true)

const modules = [
  { id: 1, name: '职业', emoji: '👷' },
  { id: 2, name: '电子时代', emoji: '💻' },
  { id: 3, name: '健康饮食', emoji: '🥗' },
  { id: 4, name: '国际美食', emoji: '🍕' },
  { id: 5, name: '自然奇观', emoji: '🌿' },
  { id: 6, name: '保护地球', emoji: '🌍' },
]

const currentContent = computed(() => moduleContent[selectedModule.value])

function formatGrammar(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/⚠️/g, '<span class="warn">⚠️</span>')
}

function getEnglish(line) {
  const match = line.match(/S[12]:\s*(.+?)(?:（|$)/)
  return match ? match[1].trim() : line
}

function getChinese(line) {
  const match = line.match(/（(.+?)）/)
  return match ? match[1] : ''
}

function speakLine(line) {
  const text = getEnglish(line)
  if (!text || !('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text.replace(/'/g, "'"))
  u.lang = 'en-US'; u.rate = 0.7
  speechSynthesis.speak(u)
}

function getChantEnglish(chant) {
  if (!chant) return ''
  const lines = chant.split('\n')
  const engLines = []
  for (const line of lines) {
    if (line.startsWith('（')) break
    if (line.trim()) engLines.push(line.trim())
  }
  return engLines.join('\n')
}

function getChantChinese(chant) {
  if (!chant) return ''
  const match = chant.match(/（([\s\S]+?)）$/)
  return match ? match[1] : ''
}

function speakChant() {
  if (!currentContent.value?.chant || !('speechSynthesis' in window)) return
  const text = getChantEnglish(currentContent.value.chant)
  const lines = text.split('\n').filter(l => !l.startsWith('::') && l.trim())
  let i = 0
  function speakNext() {
    if (i >= lines.length) return
    const u = new SpeechSynthesisUtterance(lines[i])
    u.lang = 'en-US'; u.rate = 0.8
    u.onend = () => { i++; setTimeout(speakNext, 300) }
    speechSynthesis.speak(u)
  }
  speakNext()
}
</script>

<style scoped>
.grammar-page { min-height: 100vh; background: linear-gradient(180deg, #0f172a, #1e293b); padding-bottom: 40px; }

.grammar-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
.back-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 8px; font-family: inherit; }
.header-title { font-size: 18px; font-weight: 900; color: #fbbf24; margin: 0; }

.module-tabs { display: flex; gap: 6px; padding: 0 16px 16px; overflow-x: auto; }
.mod-tab { padding: 8px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all 0.2s; }
.mod-tab.active { background: rgba(251, 191, 36, 0.2); border-color: #fbbf24; color: #fbbf24; }

.card { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; margin: 0 16px 12px; }

.section-label { font-size: 15px; font-weight: 700; color: #e2e8f0; margin: 0 0 12px; }

.grammar-section { }
.grammar-text { font-size: 14px; color: #cbd5e1; line-height: 1.8; }
.grammar-text strong { color: #fbbf24; }
.grammar-text .warn { color: #f87171; }

.dialogue-section { padding: 0; }
.dialogue-card { padding: 14px; }
.dialogue-title { font-size: 14px; font-weight: 700; color: #fbbf24; margin-bottom: 10px; }
.dialogue-lines { display: flex; flex-direction: column; gap: 8px; }
.dialogue-line { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
.dialogue-line:active { background: rgba(255,255,255,0.05); }
.dialogue-line.s1 { background: rgba(59, 130, 246, 0.08); }
.dialogue-line.s2 { background: rgba(52, 211, 153, 0.08); }
.speaker { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.line-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.line-content .english { font-size: 14px; font-weight: 600; color: #e2e8f0; }
.line-content .chinese { font-size: 12px; color: #94a3b8; }
.speak-icon { font-size: 12px; flex-shrink: 0; margin-top: 2px; opacity: 0.5; }

.chant-section { }
.chant-text { margin-bottom: 12px; }
.chant-english { font-size: 14px; font-weight: 600; color: #e2e8f0; line-height: 1.8; white-space: pre-line; margin-bottom: 8px; }
.chant-chinese { font-size: 13px; color: #94a3b8; line-height: 1.6; }
.chant-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.chant-btn:active { transform: scale(0.97); }
</style>
