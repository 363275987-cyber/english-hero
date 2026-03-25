<template>
  <div class="gift-page">
    <div class="gift-header">
      <button class="back-btn" @click="$router.push('/home')">← 返回</button>
      <h1 class="header-title">🎁 礼物兑换</h1>
      <span class="coupon-count">🎫 {{ game.state.giftCoupons }} 券</span>
    </div>

    <!-- How it works -->
    <div class="info-card card">
      <h3 class="info-title">📖 怎么兑换？</h3>
      <div class="info-steps">
        <div class="step">1️⃣ 打败 Boss 获得兑换券</div>
        <div class="step">2️⃣ 选一个想兑换的礼物</div>
        <div class="step">3️⃣ 跟老王说 <strong>3个英语单词</strong> 验证</div>
        <div class="step">4️⃣ 验证通过 → 拿到礼物！</div>
      </div>
    </div>

    <!-- Gift list -->
    <div class="gift-list">
      <div v-for="gift in giftList" :key="gift.id"
           class="gift-card card"
           :class="{ available: game.state.giftCoupons >= gift.cost, unavailable: game.state.giftCoupons < gift.cost }">
        <div class="gift-left">
          <span class="gift-emoji">{{ gift.emoji }}</span>
          <div class="gift-info">
            <div class="gift-name">{{ gift.name }}</div>
            <div class="gift-desc">{{ gift.desc }}</div>
          </div>
        </div>
        <button class="redeem-btn"
                :class="{ can: game.state.giftCoupons >= gift.cost }"
                :disabled="game.state.giftCoupons < gift.cost"
                @click="startRedeem(gift)">
          🎫 {{ gift.cost }} 券
        </button>
      </div>
    </div>

    <!-- Redeem modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal card">
          <h3 class="modal-title">{{ selectedGift?.emoji }} {{ selectedGift?.name }}</h3>
          <p class="modal-sub">跟老王说 3 个刚学的英语单词来验证吧！</p>

          <div v-if="!verifying" class="modal-actions">
            <button class="modal-btn primary" @click="startVerify">🗣️ 开始验证</button>
            <button class="modal-btn secondary" @click="showModal = false">取消</button>
          </div>

          <div v-else class="verify-area">
            <div class="verify-words">
              <div v-for="(w, i) in verifyWords" :key="i" class="verify-word" :class="{ done: w.verified }">
                <span class="verify-emoji">{{ w.verified ? '✅' : '⬜' }}</span>
                <span class="verify-text">{{ w.word }}</span>
              </div>
            </div>
            <p class="verify-hint">大声说出每个单词，老王确认后点 ✅</p>
            <div class="verify-actions">
              <button v-for="(w, i) in verifyWords" :key="i"
                      class="verify-btn"
                      :class="{ done: w.verified }"
                      :disabled="w.verified || (i > 0 && !verifyWords[i-1].verified)"
                      @click="markVerified(i)">
                {{ w.verified ? '✅' : '确认第' + (i+1) + '个' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { giftList } from '../data/achievements'

const router = useRouter()
const game = useGameStore()
const showModal = ref(false)
const verifying = ref(false)
const selectedGift = ref(null)
const verifyWords = ref([])

function startRedeem(gift) {
  selectedGift.value = gift
  verifying.value = false
  // Pick 3 random learned words
  const learned = Object.entries(game.state.wordProgress || {})
    .filter(([_, p]) => p.status === 'learned')
    .map(([id]) => id)
  if (learned.length < 3) {
    alert('至少需要学会 3 个单词才能兑换礼物哦！先去学习吧～')
    return
  }
  const shuffled = learned.sort(() => Math.random() - 0.5).slice(0, 3)
  verifyWords.value = shuffled.map(id => {
    const word = allWords.find(w => w.id === id)
    return { wordId: id, word: word?.word || id, meaning: word?.meaning || '', verified: false }
  })
  showModal.value = true
}

function startVerify() {
  verifying.value = true
}

function markVerified(idx) {
  verifyWords.value[idx].verified = true
  // All verified?
  if (verifyWords.value.every(w => w.verified)) {
    // Complete redemption
    if (game.useGiftCoupon()) {
      game.redeemGift()
      game.checkAchievements()
      showModal.value = false
    }
  }
}
</script>

<script>
import { allWords } from '../data/words'
</script>

<style scoped>
.gift-page { min-height: 100vh; background: linear-gradient(180deg, #0f172a, #1e293b); padding-bottom: 40px; }

.gift-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
.back-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 8px; font-family: inherit; }
.header-title { font-size: 18px; font-weight: 900; color: #fbbf24; margin: 0; }
.coupon-count { font-size: 14px; font-weight: 700; color: #fbbf24; }

.card { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; }

.info-card { padding: 16px; margin: 0 16px 16px; }
.info-title { font-size: 15px; font-weight: 700; color: #e2e8f0; margin: 0 0 10px; }
.info-steps { display: flex; flex-direction: column; gap: 6px; }
.step { font-size: 13px; color: #cbd5e1; }
.step strong { color: #fbbf24; }

.gift-list { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }

.gift-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; cursor: default; }
.gift-card.unavailable { opacity: 0.4; }

.gift-left { display: flex; align-items: center; gap: 12px; flex: 1; }
.gift-emoji { font-size: 32px; }
.gift-info { }
.gift-name { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.gift-desc { font-size: 12px; color: #94a3b8; margin-top: 2px; }

.redeem-btn { padding: 8px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.redeem-btn.can { background: rgba(251, 191, 36, 0.15); border-color: #fbbf24; color: #fbbf24; }
.redeem-btn:disabled { cursor: not-allowed; }
.redeem-btn.can:active { transform: scale(0.95); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 24px; }
.modal { width: 100%; max-width: 340px; padding: 24px; }
.modal-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; text-align: center; }
.modal-sub { font-size: 13px; color: #94a3b8; text-align: center; margin: 0 0 16px; }
.modal-actions { display: flex; gap: 10px; }
.modal-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
.modal-btn.primary { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #022c22; }
.modal-btn.secondary { background: rgba(255,255,255,0.1); color: #94a3b8; }

.verify-area { }
.verify-words { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.verify-word { display: flex; align-items: center; gap: 10px; padding: 12px; background: rgba(255,255,255,0.04); border-radius: 12px; }
.verify-word.done { background: rgba(52, 211, 153, 0.1); }
.verify-emoji { font-size: 20px; }
.verify-text { font-size: 18px; font-weight: 700; color: #f1f5f9; }
.verify-hint { font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 12px; }
.verify-actions { display: flex; gap: 8px; }
.verify-btn { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: rgba(251, 191, 36, 0.1); color: #fbbf24; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
.verify-btn.done { background: rgba(52, 211, 153, 0.2); color: #34d399; border-color: #34d399; }
.verify-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
