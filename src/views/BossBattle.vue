<template>
  <div class="boss-battle" :class="{ 'boss-attack-flash': isBossAttacking && !isDefending, 'shield-flash': isDefending, 'victory-glow': isVictory }">
    <!-- Top Bar -->
    <div class="battle-top-bar">
      <button @click="retreat" class="back-btn">← 返回</button>
      <div class="boss-title">{{ bossData.emoji }} {{ bossData.name }}</div>
    </div>

    <!-- Boss HP Bar -->
    <div class="boss-hp-section">
      <div class="boss-hp-bar-wrap">
        <div class="boss-hp-bar" :style="{ width: (bossHp / bossData.maxHp * 100) + '%' }" :class="hpBarClass"></div>
      </div>
      <span class="boss-hp-text">{{ bossHp }} / {{ bossData.maxHp }}</span>
    </div>

    <!-- Boss Area -->
    <div class="boss-area" v-if="!isDead && !isVictory">
      <!-- Boss Dialogue -->
      <div class="boss-dialogue" v-if="dialogueText">
        <div class="dialogue-bubble">
          <p>"{{ dialogueText }}"</p>
        </div>
      </div>

      <!-- Boss Illustration -->
      <div class="boss-emoji-wrap" :class="{ 'boss-shake': isBossHit, 'boss-attack-anim': isBossAttacking }">
        <img v-if="bossImage" :src="bossImage" :alt="bossData.name" class="boss-img" />
        <span v-else class="boss-emoji">{{ bossData.emoji }}</span>
      </div>

      <!-- Damage Float -->
      <div v-for="d in damageFloats" :key="d.id" class="damage-float" :class="d.cls" :style="{ left: d.x + '%', top: d.y + '%' }">
        {{ d.text }}
      </div>

      <!-- Boss Attack Countdown -->
      <div class="countdown-section">
        <div class="countdown-label">⚡ Boss攻击倒计时</div>
        <div class="countdown-bar-wrap">
          <div class="countdown-bar" :style="{ width: (timerCount / 8 * 100) + '%' }" :class="timerBarClass"></div>
        </div>
        <div class="countdown-number">{{ timerCount }}s</div>
      </div>

      <!-- Player HP -->
      <div class="player-hp-section">
        <span v-for="i in game.state.maxHp" :key="i" class="hp-heart" :class="{ lost: i > playerHp }">❤️</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-section" v-if="!isDead && !isVictory">
      <button class="action-btn attack-btn" @click="playerAttack" :disabled="isAnimating || weaponBroken">
        <div class="action-emoji">{{ weaponInfo?.emoji || '⚔️' }}</div>
        <div class="action-label">⚔️ 攻击</div>
        <div class="action-detail">耐久 {{ weaponInfo?.currentDurability || 0 }}/{{ weaponInfo?.maxDurability || 0 }}</div>
        <div class="action-damage">伤害 {{ weaponInfo?.damage || 0 }}</div>
      </button>
      <button class="action-btn shield-btn" @click="playerDefend" :disabled="isAnimating || !shieldUses">
        <div class="action-emoji">🛡️</div>
        <div class="action-label">🛡️ 防御</div>
        <div class="action-detail">次数 {{ shieldUses }}</div>
      </button>
    </div>

    <!-- Weapon Info Bar -->
    <div class="weapon-info-bar" v-if="!isDead && !isVictory && weaponInfo">
      <span class="weapon-emoji-lg">{{ weaponInfo.emoji }}</span>
      <span class="weapon-word">{{ weaponInfo.word }}</span>
      <span class="weapon-meaning">{{ weaponInfo.meaning }}</span>
    </div>

    <!-- Victory Screen -->
    <div class="overlay-screen victory-screen" v-if="isVictory">
      <div class="victory-particles">
        <span v-for="n in 20" :key="n" class="particle" :style="particleStyle(n)"></span>
      </div>
      <div class="victory-emoji animate-bounce-slow">🎉</div>
      <h1 class="victory-title">Boss 击败！</h1>
      <p class="victory-quote">"{{ bossData.dialogues.victory }}"</p>
      <div class="victory-reward">
        <p class="reward-stars">⭐ +{{ bossData.rewards.stars }}</p>
      </div>
      <button @click="goBack" class="primary-btn gold-btn">继续冒险 →</button>
    </div>

    <!-- Death Screen -->
    <div class="overlay-screen death-screen" v-if="isDead">
      <div class="death-emoji">💀</div>
      <h1 class="death-title">你倒下了...</h1>
      <p class="death-quote">"{{ bossData.dialogues.attack }}"</p>
      <p class="death-hint">你的装备不够强！回去学习新单词，打造更强武器再来挑战！</p>
      <div class="death-actions">
        <button @click="goHome" class="primary-btn">🏠 回首页</button>
        <button @click="goLearn" class="primary-btn green-btn">📖 去学习</button>
        <button @click="goEquip" class="primary-btn blue-btn">⚔️ 去装备</button>
      </div>
    </div>

    <!-- Weapon Broken Overlay -->
    <div class="broken-overlay" v-if="weaponBroken && !isDead">
      <div class="broken-emoji">💔</div>
      <p class="broken-text">武器坏了！</p>
      <p class="broken-hint">回去学习新单词，获得更强的武器</p>
      <div class="broken-actions">
        <button @click="goLearn" class="primary-btn green-btn">📖 去学习</button>
        <button @click="retreat" class="primary-btn">← 撤退</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { allBosses } from '../data/bosses'
