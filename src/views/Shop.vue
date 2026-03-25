<template>
  <div class="shop-page">
    <div class="star-balance">
      <span class="balance-icon">⭐</span>
      <span class="balance-amount">{{ game.state.totalStars }}</span>
    </div>

    <div class="category-tabs">
      <button v-for="cat in categories" :key="cat" class="cat-btn"
              :class="{ active: activeCategory === cat }" @click="activeCategory = cat">
        {{ cat }}
      </button>
    </div>

    <div class="product-grid">
      <div v-for="(item, idx) in filteredItems" :key="idx"
           class="product-card" :class="'rarity-' + item.rarity">
        <div class="product-image" :style="{ background: item.gradient }">
          <span class="product-emoji">{{ item.emoji }}</span>
        </div>
        <div class="product-info">
          <span class="product-name">{{ item.name }}</span>
          <span class="product-rarity-tag">{{ rarityLabel(item.rarity) }}</span>
          <span class="product-desc">{{ item.desc }}</span>
        </div>
        <div class="product-bottom">
          <span class="product-price">⭐ {{ item.price }}</span>
          <button class="product-btn" :class="getStatus(item)"
                  @click="onBuy(item)" :disabled="getStatus(item) !== 'available'">
            {{ btnLabel(getStatus(item)) }}
          </button>
        </div>
      </div>
    </div>

    <div class="shop-tip">💡 击败Boss获得更多星星！</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

const game = useGameStore()
const categories = ['全部', '头像框', '背景', '称号', '武器皮肤']
const activeCategory = ref('全部')

const items = [
  { name: '森林守护者', category: '头像框', emoji: '🌿', rarity: 'common', gradient: 'linear-gradient(135deg, #065f46, #34d399)', price: 30 },
  { name: '火焰之环', category: '头像框', emoji: '🔥', rarity: 'epic', gradient: 'linear-gradient(135deg, #9333ea, #f59e0b)', price: 120 },
  { name: '星空背景', category: '背景', emoji: '🌌', rarity: 'rare', gradient: 'linear-gradient(135deg, #1e3a5f, #6366f1)', price: 80 },
  { name: '海拉鲁平原', category: '背景', emoji: '🏔️', rarity: 'epic', gradient: 'linear-gradient(135deg, #1a4731, #4ade80)', price: 150 },
  { name: '单词猎人', category: '称号', emoji: '🏹', rarity: 'common', gradient: 'linear-gradient(135deg, #78716c, #a8a29e)', price: 40 },
  { name: '传奇勇者', category: '称号', emoji: '👑', rarity: 'legendary', gradient: 'linear-gradient(135deg, #92400e, #fbbf24)', price: 500, levelReq: 20 },
  { name: '冰霜之刃', category: '武器皮肤', emoji: '❄️', rarity: 'rare', gradient: 'linear-gradient(135deg, #1e3a5f, #38bdf8)', price: 90 },
  { name: '大师剑皮肤', category: '武器皮肤', emoji: '⚡', rarity: 'legendary', gradient: 'linear-gradient(135deg, #1e3a5f, #fbbf24)', price: 400, levelReq: 15 },
]

const filteredItems = computed(() => {
  if (activeCategory.value === '全部') return items
  return items.filter(i => i.category === activeCategory.value)
})

const owned = computed(() => game.state.ownedSkins || [])

function getStatus(item) {
  if (owned.value.includes(item.name)) return 'owned'
  if (item.levelReq && game.state.level < item.levelReq) return 'locked'
  if (game.state.totalStars < item.price) return 'poor'
  return 'available'
}

function rarityLabel(r) {
  return { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' }[r] || ''
}

function btnLabel(status) {
  if (status === 'owned') return '已拥有'
  if (status === 'locked') return '等级不足'
  if (status === 'poor') return '星星不足'
  return '购买'
}

function onBuy(item) {
  if (getStatus(item) !== 'available') return
  game.state.totalStars -= item.price
  if (!game.state.ownedSkins) game.state.ownedSkins = []
  game.state.ownedSkins.push(item.name)
  game.persist()
}
</script>

<style scoped>
.shop-page { padding: 16px; padding-bottom: max(16px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 16px; }
.star-balance { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; }
.balance-icon { font-size: 22px; }
.balance-amount { font-size: 28px; font-weight: 900; color: #fbbf24; text-shadow: 0 0 12px rgba(251, 191, 36, 0.4); }

.category-tabs { display: flex; gap: 8px; overflow-x: auto; padding: 2px 0; scrollbar-width: none; }
.category-tabs::-webkit-scrollbar { display: none; }
.cat-btn { flex-shrink: 0; padding: 8px 16px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; background: rgba(30, 41, 59, 0.6); color: rgba(226, 232, 240, 0.6); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s ease; white-space: nowrap; }
.cat-btn.active { background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.4); color: #f59e0b; }

.product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.product-card { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(8px); border-radius: 16px; overflow: hidden; border: 2px solid transparent; transition: transform 0.2s; }
.product-card:active { transform: scale(0.97); }
.rarity-common { border-color: rgba(168, 162, 158, 0.35); }
.rarity-rare { border-color: rgba(59, 130, 246, 0.5); }
.rarity-epic { border-color: rgba(168, 85, 247, 0.5); }
.rarity-legendary { border-color: rgba(251, 191, 36, 0.6); box-shadow: 0 0 16px rgba(251, 191, 36, 0.15); }
.product-image { width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
.product-emoji { font-size: 48px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3)); }
.product-info { padding: 10px 12px 4px; display: flex; flex-direction: column; gap: 2px; }
.product-name { font-size: 14px; font-weight: 700; color: #f1f5f9; }
.product-rarity-tag { font-size: 11px; font-weight: 600; color: rgba(226, 232, 240, 0.5); }
.product-desc { font-size: 11px; color: rgba(226, 232, 240, 0.45); line-height: 1.3; margin-top: 1px; }
.rarity-rare .product-rarity-tag { color: #60a5fa; }
.rarity-epic .product-rarity-tag { color: #c084fc; }
.rarity-legendary .product-rarity-tag { color: #fbbf24; }
.product-bottom { padding: 8px 12px 12px; display: flex; align-items: center; justify-content: space-between; }
.product-price { font-size: 13px; font-weight: 700; color: #fbbf24; }
.product-btn { padding: 5px 14px; border: none; border-radius: 16px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s ease; }
.product-btn.available { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #0f172a; }
.product-btn.available:active { transform: scale(0.97); }
.product-btn.owned { background: rgba(255, 255, 255, 0.08); color: rgba(226, 232, 240, 0.4); cursor: default; }
.product-btn.locked { background: rgba(255, 255, 255, 0.06); color: rgba(226, 232, 240, 0.3); cursor: not-allowed; }
.product-btn.poor { background: rgba(255, 255, 255, 0.06); color: rgba(226, 232, 240, 0.3); cursor: not-allowed; }
.shop-tip { text-align: center; font-size: 13px; color: rgba(226, 232, 240, 0.4); padding: 12px 0 8px; }
</style>
