<template>
  <div class="profile-page">
    <!-- 头像区 -->
    <section class="avatar-section">
      <div class="avatar-ring">
        <span class="avatar-emoji">🧝‍♀️</span>
      </div>
      <h1 class="nickname">{{ game.state.playerName }}</h1>
      <span class="title-badge">🎖️ Lv.{{ game.state.level }} {{ game.levelInfo.title }}</span>
    </section>

    <!-- 数据统计 -->
    <section class="data-section card">
      <h2 class="section-title">📊 学习数据</h2>
      <div class="data-grid">
        <div class="data-item">
          <span class="data-value">{{ game.state.totalPlayDays }}</span>
          <span class="data-label">总学习天数</span>
        </div>
        <div class="data-item">
          <span class="data-value">{{ game.state.streak }}</span>
          <span class="data-label">连续天数 🔥</span>
        </div>
        <div class="data-item">
          <span class="data-value">{{ game.state.totalStars }}</span>
          <span class="data-label">总星星 ⭐</span>
        </div>
        <div class="data-item">
          <span class="data-value">{{ game.state.totalWordsLearned }}</span>
          <span class="data-label">掌握单词 📚</span>
        </div>
        <div class="data-item">
          <span class="data-value">{{ game.correctRate }}%</span>
          <span class="data-label">正确率 🎯</span>
        </div>
        <div class="data-item">
          <span class="data-value">{{ game.state.totalBossDefeated }}</span>
          <span class="data-label">Boss击败 👾</span>
        </div>
      </div>
    </section>

    <!-- 装备展示 -->
    <section class="equip-section card">
      <h2 class="section-title">🗡️ 当前装备</h2>
      <div class="equip-weapon">
        <span class="equip-emoji">{{ weaponInfo.emoji }}</span>
        <div class="equip-info">
          <span class="equip-name">{{ weaponInfo.name }}</span>
          <span class="equip-attack">⚔️ 攻击力 {{ weaponInfo.damage }}</span>
        </div>
      </div>

      <div class="backpack-title">🎒 消耗品背包</div>
      <div class="backpack-grid">
        <div v-for="item in backpackItems" :key="item.id" class="backpack-item">
          <span class="bp-emoji">{{ item.emoji }}</span>
          <span class="bp-count" v-if="item.count > 0">×{{ item.count }}</span>
          <span class="bp-name">{{ item.name }}</span>
        </div>
      </div>
    </section>

    <!-- 功能入口 -->
    <section class="menu-section card">
      <h2 class="section-title">🧭 功能</h2>
      <div class="menu-list">
        <button class="menu-item" @click="exportSave">
          <span class="menu-icon">💾</span>
          <span class="menu-label">导出存档码</span>
          <span class="menu-arrow">›</span>
        </button>
        <button class="menu-item" @click="logout">
          <span class="menu-icon">🚪</span>
          <span class="menu-label">退出登录</span>
          <span class="menu-arrow">›</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { weaponTypes, itemTypes } from '../data/weapons'

const game = useGameStore()

const weaponInfo = computed(() => weaponTypes[game.state.equippedWeapon] || weaponTypes.knightSword)

const backpackItems = computed(() => {
  const items = game.state.items || {}
  return Object.entries(itemTypes).map(([id, info]) => ({
    id, ...info, count: items[id] || 0
  })).filter(i => i.count > 0)
})

function exportSave() {
  const raw = localStorage.getItem('english-hero-game') || '{}'
  const payload = JSON.stringify({ _type: 'english-hero-save', data: JSON.parse(raw) })
  const code = btoa(unescape(encodeURIComponent(payload)))
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      alert('✅ 存档码已复制到剪贴板！\n\n换设备时：\n1. 打开App → 输入PIN → 点"有存档码？"\n2. 粘贴存档码 → 导入')
    }).catch(() => fallbackCopy(code))
  } else {
    fallbackCopy(code)
  }
}

function fallbackCopy(code) {
  const el = document.createElement('textarea')
  el.value = code; document.body.appendChild(el); el.select()
  document.execCommand('copy'); document.body.removeChild(el)
  alert('✅ 存档码已复制！换设备时粘贴导入即可')
}

function logout() {
  if (confirm('确定退出登录？本地数据会保留。')) {
    game.logout()
  }
}
</script>

<style scoped>
.profile-page { padding: 16px; padding-bottom: max(16px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 16px; }
.card { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 16px; }
.section-title { font-size: 16px; font-weight: 700; color: #e2e8f0; margin-bottom: 12px; }

.avatar-section { display: flex; flex-direction: column; align-items: center; padding: 20px 0 8px; gap: 6px; }
.avatar-ring { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
.avatar-emoji { font-size: 44px; line-height: 1; }
.nickname { font-size: 20px; font-weight: 900; color: #f1f5f9; margin-top: 4px; }
.title-badge { font-size: 13px; font-weight: 600; color: #fbbf24; background: rgba(245, 158, 11, 0.12); padding: 4px 12px; border-radius: 12px; }

.data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.data-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; background: rgba(255, 255, 255, 0.04); border-radius: 16px; }
.data-value { font-size: 22px; font-weight: 900; color: #f1f5f9; }
.data-label { font-size: 11px; color: rgba(226, 232, 240, 0.5); white-space: nowrap; }

.equip-section { display: flex; flex-direction: column; gap: 12px; }
.equip-weapon { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.04); border-radius: 16px; }
.equip-emoji { font-size: 32px; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.4)); }
.equip-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.equip-name { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.equip-attack { font-size: 12px; color: rgba(226, 232, 240, 0.5); }

.backpack-title { font-size: 14px; font-weight: 600; color: #e2e8f0; }
.backpack-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.backpack-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; background: rgba(255, 255, 255, 0.04); border-radius: 16px; position: relative; }
.bp-emoji { font-size: 24px; line-height: 1; }
.bp-count { position: absolute; top: 2px; right: 4px; font-size: 10px; font-weight: 700; color: #fbbf24; }
.bp-name { font-size: 9px; color: rgba(226, 232, 240, 0.5); }

.menu-list { display: flex; flex-direction: column; gap: 2px; }
.menu-item { display: flex; align-items: center; gap: 12px; padding: 14px 12px; border: none; border-radius: 16px; background: transparent; color: inherit; font-family: inherit; cursor: pointer; transition: all 0.15s ease; width: 100%; text-align: left; }
.menu-item:active { background: rgba(255, 255, 255, 0.06); }
.menu-icon { font-size: 20px; line-height: 1; width: 28px; text-align: center; }
.menu-label { flex: 1; font-size: 15px; font-weight: 500; color: #e2e8f0; }
.menu-arrow { font-size: 20px; color: rgba(226, 232, 240, 0.25); line-height: 1; }
</style>
