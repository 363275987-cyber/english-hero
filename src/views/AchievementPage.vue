<template>
  <div class="achieve-page">
    <div class="achieve-header">
      <button class="back-btn" @click="$router.push('/home')">← 返回</button>
      <h1 class="header-title">🏆 成就墙</h1>
      <span class="achieve-count">{{ game.achievementCount }}/{{ achievements.length }}</span>
    </div>

    <!-- Progress bar -->
    <div class="progress-section">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <p class="progress-text">已解锁 {{ progressPercent }}%</p>
    </div>

    <!-- Achievement list by category -->
    <div v-for="cat in categories" :key="cat.key" class="category-section">
      <h3 class="category-title">{{ cat.icon }} {{ cat.name }}</h3>
      <div class="achieve-grid">
        <div v-for="ach in getCategoryAchievements(cat.key)" :key="ach.id"
             class="achieve-card" :class="{ unlocked: ach.unlocked, locked: !ach.unlocked }">
          <div class="achieve-emoji">{{ ach.unlocked ? ach.emoji : '🔒' }}</div>
          <div class="achieve-info">
            <div class="achieve-name">{{ ach.name }}</div>
            <div class="achieve-desc">{{ ach.desc }}</div>
          </div>
          <div class="achieve-reward" v-if="ach.reward?.stars">
            +{{ ach.reward.stars }} ⭐
          </div>
          <div class="achieve-check" v-if="ach.unlocked">✅</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'

const router = useRouter()
const game = useGameStore()

const categories = [
  { key: 'learning', name: '学习里程碑', icon: '📚' },
  { key: 'streak', name: '坚持学习', icon: '🔥' },
  { key: 'stars', name: '星星收集', icon: '⭐' },
  { key: 'battle', name: 'Boss 战斗', icon: '⚔️' },
  { key: 'weapon', name: '武器升级', icon: '🗡️' },
  { key: 'special', name: '特殊成就', icon: '✨' },
]

const achievements = computed(() => game.getAllAchievements())

const progressPercent = computed(() => {
  if (achievements.value.length === 0) return 0
  return Math.round((game.achievementCount / achievements.value.length) * 100)
})

function getCategoryAchievements(catKey) {
  return achievements.value.filter(a => a.category === catKey)
}
</script>

<style scoped>
.achieve-page { min-height: 100vh; background: linear-gradient(180deg, #0f172a, #1e293b); padding-bottom: max(16px, env(safe-area-inset-bottom)); }

.achieve-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
.back-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 8px; font-family: inherit; }
.header-title { font-size: 18px; font-weight: 900; color: #fbbf24; margin: 0; }
.achieve-count { font-size: 14px; font-weight: 700; color: #e2e8f0; }

.progress-section { padding: 0 16px 16px; }
.progress-track { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b); border-radius: 4px; transition: width 0.6s; }
.progress-text { font-size: 12px; color: #94a3b8; text-align: center; margin: 0; }

.category-section { padding: 0 16px; margin-bottom: 20px; }
.category-title { font-size: 15px; font-weight: 700; color: #e2e8f0; margin: 0 0 10px; }

.achieve-grid { display: flex; flex-direction: column; gap: 8px; }

.achieve-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: rgba(30, 41, 59, 0.9); border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); transition: all 0.2s; }
.achieve-card.locked { opacity: 0.4; }

.achieve-emoji { font-size: 28px; flex-shrink: 0; }
.achieve-info { flex: 1; min-width: 0; }
.achieve-name { font-size: 14px; font-weight: 700; color: #f1f5f9; }
.achieve-desc { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.achieve-reward { font-size: 12px; font-weight: 600; color: #fbbf24; flex-shrink: 0; }
.achieve-check { font-size: 18px; flex-shrink: 0; }
</style>
