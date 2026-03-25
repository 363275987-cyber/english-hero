<template>
  <div class="min-h-screen bg-gradient-to-b from-zelda-darker via-slate-900 to-zelda-darker pb-24">
    <!-- Header -->
    <div class="px-4 pt-4 pb-3">
      <h1 class="text-xl font-black text-center">
        <span class="text-amber-400">⚔️</span> 冒险地图
      </h1>
      <p class="text-center text-xs text-white/40 mt-1">击败Boss，拯救英语世界！</p>
    </div>

    <!-- Map Path -->
    <div class="px-4 space-y-4">
      <div v-for="(mod, idx) in modules" :key="mod.id"
           class="relative">
        <!-- Connecting line -->
        <div v-if="idx > 0" class="flex justify-center">
          <div class="w-0.5 h-8" :class="isDefeated(modules[idx-1].bossId) ? 'bg-amber-500/50' : 'bg-white/10'"></div>
        </div>

        <!-- Module Card -->
        <button @click="openBoss(mod.bossId, mod.module)"
                class="w-full card-dark transition-all active:scale-[0.97]"
                :class="isUnlocked(idx) ? 'border-amber-500/40' : 'border-white/5 opacity-50'">

          <div class="flex items-center gap-3">
            <!-- Boss Avatar -->
            <div class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                 :class="mod.unlocked ? 'bg-gradient-to-br ' + mod.color + ' glow-gold' : 'bg-white/5'">
              {{ mod.emoji }}
            </div>

            <!-- Info -->
            <div class="flex-1 text-left">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm">{{ mod.name }}</span>
                <span v-if="isDefeated(mod.bossId)" class="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">✓ 已通关</span>
                <span v-else-if="allWordsLearned(mod.module)" class="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">📚 可挑战</span>
                <span v-else class="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">📖 未学习</span>
              </div>
              <p class="text-xs text-white/50 mt-0.5">{{ mod.nameEn }}</p>
              <div class="flex items-center gap-3 mt-1 text-xs text-white/40">
                <span>📚 {{ mod.wordCount }}词</span>
                <span>❤️ {{ mod.hp }} HP</span>
                <span>⭐ {{ mod.stars }}</span>
                <span v-if="isPartiallyDefeated(mod.bossId)" class="text-amber-400">⚔️ 战斗中</span>
              </div>
            </div>

            <!-- Arrow -->
            <span v-if="isUnlocked(idx)" class="text-white/30 text-lg">›</span>
            <span v-else class="text-sm">🔒</span>
          </div>

          <!-- Mini Bosses -->
          <div v-if="isUnlocked(idx) && mod.miniBosses.length" class="mt-3 pt-3 border-t border-white/5">
            <div class="flex gap-2">
              <button v-for="mini in mod.miniBosses" :key="mini.id"
                      @click.stop="openBoss(mini.id, mod.module)"
                      class="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 text-xs border border-white/5 active:scale-[0.97] transition-transform"
                      :class="isDefeated(mini.id) ? 'opacity-50' : ''">
                <span>{{ mini.emoji }}</span>
                <span>{{ mini.name }}</span>
                <span v-if="isDefeated(mini.id)" class="text-emerald-400">✓</span>
              </button>
            </div>
          </div>

          <!-- Module Words Preview -->
          <div v-if="isUnlocked(idx)" class="mt-3 pt-3 border-t border-white/5">
            <p class="text-xs text-white/30 mb-1.5">本模块单词预览：</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="word in mod.previewWords" :key="word.id"
                    class="text-xs bg-white/5 px-2 py-0.5 rounded-full text-white/60">
                {{ word.word }}
              </span>
              <span v-if="mod.wordCount > mod.previewWords.length" class="text-xs text-white/30 px-2 py-0.5">
                +{{ mod.wordCount - mod.previewWords.length }}词
              </span>
            </div>
          </div>

          <!-- Pulse animation for current module -->
          <div v-if="isCurrent(idx)" class="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
        </button>
      </div>
    </div>

    <!-- Progress -->
    <div class="fixed bottom-16 left-0 right-0 px-4 py-2 pb-[max(8px,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur border-t border-white/5">
      <div class="flex items-center justify-between text-xs text-white/50">
        <span>进度：{{ game.state.totalBossDefeated }} / {{ totalBosses }} Boss</span>
        <span>🔥 连续 {{ game.state.streak }} 天</span>
      </div>
      <div class="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
             :style="{ width: (game.state.totalBossDefeated / totalBosses * 100) + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { allBosses } from '../data/bosses'
