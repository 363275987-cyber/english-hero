<template>
  <div class="weapon-page">
    <!-- Header -->
    <div class="weapon-header">
      <button class="back-btn" @click="$router.push('/home')">← 返回</button>
      <h1 class="header-title">🗡️ 武器库</h1>
      <span class="weapon-total">{{ weaponStats.total }} 把</span>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat-chip healthy" v-if="weaponStats.healthy > 0">
        ✅ {{ weaponStats.healthy }} 良好
      </div>
      <div class="stat-chip critical" v-if="weaponStats.critical > 0">
        🟡 {{ weaponStats.critical }} 磨损
      </div>
      <div class="stat-chip shattered" v-if="weaponStats.shattered > 0">
        💔 {{ weaponStats.shattered }} 碎裂
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="filter-tabs">
      <button class="filter-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button>
      <button class="filter-btn" :class="{ active: filter === 'shattered' }" @click="filter = 'shattered'">💔 碎裂</button>
      <button class="filter-btn" :class="{ active: filter === 'warning' }" @click="filter = 'warning'">🟡 磨损</button>
      <button class="filter-btn" :class="{ active: filter === 'healthy' }" @click="filter = 'healthy'">✅ 良好</button>
    </div>

    <!-- Empty state -->
    <div v-if="filteredArsenal.length === 0" class="empty-state">
      <div class="empty-icon">🗡️</div>
      <h2 class="empty-title">{{ filter === 'all' ? '还没有武器' : '没有符合条件的武器' }}</h2>
      <p class="empty-desc">去冒险地图学习单词，每学会一个单词就获得一把武器！</p>
      <button v-if="filter === 'all'" class="empty-btn" @click="$router.push('/adventure')">去冒险 →</button>
    </div>

    <!-- Weapon list -->
    <div v-else class="weapon-list">
      <div v-for="weapon in filteredArsenal" :key="weapon.wordId"
           class="weapon-card" :class="weapon.status"
           @click="onWeaponClick(weapon)">
        <div class="weapon-left">
          <span class="weapon-emoji">{{ weapon.weaponEmoji }}</span>
          <div class="weapon-info">
            <div class="weapon-word">{{ weapon.word }}</div>
            <div class="weapon-phonetic">{{ weapon.phonetic }}</div>
            <div class="weapon-meaning">{{ weapon.meaning }}</div>
          </div>
        </div>
        <div class="weapon-right">
          <div class="weapon-label">{{ weapon.weaponLabel }}</div>
          <div class="durability-mini">
            <div class="dur-mini-track">
              <div class="dur-mini-fill" :style="{ width: weapon.durability + '%' }"
                   :class="durClass(weapon.durability, weapon.status)"></div>
            </div>
            <span class="dur-mini-text">{{ weapon.durability }}%</span>
          </div>
          <div class="weapon-action" v-if="weapon.status === 'forgotten'">
            🔨 重铸
          </div>
          <div class="weapon-action" v-else-if="weapon.durability < 40">
            🔄 复习
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'

const router = useRouter()
const game = useGameStore()
const filter = ref('all')

const arsenal = computed(() => game.getWeaponArsenal())

const filteredArsenal = computed(() => {
  if (filter.value === 'all') return arsenal.value
  if (filter.value === 'shattered') return arsenal.value.filter(w => w.status === 'forgotten')
  if (filter.value === 'warning') return arsenal.value.filter(w => w.status !== 'forgotten' && w.durability < 50)
  if (filter.value === 'healthy') return arsenal.value.filter(w => w.durability >= 50)
  return arsenal.value
})

const weaponStats = computed(() => game.weaponStats)

function durClass(durability, status) {
  if (status === 'forgotten') return 'shattered'
  if (durability < 25) return 'critical'
  if (durability < 50) return 'warning'
  return 'good'
}

function onWeaponClick(weapon) {
  if (weapon.status === 'forgotten') {
    // 碎裂 → 跳转重新学习
    const moduleId = weapon.wordId.match(/^m(\d+)/)?.[1]
    if (moduleId) {
      router.push(`/learn/${moduleId}`)
    } else {
      router.push('/adventure')
    }
  } else if (weapon.durability < 40) {
    // 需要复习 → 跳转复习页
    router.push('/review')
  }
}
</script>

<style scoped>
.weapon-page { min-height: 100vh; background: linear-gradient(180deg, #0f172a, #1e293b); padding-bottom: 40px; }

.weapon-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
.back-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 8px; font-family: inherit; }
.header-title { font-size: 18px; font-weight: 900; color: #fbbf24; margin: 0; }
.weapon-total { font-size: 14px; font-weight: 700; color: #e2e8f0; }

.stats-bar { display: flex; gap: 8px; padding: 0 16px 12px; flex-wrap: wrap; }
.stat-chip { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
.stat-chip.healthy { background: rgba(52, 211, 153, 0.15); color: #34d399; }
.stat-chip.critical { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.stat-chip.shattered { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.filter-tabs { display: flex; gap: 6px; padding: 0 16px 16px; overflow-x: auto; }
.filter-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all 0.2s; }
.filter-btn.active { background: rgba(251, 191, 36, 0.2); border-color: #fbbf24; color: #fbbf24; }

.empty-state { text-align: center; padding: 60px 32px; }
.empty-icon { font-size: 64px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px; }
.empty-desc { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px; }
.empty-btn { background: linear-gradient(135deg, #34d399, #10b981); border: none; color: #022c22; padding: 12px 32px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }

.weapon-list { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }

.weapon-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: rgba(30, 41, 59, 0.9); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: all 0.2s; gap: 12px; }
.weapon-card:active { transform: scale(0.98); }
.weapon-card.forgotten { border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }

.weapon-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.weapon-emoji { font-size: 28px; flex-shrink: 0; }
.weapon-info { min-width: 0; }
.weapon-word { font-size: 16px; font-weight: 700; color: #f1f5f9; }
.weapon-phonetic { font-size: 12px; color: #94a3b8; }
.weapon-meaning { font-size: 13px; color: #cbd5e1; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.weapon-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.weapon-label { font-size: 11px; font-weight: 600; color: #94a3b8; }

.durability-mini { display: flex; align-items: center; gap: 6px; }
.dur-mini-track { width: 50px; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
.dur-mini-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
.dur-mini-fill.good { background: #34d399; }
.dur-mini-fill.warning { background: #fbbf24; }
.dur-mini-fill.critical { background: #f87171; }
.dur-mini-fill.shattered { background: #64748b; }
.dur-mini-text { font-size: 11px; font-weight: 600; color: #94a3b8; }

.weapon-action { font-size: 11px; font-weight: 600; color: #fbbf24; }
</style>
