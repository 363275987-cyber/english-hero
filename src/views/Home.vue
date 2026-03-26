<template>
  <div class="home-page">
    <!-- IP角色问候区 -->
    <section class="greeting-section">
      <!-- 死亡指引横幅 -->
    <section v-if="game.state.recentlyDied" class="death-banner anim-slide-up">
      <div class="death-icon">💀</div>
      <div class="death-info">
        <p class="death-title">装备不够强！</p>
        <p class="death-hint">去学习新单词获得更强武器，然后回来复仇！</p>
      </div>
      <button class="death-dismiss" @click="game.respawn()">知道了</button>
    </section>

    <!-- 装备状态横幅（有武器时显示） -->
    <section v-else-if="game.getEquippedWeaponInfo() && !game.state.recentlyDied" class="equip-banner anim-slide-up">
      <div class="equip-weapon">
        <span class="equip-emoji">{{ game.getEquippedWeaponInfo().emoji }}</span>
        <div class="equip-info">
          <span class="equip-name">{{ game.getEquippedWeaponInfo().word }}</span>
          <span class="equip-dur">耐久 {{ game.getEquippedWeaponInfo().currentDurability }}/{{ game.getEquippedWeaponInfo().maxDurability }}</span>
        </div>
      </div>
      <div class="equip-shield">
        <span class="equip-emoji">🛡️</span>
        <span class="equip-name">盾牌 ×{{ game.state.equippedShieldUses }}</span>
      </div>
      <button class="equip-btn" @click="$router.push('/weapons')">🎒 装备</button>
    </section>

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

.greeting-section { text-align: center; padding: 16px 0 4px; }
.newbie-banner { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08)); border: 1px solid rgba(245,158,11,0.2); border-radius: 16px; padding: 24px 16px; animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
.newbie-text { font-size: 20px; font-weight: 900; color: #fbbf24; margin: 0 0 8px; }
.newbie-hint { font-size: 14px; color: #cbd5e1; margin: 0; line-height: 1.5; }
.death-banner { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08)); border: 1px solid rgba(239,68,68,0.25); border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 12px; }
.death-icon { font-size: 36px; }
.death-info { flex: 1; }
.death-title { font-size: 16px; font-weight: 800; color: #f87171; margin: 0 0 4px; }
.death-hint { font-size: 12px; color: #fca5a5; margin: 0; }
.death-dismiss { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 6px 16px; color: #94a3b8; font-size: 13px; cursor: pointer; font-family: inherit; }
.equip-banner { background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.06)); border: 1px solid rgba(99,102,241,0.2); border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 12px; }
.equip-weapon, .equip-shield { display: flex; align-items: center; gap: 8px; flex: 1; }
.equip-emoji { font-size: 28px; }
.equip-name { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.equip-dur { font-size: 11px; color: #94a3b8; }
.equip-btn { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.25); border-radius: 12px; padding: 8px 16px; color: #a5b4fc; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
.fairy-avatar { font-size: 56px; line-height: 1; margin-bottom: 12px; filter: drop-shadow(0 0 16px rgba(52, 211, 153, 0.5)); animation: float 3s ease-in-out infinite; }
.greeting-text { font-size: 18px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
.greeting-sub { font-size: 13px; color: rgba(226, 232, 240, 0.6); }

/* 等级区 - 带呼吸光效 */
.level-section { padding: 16px; animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: 0.05s; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; }
.level-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.level-badge { font-size: 15px; font-weight: 700; color: #fbbf24; }
.level-xp-text { font-size: 13px; color: rgba(226, 232, 240, 0.6); }
.xp-bar-track { width: 100%; height: 10px; background: rgba(255, 255, 255, 0.08); border-radius: 5px; overflow: hidden; }
.xp-bar-fill { height: 100%; background: linear-gradient(90deg, #34d399, #6ee7b7); border-radius: 5px; transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 0 10px rgba(52, 211, 153, 0.4); position: relative; }
.xp-bar-fill::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 30px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3)); border-radius: 0 5px 5px 0; }
.level-hint { font-size: 12px; color: rgba(226, 232, 240, 0.45); margin-top: 6px; }
.level-hint strong { color: #34d399; }

/* 任务区 */
.tasks-section { animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: 0.1s; }
.task-list { display: flex; flex-direction: column; gap: 10px; }
.task-card { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; cursor: pointer; transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1); border-radius: 16px; }
.task-card:not(.completed):hover { background: rgba(30, 41, 59, 0.9); }
.task-card:active { transform: scale(0.97); }
.task-card.completed { opacity: 0.4; }
.task-left { display: flex; align-items: center; gap: 12px; }
.task-status { font-size: 20px; line-height: 1; transition: transform 0.3s ease; }
.task-card.completed .task-status { transform: scale(1.2); }
.task-info { display: flex; flex-direction: column; gap: 2px; }
.task-name { font-size: 14px; font-weight: 600; color: #e2e8f0; }
.task-progress { font-size: 12px; color: rgba(226, 232, 240, 0.5); }
.task-reward { font-size: 13px; font-weight: 600; color: #fbbf24; white-space: nowrap; }

/* 快捷入口 - 更有活力 */
.quick-section { animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: 0.15s; }
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quick-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 12px; border: none; border-radius: 16px; cursor: pointer; transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1); color: white; font-family: inherit; position: relative; overflow: hidden; }
.quick-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%); pointer-events: none; }
.quick-btn:active { transform: scale(0.95); }
.continue-btn { background: linear-gradient(135deg, #7c3aed, #a78bfa); box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35), 0 0 0 1px rgba(124, 58, 237, 0.3); grid-column: 1 / -1; }
.continue-btn:hover { box-shadow: 0 6px 25px rgba(124, 58, 237, 0.45), 0 0 0 1px rgba(124, 58, 237, 0.3); }
.review-btn { background: linear-gradient(135deg, #059669, #34d399); box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3), 0 0 0 1px rgba(5, 150, 105, 0.25); }
.weapon-btn { background: linear-gradient(135deg, #dc2626, #f87171); box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3), 0 0 0 1px rgba(220, 38, 38, 0.25); }
.quick-icon { font-size: 28px; line-height: 1; transition: transform 0.3s ease; }
.quick-btn:active .quick-icon { transform: scale(1.15) rotate(-5deg); }
.quick-label { font-size: 14px; font-weight: 700; }

/* 统计区 */
.stats-section { animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: 0.2s; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.stat-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px 8px; text-align: center; transition: transform 0.2s ease; }
.stat-card:active { transform: scale(0.97); }
.stat-icon { font-size: 24px; line-height: 1; }
.stat-value { font-size: 24px; font-weight: 900; color: #f1f5f9; letter-spacing: -0.5px; }
.stat-label { font-size: 11px; color: rgba(226, 232, 240, 0.5); }

/* 更多功能 */
.more-section { animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: 0.25s; }
.more-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.more-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1); color: white; font-family: inherit; }
.more-btn:active { transform: scale(0.93); background: rgba(255,255,255,0.08); }
.more-icon { font-size: 22px; transition: transform 0.3s ease; }
.more-btn:active .more-icon { transform: scale(1.2) rotate(10deg); }
.more-label { font-size: 11px; font-weight: 600; color: #94a3b8; }

/* 动画定义 */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>