import { sfx } from '../lib/sfx'

const router = useRouter()
const route = useRoute()
const game = useGameStore()

const bossId = route.params.bossId || 'm1_boss'
const rawBoss = allBosses[bossId] || allBosses.m1_boss
const bossImage = computed(() => {
  const id = rawBoss?.id
  return id ? `/assets/bosses/${id}.jpg` : null
})
const bossData = computed(() => ({
  ...rawBoss,
  maxHp: rawBoss.hp,
  dialogues: {
    intro: rawBoss.dialogues?.intro || 'Ready to fight?',
    attack: rawBoss.dialogues?.attack || 'Take this!',
    hit: rawBoss.dialogues?.hit || 'Ouch!',
    miss: rawBoss.dialogues?.miss || 'Wrong!',
    victory: rawBoss.dialogues?.victory || 'You win!',
    defeat: rawBoss.dialogues?.defeat || 'Defeated...',
    weak: rawBoss.dialogues?.weak || "I'm weakening...",
    ...(rawBoss.dialogues || {}),
  },
  rewards: {
    stars: rawBoss.rewards?.stars || 30,
    chest: rawBoss.rewards?.chest || 'iron',
    giftChance: rawBoss.rewards?.giftChance || 0,
    ...(rawBoss.rewards || {}),
  },
}))

// Boss HP
const savedHp = game.getBossHp(bossId)
const bossHp = ref(savedHp !== null ? savedHp : bossData.value.maxHp)

// Timer
const timerCount = ref(8)
let timer = null

// Weapon info
const weaponInfo = computed(() => game.getEquippedWeaponInfo())

// Shield uses
const shieldUses = computed(() => game.state.equippedShieldUses || 0)

// Player HP
const playerHp = computed(() => game.state.hp)

// Animation states
const isAttacking = ref(false)
const isDefending = ref(false)
const isBossAttacking = ref(false)
const isBossHit = ref(false)
const weaponBroken = ref(false)
const isDead = ref(false)
const isVictory = ref(false)
const dialogueText = ref('')
const damageFloats = ref([])
let floatId = 0

// Computed: animation lock
const isAnimating = computed(() => isAttacking.value || isBossAttacking.value || isDefending.value)

