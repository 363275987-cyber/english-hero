<template>
  <div class="home-page">
    <!-- IP角色问候区 -->
    <section class="greeting-section">
      <!-- 新手引导横幅 -->
      <div v-if="game.state.totalWordsLearned === 0 && game.state.totalBossDefeated === 0" class="newbie-banner">
        <p class="newbie-text">👋 欢迎来到燃学英语！</p>
        <p class="newbie-hint">点击下方「冒险地图」开始你的第一个冒险</p>
      </div>
      <div v-else>
        <div class="fairy-avatar animate-float">🧚</div>
        <h1 class="greeting-text">{{ greetingText }}</h1>
        <p class="greeting-sub">{{ game.state.playerName }}，今天也要加油哦 ✨</p>
      </div>
    </section>

    <!-- 等级进度条 -->
    <section class="level-section card">
      <div class="level-header">
        <span class="level-badge">🎖️ Lv.{{ game.state.level }} {{ game.levelInfo.title }}</span>
        <span class="level-xp-text">⭐ {{ game.state.totalStars }} / {{ nextLevelStars }} XP</span>
      </div>
      <div class="xp-bar-track">
        <div class="xp-bar-fill" :style="{ width: xpPercent + '%' }"></div>
      </div>
      <p class="level-hint">距下一级还需 <strong>{{ game.levelInfo.expToNext }}</strong> ⭐</p>
    </section>

    <!-- 今日任务卡片 -->
    <section class="tasks-section">
      <h2 class="section-title">📋 今日任务</h2>
      <div class="task-list">
        <div v-for="(task, idx) in dailyTasks" :key="idx"
             class="task-card card" :class="{ completed: task.done }"
             @click="task.route ? $router.push(task.route) : null">
          <div class="task-left">
            <span class="task-status">{{ task.done ? '✅' : '⬜' }}</span>
            <div class="task-info">
              <span class="task-name">{{ task.name }}</span>
              <span class="task-progress">{{ task.progress }} / {{ task.goal }}</span>
            </div>
          </div>
          <div class="task-reward">+{{ task.reward }} ⭐</div>
        </div>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="quick-section">
      <h2 class="section-title">⚡ 快捷入口</h2>
      <div class="quick-grid">
        <button class="quick-btn continue-btn" @click="$router.push('/adventure')">
          <span class="quick-icon">⚔️</span>
          <span class="quick-label">冒险地图</span>
        </button>
        <button class="quick-btn weapon-btn" @click="$router.push(lastLearnRoute)">
          <span class="quick-icon">📚</span>
          <span class="quick-label">继续学习</span>
        </button>
        <button v-if="game.reviewCount > 0" class="quick-btn review-btn" @click="$router.push('/review')">
          <span class="quick-icon">🔄</span>
          <span class="quick-label">复习 ({{ game.reviewCount }})</span>
        </button>
        <button class="quick-btn weapon-btn" @click="$router.push('/weapons')">
          <span class="quick-icon">🗡️</span>
          <span class="quick-label">武器库 ({{ game.weaponStats.total }})</span>
        </button>
      </div>
    </section>

    <!-- 学习统计小卡片 -->
    <section class="stats-section">
      <h2 class="section-title">📊 学习统计</h2>
      <div class="stats-grid">
        <div class="stat-card card">
          <span class="stat-icon">🔥</span>
          <span class="stat-value">{{ game.state.streak }}</span>
          <span class="stat-label">连续天数</span>
        </div>
        <div class="stat-card card">
          <span class="stat-icon">📚</span>
          <span class="stat-value">{{ game.state.totalWordsLearned }}</span>
          <span class="stat-label">掌握单词</span>
        </div>
        <div class="stat-card card">
          <span class="stat-icon">🎯</span>
          <span class="stat-value">{{ game.correctRate }}%</span>
          <span class="stat-label">正确率</span>
        </div>
      </div>
    </section>

    <!-- 更多功能 -->
    <section class="more-section">
      <h2 class="section-title">🔍 更多</h2>
      <div class="more-grid">
        <button class="more-btn" @click="$router.push('/grammar')">
          <span class="more-icon">📝</span>
          <span class="more-label">语法课堂</span>
        </button>
        <button class="more-btn" @click="$router.push('/achievements')">
          <span class="more-icon">🏆</span>
          <span class="more-label">成就墙</span>
        </button>
        <button class="more-btn" @click="$router.push('/gifts')">
          <span class="more-icon">🎁</span>
          <span class="more-label">礼物兑换</span>
        </button>
        <button class="more-btn" @click="$router.push('/assessment')">
          <span class="more-icon">🎯</span>
          <span class="more-label">基础测试</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'

const router = useRouter()
const game = useGameStore()

const lastLearnRoute = computed(() => {
  const m = game.getLastLearnPosition()
  return m ? `/learn/${m}` : '/learn/1'
})