import { getWordsByModule } from '../data/words'

const router = useRouter()
const game = useGameStore()

const modules = [
  { id: 'm1', module: 1, name: '职业迷宫', nameEn: "Jobs Labyrinth", bossId: 'm1_boss', emoji: '👹', color: 'from-purple-700 to-red-800', hp: 30, wordCount: 16, stars: 100, unlocked: true,
    miniBosses: [{ id: 'm1_mini1', name: '职业小怪', emoji: '👻' }, { id: 'm1_mini2', name: '迷路学徒', emoji: '🐸' }] },
  { id: 'm2', module: 2, name: '电子迷宫', nameEn: "E-age Maze", bossId: 'm2_boss', emoji: '🤖', color: 'from-blue-700 to-cyan-800', hp: 40, wordCount: 15, stars: 150,
    miniBosses: [{ id: 'm2_mini1', name: '断线精灵', emoji: '📡' }, { id: 'm2_mini2', name: '病毒小虫', emoji: '🐛' }] },
  { id: 'm3', module: 3, name: '美食火山', nameEn: "Food Volcano", bossId: 'm3_boss', emoji: '🍔', color: 'from-red-700 to-orange-800', hp: 50, wordCount: 20, stars: 200,
    miniBosses: [{ id: 'm3_mini1', name: '糖果怪', emoji: '🍭' }, { id: 'm3_mini2', name: '薯条骑士', emoji: '🍟' }] },
  { id: 'm4', module: 4, name: '黑暗厨房', nameEn: "Dark Kitchen", bossId: 'm4_boss', emoji: '👨‍🍳', color: 'from-orange-700 to-red-800', hp: 50, wordCount: 20, stars: 200,
    miniBosses: [{ id: 'm4_mini1', name: '意大利面怪', emoji: '🍝' }, { id: 'm4_mini2', name: '寿司忍者', emoji: '🍣' }] },
  { id: 'm5', module: 5, name: '风之神殿', nameEn: "Wind Temple", bossId: 'm5_boss', emoji: '🌪️', color: 'from-teal-700 to-emerald-800', hp: 60, wordCount: 20, stars: 250,
    miniBosses: [{ id: 'm5_mini1', name: '野营小熊', emoji: '🐻' }, { id: 'm5_mini2', name: '迷路蝴蝶', emoji: '🦋' }] },
  { id: 'm6', module: 6, name: '最终城堡', nameEn: "Final Castle", bossId: 'm6_boss', emoji: '💀', color: 'from-red-950 to-gray-900', hp: 80, wordCount: 15, stars: 500,
    miniBosses: [{ id: 'm6_mini1', name: '塑料怪', emoji: '🥤' }, { id: 'm6_mini2', name: '烟雾精灵', emoji: '💨' }] },
]

// Add preview words and unlock logic
modules.forEach((mod, idx) => {
  mod.previewWords = getWordsByModule(mod.module).slice(0, 4)
  mod.unlocked = idx === 0 || isUnlocked(idx)
})

const totalBosses = computed(() => Object.keys(allBosses).length)

function isUnlocked(idx) {
  if (idx === 0) return true
  return isDefeated(modules[idx - 1].bossId)
}

function isCurrent(idx) {
  return isUnlocked(idx) && !isDefeated(modules[idx].bossId)
}

function isDefeated(bossId) {
  return game.state.defeatedBosses.includes(bossId)
}

function isPartiallyDefeated(bossId) {
  const savedHp = game.getBossHp(bossId)
  return savedHp !== null && savedHp > 0 && !isDefeated(bossId)
}

function allWordsLearned(moduleId) {
  const words = getWordsByModule(moduleId)
  return words.length > 0 && words.every(w => game.state.wordProgress[w.id]?.status === 'learned')
}

function openBoss(bossId, moduleId) {
  // 检查是否已学完该模块单词
  const moduleWords = getWordsByModule(moduleId)
  const learnedCount = moduleWords.filter(w => game.state.wordProgress[w.id]?.status === 'learned').length
  if (learnedCount < moduleWords.length) {
    router.push(`/learn/${moduleId}`)
    return
  }
  router.push(`/boss/${bossId}`)
}
</script>