// HP bar color class
const hpBarClass = computed(() => {
  const pct = bossHp.value / bossData.value.maxHp
  if (pct > 0.6) return 'hp-green'
  if (pct > 0.3) return 'hp-yellow'
  return 'hp-red'
})

// Timer bar color
const timerBarClass = computed(() => {
  if (timerCount.value > 4) return 'timer-safe'
  if (timerCount.value > 2) return 'timer-warn'
  return 'timer-danger'
})

// Particle style for victory
function particleStyle(n) {
  const delay = Math.random() * 2
  const left = Math.random() * 100
  const size = 4 + Math.random() * 8
  const duration = 2 + Math.random() * 3
  return {
    left: left + '%',
    width: size + 'px',
    height: size + 'px',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
  }
}

// ===== Timer Logic =====
function startTimer() {
  stopTimer()
  timerCount.value = 8
  timer = setInterval(() => {
    if (isDead.value || isVictory.value) {
      stopTimer()
      return
    }
    timerCount.value--
    if (timerCount.value <= 0) {
      bossAttacks()
      timerCount.value = 8
    }
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// ===== Boss Attacks =====
function bossAttacks() {
  if (isDead.value || isVictory.value || isAnimating.value) return

  isBossAttacking.value = true
  dialogueText.value = bossData.value.dialogues.attack
  sfx.bossAttack()

  // Auto shield: if player has shields, auto-use
  const shield = game.useShield()
  if (shield.blocked) {
    isDefending.value = true
    dialogueText.value = '🛡️ 挡住了！'
    showFloatText('🛡️ BLOCKED!', 'float-shield')
    sfx.shieldBlock()
  } else {
    const result = game.takeBossDamage()
    if (result.dead) {
      playerDeath()
      setTimeout(() => {
        isBossAttacking.value = false
        isDefending.value = false
      }, 1500)
      return
    }
    dialogueText.value = bossData.value.dialogues.miss || 'You took damage!'
    showFloatText('-1 ❤️', 'float-damage')
  }

  setTimeout(() => {
    isBossAttacking.value = false
    isDefending.value = false
    dialogueText.value = ''
  }, 1200)
}

// ===== Player Attack =====
function playerAttack() {
  if (isAnimating.value || weaponBroken.value || isDead.value || isVictory.value) return

  const result = game.attackBoss()
  if (!result) {
    weaponBroken.value = true
    sfx.weaponBreak()
    return
  }

  isAttacking.value = true

  if (result.broken) {
    // Last strike — weapon breaks after this hit
    bossHp.value = Math.max(0, bossHp.value - result.damage)
    game.saveBossHp(bossId, bossHp.value)
    showFloatText(`-${result.damage} ⚔️`, 'float-attack')
    triggerBossHit()

    setTimeout(() => {
      isAttacking.value = false
      weaponBroken.value = true
      if (bossHp.value <= 0) {
        handleVictory()
      }
    }, 800)
    return
  }

  // Normal attack
  bossHp.value = Math.max(0, bossHp.value - result.damage)
  game.saveBossHp(bossId, bossHp.value)
  showFloatText(`-${result.damage} ⚔️`, 'float-attack')
  triggerBossHit()
  sfx.hitBoss()
  dialogueText.value = bossData.value.dialogues.hit

  setTimeout(() => {
    isAttacking.value = false
    if (bossHp.value <= 0) {
      handleVictory()
    } else {
      setTimeout(() => { dialogueText.value = '' }, 1000)
    }
  }, 600)
}

// ===== Player Defend (manual shield before timer) =====
function playerDefend() {
  if (isAnimating.value || !shieldUses.value || isDead.value || isVictory.value) return
  // Defensive stance — adds a visual cue, shield auto-used on boss attack
  isDefending.value = true
  showFloatText('🛡️ 防御姿态!', 'float-shield')
  setTimeout(() => {
    isDefending.value = false
  }, 1500)
}

// ===== Victory =====
function handleVictory() {
  stopTimer()
  isVictory.value = true
  game.defeatBoss(bossId)
  game.addStars(bossData.value.rewards.stars)
  game.clearBossHp(bossId)
  game.updateStreak()
  game.addItem('heartApple', 2)
}

// ===== Death =====
function playerDeath() {
  stopTimer()
  isDead.value = true
  game.playerDie(bossId)
  dialogueText.value = '...'
}

// ===== Effects =====
function triggerBossHit() {
  isBossHit.value = true
  setTimeout(() => { isBossHit.value = false }, 500)
}

function showFloatText(text, cls) {
  const id = floatId++
  const x = 35 + Math.random() * 30
  const y = 20 + Math.random() * 15
  damageFloats.value.push({ id, text, cls, x, y })
  setTimeout(() => {
    damageFloats.value = damageFloats.value.filter(d => d.id !== id)
  }, 1200)
}

// ===== Navigation =====
function retreat() {
  stopTimer()
  if (bossHp.value > 0 && bossHp.value < bossData.value.maxHp) {
    game.saveBossHp(bossId, bossHp.value)
  }
  router.push('/adventure')
}

function goBack() {
  router.push('/adventure')
}

function goHome() {
  game.respawn()
  router.push('/')
}

function goLearn() {
  game.respawn()
  router.push('/learn')
}

function goEquip() {
  game.respawn()
  router.push('/arsenal')
}

// ===== Lifecycle =====
onMounted(() => {
  game.updateStreak()
  dialogueText.value = bossData.value.dialogues.intro
  setTimeout(() => {
    dialogueText.value = ''
    startTimer()
  }, 2000)
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
/* ===== Battle Container ===== */
.boss-battle {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #1a0a2e, #16213e, #0f0f23);
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s;
}

/* Red flash on boss attack */
.boss-attack-flash {
  animation: redFlash 0.3s ease;
}
@keyframes redFlash {
  0%, 100% { background: linear-gradient(to bottom, #1a0a2e, #16213e, #0f0f23); }
  50% { background: linear-gradient(to bottom, #5a0a0a, #4a1010, #2f0f0f); }
}

/* Blue flash on shield */
.shield-flash {
  animation: blueFlash 0.4s ease;
}
@keyframes blueFlash {
  0%, 100% { background: linear-gradient(to bottom, #1a0a2e, #16213e, #0f0f23); }
  50% { background: linear-gradient(to bottom, #0a1a4e, #1030a0, #0f1f6f); }
}

/* Victory glow */
.victory-glow {
  animation: victoryGlow 1s ease infinite alternate;
}
@keyframes victoryGlow {
  from { background: linear-gradient(to bottom, #2a1a0e, #3a2a0e, #1f1f03); }
  to { background: linear-gradient(to bottom, #3a2a1e, #5a4a1e, #2f2f13); }
}

/* ===== Top Bar ===== */
.battle-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}
.back-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}
.back-btn:active {
  color: white;
}
.boss-title {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
}

/* ===== Boss HP Bar ===== */
.boss-hp-section {
  padding: 0 16px 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.boss-hp-bar-wrap {
  flex: 1;
  height: 16px;
  background: rgba(0,0,0,0.5);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}
.boss-hp-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease-out, background 0.5s;
}
.hp-green {
  background: linear-gradient(to right, #22c55e, #4ade80);
}
.hp-yellow {
  background: linear-gradient(to right, #f59e0b, #facc15);
}
.hp-red {
  background: linear-gradient(to right, #dc2626, #f87171);
}
.boss-hp-text {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  min-width: 60px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ===== Boss Area ===== */
.boss-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 20px;
}

/* Boss Dialogue */
.boss-dialogue {
  margin-bottom: 12px;
  max-width: 300px;
}
.dialogue-bubble {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 10px 16px;
  border: 1px solid rgba(255,255,255,0.15);
  text-align: center;
}
.dialogue-bubble p {
  font-size: 14px;
  font-style: italic;
  color: rgba(255,255,255,0.85);
  line-height: 1.4;
}

/* Boss Emoji */
.boss-emoji-wrap {
  position: relative;
  margin-bottom: 24px;
}
.boss-emoji {
  font-size: 80px;
  display: inline-block;
  animation: bossFloat 3s ease-in-out infinite;
}
@keyframes bossFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.boss-shake .boss-emoji {
  animation: bossShake 0.5s ease;
}
@keyframes bossShake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-8px, 0); }
  20% { transform: translate(8px, 0); }
  30% { transform: translate(-6px, 0); }
  40% { transform: translate(6px, 0); }
  50% { transform: translate(-4px, 0); }
  60% { transform: translate(4px, 0); }
  70% { transform: translate(-2px, 0); }
  80% { transform: translate(2px, 0); }
  filter: brightness(2), saturate(0);
}
.boss-attack-anim .boss-emoji {
  animation: bossAttackPulse 0.6s ease;
}
@keyframes bossAttackPulse {
  0% { transform: scale(1); filter: brightness(1); }
  30% { transform: scale(1.3); filter: brightness(2) hue-rotate(300deg); }
  100% { transform: scale(1); filter: brightness(1); }
}

/* Damage Floats */
.damage-float {
  position: absolute;
  font-size: 28px;
  font-weight: 900;
  pointer-events: none;
  animation: floatUp 1.2s ease-out forwards;
  z-index: 10;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
}
@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  50% { opacity: 1; transform: translateY(-30px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
}
.float-attack {
  color: #fbbf24;
}
.float-damage {
  color: #ef4444;
  font-size: 32px;
}
.float-shield {
  color: #60a5fa;
  font-size: 26px;
}

/* ===== Countdown Section ===== */
.countdown-section {
  width: 100%;
  max-width: 300px;
  margin-bottom: 16px;
}
.countdown-label {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  text-align: center;
  margin-bottom: 6px;
}
.countdown-bar-wrap {
  height: 10px;
  background: rgba(0,0,0,0.4);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 4px;
}
.countdown-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 1s linear, background 0.5s;
}
.timer-safe {
  background: linear-gradient(to right, #3b82f6, #60a5fa);
}
.timer-warn {
  background: linear-gradient(to right, #f59e0b, #fbbf24);
}
.timer-danger {
  background: linear-gradient(to right, #ef4444, #f87171);
  animation: timerPulse 0.5s ease infinite;
}
@keyframes timerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.countdown-number {
  font-size: 24px;
  font-weight: 900;
  text-align: center;
  color: rgba(255,255,255,0.5);
  font-variant-numeric: tabular-nums;
}
.timer-danger ~ .countdown-number,
.timer-warn ~ .countdown-number {
  color: #fbbf24;
}

/* ===== Player HP ===== */
.player-hp-section {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-bottom: 8px;
}
.hp-heart {
  font-size: 20px;
  transition: all 0.3s;
}
.hp-heart.lost {
  filter: grayscale(1) opacity(0.3);
  transform: scale(0.8);
}

/* ===== Action Buttons ===== */
.action-section {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
}
.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 12px;
  border-radius: 16px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.action-btn:active:not(:disabled) {
  transform: scale(0.95);
}
.attack-btn {
  background: rgba(220, 38, 38, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}
.attack-btn:not(:disabled):active {
  background: rgba(220, 38, 38, 0.4);
}
.shield-btn {
  background: rgba(37, 99, 235, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #93c5fd;
}
.shield-btn:not(:disabled):active {
  background: rgba(37, 99, 235, 0.4);
}
.action-emoji {
  font-size: 28px;
  margin-bottom: 2px;
}
.action-label {
  font-size: 15px;
  font-weight: 700;
}
.action-detail {
  font-size: 12px;
  opacity: 0.7;
}
.action-damage {
  font-size: 11px;
  color: #fbbf24;
  font-weight: 600;
}

/* ===== Weapon Info Bar ===== */
.weapon-info-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px 12px;
  background: rgba(0,0,0,0.3);
  border-top: 1px solid rgba(255,255,255,0.06);
}
.weapon-emoji-lg {
  font-size: 20px;
}
.weapon-word {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}
.weapon-meaning {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

/* ===== Overlay Screens ===== */
.overlay-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
  animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Victory */
.victory-screen {
  background: linear-gradient(to bottom, rgba(120, 80, 0, 0.95), rgba(30, 20, 0, 0.98));
}
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
.victory-emoji {
  font-size: 72px;
  margin-bottom: 12px;
}
.victory-title {
  font-size: 28px;
  font-weight: 900;
  color: #fbbf24;
  margin-bottom: 8px;
}
.victory-quote {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  font-style: italic;
  margin-bottom: 24px;
  text-align: center;
  max-width: 280px;
}
.victory-reward {
  background: rgba(0,0,0,0.4);
  border-radius: 16px;
  padding: 16px 32px;
  margin-bottom: 24px;
  text-align: center;
  border: 1px solid rgba(251, 191, 36, 0.2);
}
.reward-stars {
  font-size: 36px;
  font-weight: 900;
  color: #fbbf24;
}

/* Victory Particles */
.victory-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.particle {
  position: absolute;
  bottom: -10px;
  background: radial-gradient(circle, #fbbf24, #f59e0b);
  border-radius: 50%;
  animation: particleRise 3s ease-in infinite;
  opacity: 0.7;
}
@keyframes particleRise {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-100vh) scale(0); opacity: 0; }
}

/* Death */
.death-screen {
  background: linear-gradient(to bottom, rgba(30, 0, 0, 0.97), rgba(10, 0, 0, 0.99));
}
.death-emoji {
  font-size: 64px;
  margin-bottom: 12px;
  animation: bounce-slow 2s ease-in-out infinite;
}
.death-title {
  font-size: 24px;
  font-weight: 900;
  color: #f87171;
  margin-bottom: 8px;
}
.death-quote {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
  font-style: italic;
  margin-bottom: 12px;
  text-align: center;
  max-width: 280px;
}
.death-hint {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 24px;
  text-align: center;
  max-width: 300px;
  line-height: 1.5;
}
.death-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 240px;
}

/* Primary Button */
.primary-btn {
  width: 100%;
  padding: 14px 24px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: rgba(255,255,255,0.1);
  color: white;
  border: 1px solid rgba(255,255,255,0.15);
  transition: all 0.2s;
}
.primary-btn:active {
  transform: scale(0.97);
}
.gold-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #1a1a1a;
  border: none;
}
.green-btn {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}
.blue-btn {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #93c5fd;
}

/* ===== Weapon Broken Overlay ===== */
.broken-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.85);
  z-index: 40;
  animation: fadeIn 0.5s ease;
}
.broken-emoji {
  font-size: 56px;
  margin-bottom: 12px;
  animation: brokenShake 0.6s ease;
}
@keyframes brokenShake {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-15deg) scale(1.2); }
  40% { transform: rotate(10deg); }
  60% { transform: rotate(-5deg); }
  80% { transform: rotate(2deg); }
}
.broken-text {
  font-size: 22px;
  font-weight: 900;
  color: #f87171;
  margin-bottom: 8px;
}
.broken-hint {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 24px;
  text-align: center;
  max-width: 280px;
}
.broken-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 240px;
}

/* ===== Screen Shake ===== */
.boss-attack-flash {
  animation: screenShake 0.3s ease, redFlash 0.3s ease;
}
@keyframes screenShake {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-3px, 2px); }
  40% { transform: translate(3px, -2px); }
  60% { transform: translate(-2px, 1px); }
  80% { transform: translate(2px, -1px); }
}
</style>