const nextLevelStars = computed(() => {
  const titles = [
    { starsNeeded: 100 }, { starsNeeded: 300 }, { starsNeeded: 600 },
    { starsNeeded: 1000 }, { starsNeeded: 2000 }
  ]
  const next = titles.find(t => t.starsNeeded > game.state.totalStars)
  return next ? next.starsNeeded : 'MAX'
})

const xpPercent = computed(() => {
  const levels = [0, 100, 300, 600, 1000, 2000]
  const current = levels.filter(s => s <= game.state.totalStars).pop()
  const next = levels.find(s => s > game.state.totalStars)
  if (!next) return 100
  return Math.round(((game.state.totalStars - current) / (next - current)) * 100)
})

const dailyTasks = computed(() => [
  { name: '击败1个Boss', progress: Math.min(game.state.totalBossDefeated, 1), goal: 1, reward: 10, done: game.state.totalBossDefeated >= 1, route: '/adventure' },
  { name: '答对5题', progress: Math.min(game.state.totalCorrect, 5), goal: 5, reward: 15, done: game.state.totalCorrect >= 5, route: '/adventure' },
  { name: '获得20星星', progress: Math.min(game.state.todayStarsEarned, 20), goal: 20, reward: 20, done: game.state.todayStarsEarned >= 20, route: '/adventure' },
])

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return '早上好！新的一天 ☀️'
  if (h >= 12 && h < 14) return '中午好～继续冒险吧 🌤️'
  if (h >= 14 && h < 18) return '下午好！冒险进行中 ⚔️'
  return '晚上好！辛苦了 🌙'
})
</script>

<style scoped>
.home-page {
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
}

.section-title { font-size: 16px; font-weight: 700; color: #e2e8f0; margin-bottom: 12px; }

.greeting-section { text-align: center; padding: 20px 0 8px; }
.newbie-banner { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08)); border: 1px solid rgba(245,158,11,0.2); border-radius: 16px; padding: 20px 16px; }
.newbie-text { font-size: 18px; font-weight: 800; color: #fbbf24; margin: 0 0 6px; }
.newbie-hint { font-size: 14px; color: #cbd5e1; margin: 0; }
.fairy-avatar { font-size: 56px; line-height: 1; margin-bottom: 12px; filter: drop-shadow(0 0 16px rgba(52, 211, 153, 0.5)); }
.greeting-text { font-size: 18px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
.greeting-sub { font-size: 13px; color: rgba(226, 232, 240, 0.6); }

.level-section { padding: 16px; }
.level-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.level-badge { font-size: 15px; font-weight: 700; color: #fbbf24; }
.level-xp-text { font-size: 13px; color: rgba(226, 232, 240, 0.6); }
.xp-bar-track { width: 100%; height: 10px; background: rgba(255, 255, 255, 0.08); border-radius: 5px; overflow: hidden; }
.xp-bar-fill { height: 100%; background: linear-gradient(90deg, #34d399, #6ee7b7); border-radius: 5px; transition: width 0.6s ease; box-shadow: 0 0 8px rgba(52, 211, 153, 0.4); }
.level-hint { font-size: 12px; color: rgba(226, 232, 240, 0.45); margin-top: 6px; }
.level-hint strong { color: #34d399; }

.task-list { display: flex; flex-direction: column; gap: 10px; }
.task-card { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; cursor: pointer; transition: all 0.2s ease; }
.task-card:active { transform: scale(0.97); background: rgba(30, 41, 59, 0.95); }
.task-card.completed { opacity: 0.5; }
.task-left { display: flex; align-items: center; gap: 12px; }
.task-status { font-size: 20px; line-height: 1; }
.task-info { display: flex; flex-direction: column; gap: 2px; }
.task-name { font-size: 14px; font-weight: 600; color: #e2e8f0; }
.task-progress { font-size: 12px; color: rgba(226, 232, 240, 0.5); }
.task-reward { font-size: 13px; font-weight: 600; color: #fbbf24; white-space: nowrap; }

.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quick-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 12px; border: none; border-radius: 16px; cursor: pointer; transition: all 0.2s ease; color: white; font-family: inherit; }
.quick-btn:active { transform: scale(0.97); }
.continue-btn { background: linear-gradient(135deg, #1a73e8, #60a5fa); box-shadow: 0 4px 16px rgba(26, 115, 232, 0.3); grid-column: 1 / -1; }
.weapon-btn { background: linear-gradient(135deg, #ef4444, #f87171); box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25); }
.quick-icon { font-size: 28px; line-height: 1; }
.quick-label { font-size: 14px; font-weight: 700; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.stat-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; text-align: center; }
.stat-icon { font-size: 24px; line-height: 1; }
.stat-value { font-size: 22px; font-weight: 900; color: #f1f5f9; }
.stat-label { font-size: 11px; color: rgba(226, 232, 240, 0.5); }

.more-section { }
.more-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.more-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.15s ease; color: white; font-family: inherit; }
.more-btn:active { transform: scale(0.97); }
.more-icon { font-size: 22px; }
.more-label { font-size: 11px; font-weight: 600; color: #94a3b8; }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.animate-float { animation: float 3s ease-in-out infinite; }
</style>
