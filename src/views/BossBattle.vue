<template>
  <div :class="['min-h-screen flex flex-col', bossData.bgGradient]" v-if="phase !== 'victory' && phase !== 'retreat'">
    <!-- Top bar: HP + Combo + Weapon -->
    <div class="px-4 pt-3 pb-2">
      <div class="flex items-center justify-between">
        <button @click="retreat" class="text-white/50 text-sm">← 撤退</button>
        <div class="flex gap-1">
          <span v-for="i in game.state.maxHp" :key="i"
                class="hp-heart" :class="{ lost: i > game.state.hp }">❤️</span>
        </div>
        <div class="text-right">
          <span class="text-amber-400 font-bold">⭐ {{ game.state.todayStarsEarned }}</span>
        </div>
      </div>
      <div v-if="combo > 0" class="text-center mt-1">
        <span class="text-amber-400 font-black text-lg animate-bounce">🔥 COMBO ×{{ combo }}</span>
      </div>
      <div v-if="difficulty === 'easy'" class="text-center mt-0.5">
        <span class="text-xs text-emerald-400/70">🛡️ 简单模式（有提示）</span>
      </div>
    </div>

    <!-- Boss Area -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 relative">
      <!-- Boss Dialogue -->
      <div v-if="bossDialogue" class="mb-4 max-w-xs mx-auto">
        <div class="bg-black/60 backdrop-blur rounded-xl px-4 py-2 border border-white/20 text-center">
          <p class="text-sm italic text-white/90">"{{ bossDialogue }}"</p>
        </div>
      </div>

      <!-- Boss Display -->
      <div class="relative mb-4" :class="{ 'animate-shake': bossShaking }">
        <div :class="['text-7xl sm:text-8xl animate-float', { 'animate-boss-entrance': phase === 'intro' }]">
          {{ bossData.emoji }}
        </div>
        <!-- Boss HP Bar -->
        <div class="mt-3 w-48 sm:w-56">
          <div class="flex justify-between text-xs mb-1">
            <span class="font-bold">{{ bossData.name }}</span>
            <span>{{ bossHp }} / {{ bossData.maxHp }}</span>
          </div>
          <div class="h-4 bg-black/50 rounded-full overflow-hidden border border-white/10">
            <div class="h-full rounded-full transition-all duration-500 ease-out"
                 :class="hpBarColor"
                 :style="{ width: (bossHp / bossData.maxHp * 100) + '%' }">
            </div>
          </div>
        </div>
      </div>

      <!-- Damage Float -->
      <div v-for="d in damageFloats" :key="d.id"
           class="absolute damage-float font-black text-3xl pointer-events-none"
           :class="d.color"
           :style="{ left: d.x + '%', top: d.y + '%' }">
        -{{ d.amount }}
      </div>
    </div>

    <!-- Bottom: Battle Controls -->
    <div class="bg-black/40 backdrop-blur-lg border-t border-white/10 px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
      <!-- Items quick bar -->
      <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button v-for="(count, id) in game.state.items" :key="id"
                v-show="count > 0"
                @click="useItem(id)"
                class="flex-shrink-0 bg-white/10 rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1 border border-white/10 active:scale-[0.97] transition-transform">
          <span>{{ itemEmojis[id] || '📦' }}</span>
          <span class="text-white/60">×{{ count }}</span>
        </button>
      </div>

      <!-- Question Area (shown during question phase) -->
      <div v-if="phase === 'question'" class="mb-3">
        <div class="card-dark mb-3">
          <p class="text-xs text-white/50 mb-1">{{ currentQuestion.label }}</p>
          <p class="text-lg font-bold">{{ currentQuestion.prompt }}</p>
          <button v-if="currentQuestion.type === 'listen-meaning'"
                  @click="speakWord" class="mt-2 bg-white/10 rounded-full px-3 py-1 text-sm active:scale-[0.97]">
            🔊 听发音
          </button>
        </div>
        <!-- Spelling input -->
        <input v-if="currentQuestion.type === 'spelling'"
               v-model="spellingInput" @keyup.enter="submitSpelling"
               class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-lg text-white text-center focus:outline-none focus:border-amber-400"
               placeholder="输入英文..." autocomplete="off" />
        <!-- Choice buttons -->
        <div v-else class="grid grid-cols-2 gap-2">
          <button v-for="(opt, i) in currentQuestion.options" :key="i"
                  @click="submitAnswer(opt.correct, opt.text)"
                  class="py-3 px-3 rounded-xl text-sm font-bold border transition-all active:scale-[0.97]"
                  :class="opt.selected
                    ? (opt.correct ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300' : 'bg-red-500/30 border-red-400 text-red-300')
                    : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'">
            {{ opt.text }}
          </button>
        </div>
      </div>

      <!-- Weapon Selection (shown during choose-weapon phase) -->
      <div v-if="phase === 'choose-weapon'" class="grid grid-cols-3 gap-2">
        <button v-for="w in availableWeapons" :key="w.id"
                @click="selectWeapon(w)"
                class="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all active:scale-[0.97]"
                :class="game.state.equippedWeapon === w.id
                  ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 border-white/10'">
          <span class="text-2xl">{{ w.emoji }}</span>
          <span class="text-xs font-bold">{{ w.name }}</span>
          <span class="text-[10px] text-amber-400">⚔️{{ w.damage }}</span>
        </button>
      </div>

      <!-- Continue button -->
      <div v-if="phase === 'intro'" class="text-center">
        <button @click="startBattle" class="btn-primary text-base px-8">⚔️ 开始挑战</button>
      </div>
    </div>
  </div>

  <!-- Victory Screen -->
  <div v-if="phase === 'victory'" class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/30 to-zelda-darker px-6">
    <div class="text-6xl mb-4 animate-bounce-slow">🎉</div>
    <h1 class="text-2xl font-black text-amber-400 mb-2">Boss 击败！</h1>
    <p class="text-white/60 mb-6">"{{ bossData.dialogues.victory }}"</p>
    <div class="card-dark mb-6 w-full max-w-xs text-center">
      <p class="text-3xl font-black text-amber-400 mb-2">⭐ +{{ bossData.rewards.stars }}</p>
      <div class="flex justify-center gap-3 text-sm text-white/70">
        <span v-if="hasGift">🎁 神秘礼物!</span>
        <span>{{ chestNames[bossData.rewards.chest] }} 宝箱</span>
      </div>
    </div>
    <button @click="goBack" class="btn-gold">继续冒险 →</button>
  </div>

  <!-- Retreat Screen -->
  <div v-if="phase === 'retreat'" class="min-h-screen flex flex-col items-center justify-center bg-zelda-darker px-6">
    <div class="text-5xl mb-4">😅</div>
    <h1 class="text-xl font-bold text-white/80 mb-2">暂时撤退</h1>
    <p class="text-white/50 text-sm mb-2 text-center">别灰心！复习一下单词，再来挑战！</p>
    <div v-if="bossHp > 0 && bossHp < bossData.maxHp" class="mb-4 text-center">
      <p class="text-amber-400 text-sm">Boss 还剩 <strong>{{ bossHp }}/{{ bossData.maxHp }}</strong> HP</p>
      <p class="text-white/40 text-xs">下次再来会从当前血量继续</p>
    </div>
    <p class="text-amber-400 text-sm mb-6">提示：尝试更多武器类型获取更高伤害</p>
    <button @click="goBack" class="btn-primary">← 返回冒险</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { allBosses } from '../data/bosses'
import { getWordsByModule, getRandomWord, getWrongOptions } from '../data/words'
import { weaponTypes } from '../data/weapons'

const router = useRouter()
const route = useRoute()
const game = useGameStore()

const bossId = route.params.bossId || 'm1_boss'
const _rawBoss = allBosses[bossId] || allBosses.m1_boss
const bossData = computed(() => ({
  ..._rawBoss,
  bgGradient: _rawBoss.bgGradient || 'bg-gradient-to-b from-gray-900 via-gray-950 to-black',
  dialogues: {
    intro: _rawBoss.dialogues?.intro || 'Ready to fight?',
    weak: _rawBoss.dialogues?.weak || "No... I'm getting weaker!",
    defeat: _rawBoss.dialogues?.defeat || 'Defeated!',
    attack: _rawBoss.dialogues?.attack || 'Answer my question!',
    hit: _rawBoss.dialogues?.hit || 'Ouch! Correct!',
    miss: _rawBoss.dialogues?.miss || 'Wrong! Try again!',
    victory: _rawBoss.dialogues?.victory || 'You win! Great job!',
    ...(_rawBoss.dialogues || {}),
  },
  rewards: {
    stars: _rawBoss.rewards?.stars || 30,
    chest: _rawBoss.rewards?.chest || 'iron',
    giftChance: _rawBoss.rewards?.giftChance || 0,
    ...(_rawBoss.rewards || {}),
  },
}))

const phase = ref('intro') // intro, choose-weapon, question, victory, retreat
const bossHp = ref(0)
const combo = ref(0)
const bossShaking = ref(false)
const bossDialogue = ref('')
const damageFloats = ref([])
const currentQuestion = ref(null)
const selectedWeapon = ref(null)
const spellingInput = ref('')
const hasGift = ref(false)
const difficulty = ref('normal') // normal, easy — 自适应难度
let floatId = 0

const itemEmojis = { heartApple: '🍎', fairyHoney: '🍯', woodShield: '🛡️', knightShield: '🔰', bomb: '💣', fireArrowItem: '🚀', iceArrowItem: '❄️', fairyPotion: '🧪' }
const chestNames = { iron: '🪙 铁', silver: '🥈 银', gold: '🥇 金', master: '🎁 大师' }

const hpBarColor = computed(() => {
  const pct = bossHp.value / bossData.value.maxHp
  if (pct > 0.6) return 'bg-gradient-to-r from-emerald-500 to-green-400'
  if (pct > 0.3) return 'bg-gradient-to-r from-amber-500 to-yellow-400'
  return 'bg-gradient-to-r from-red-600 to-red-400'
})

const availableWeapons = computed(() => {
  return Object.values(weaponTypes).filter(w => {
    if (w.type === 'ultimate') return combo.value >= 3
    if (w.type === 'grammar') return true // prototype: all available
    if (w.type === 'listen') return true
    return true
  })
})

function speakWord() {
  if (currentQuestion.value?.word && 'speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(currentQuestion.value.word)
    u.lang = 'en-US'; u.rate = 0.8
    speechSynthesis.speak(u)
  }
}

function startBattle() {
  // 恢复上次撤退时的Boss血量
  const savedHp = game.getBossHp(bossId)
  bossHp.value = savedHp !== null ? savedHp : bossData.value.maxHp
  phase.value = 'choose-weapon'
  bossDialogue.value = bossData.value.dialogues.intro
}

function selectWeapon(weapon) {
  selectedWeapon.value = weapon
  generateQuestion(weapon)
}

function generateQuestion(weapon) {
  const moduleWords = getWordsByModule(bossData.value.module)
  const word = moduleWords.length > 0
    ? moduleWords[Math.floor(Math.random() * moduleWords.length)]
    : getRandomWord()

  const wrongs = getWrongOptions(word)
  let q = { word, weapon, type: weapon.questionType, label: '', prompt: '', options: [], correctAnswer: '' }

  // 自适应难度：easy 模式给出更多提示
  const isEasy = difficulty.value === 'easy'
  const hintTag = isEasy ? '（简单模式 - 有提示哦）' : ''

  switch (weapon.questionType) {
    case 'image-choice':
      q.label = `🗡️ ${weapon.name} — 看意思选单词${hintTag}`
      q.prompt = isEasy ? `${word.meaning}（首字母：${word.word[0]}_）` : `${word.meaning}`
      q.options = shuffle([
        { text: word.word, correct: true },
        ...wrongs.map(w => ({ text: w.word, correct: false }))
      ])
      q.correctAnswer = word.word
      break

    case 'meaning-choice':
      q.label = `⚔️ ${weapon.name} — 看单词选意思${hintTag}`
      q.prompt = `${word.word} ${word.phonetic}`
      q.options = shuffle([
        { text: word.meaning, correct: true },
        ...wrongs.map(w => ({ text: w.meaning, correct: false }))
      ])
      // easy 模式高亮正确答案的区域提示
      if (isEasy) {
        q.options = q.options.map(o => ({
          ...o,
          hint: o.correct ? '⭐' : ''
        }))
      }
      q.correctAnswer = word.meaning
      break

    case 'grammar-fill':
      q.label = `🪄 ${weapon.name} — 语法填空${hintTag}`
      const templates = [
        { prompt: 'A: What ___ your father do?\nB: He ___ a pilot.', answer: 'does', options: ['does', 'do', 'is', 'are'] },
        { prompt: 'Where ___ she work?\nShe works ___ a hospital.', answer: 'does', options: ['does', 'do', 'is', 'are'] },
        { prompt: 'I ___ a pilot. I ___ between America and Japan.', answer: 'am', options: ['am', 'is', 'are', 'be'] },
      ]
      const t = templates[Math.floor(Math.random() * templates.length)]
      q.prompt = t.prompt + (isEasy ? `\n💡 提示：答案是 "${t.answer[0]}${'_'.repeat(t.answer.length - 1)}"` : '')
      q.options = shuffle([
        { text: t.answer, correct: true },
        ...t.options.filter(o => o !== t.answer).map(o => ({ text: o, correct: false }))
      ])
      q.correctAnswer = t.answer
      break

    case 'listen-meaning':
      q.label = `🔥 ${weapon.name} — 听音辨义${hintTag}`
      q.prompt = `🔊 点击听发音，选择正确的意思` + (isEasy ? `\n💡 提示：首字母 ${word.word[0]}_` : '')
      q.word = word.word
      q.options = shuffle([
        { text: word.meaning, correct: true },
        ...wrongs.map(w => ({ text: w.meaning, correct: false }))
      ])
      q.correctAnswer = word.meaning
      break

    case 'spelling':
      q.label = `🏹 ${weapon.name} — 拼写挑战${hintTag}`
      q.prompt = isEasy
        ? `${word.meaning}（${word.phonetic}）\n💡 提示：${word.word[0]}${'_'.repeat(word.word.length - 1)}（共${word.word.length}个字母）`
        : `${word.meaning}（${word.phonetic}）`
      q.correctAnswer = word.word
      q.options = []
      spellingInput.value = ''
      break

    case 'combo-ultimate':
      q.label = `⚡ 必杀技! — 连击×3`
      q.prompt = '连续答对3题触发必杀！\n自由回答任意一个Module 1的单词：'
      q.options = moduleWords.slice(0, 4).map(w => ({ text: w.word, correct: true }))
      q.correctAnswer = '*'
      break
  }

  currentQuestion.value = q
  phase.value = 'question'
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

function submitAnswer(correct, text) {
  // Prevent double click
  if (currentQuestion.value.answered) return
  currentQuestion.value.answered = true

  // Mark selection
  currentQuestion.value.options = currentQuestion.value.options.map(o => ({
    ...o, selected: o.text === text
  }))

  if (correct) {
    handleCorrect()
  } else {
    handleWrong()
  }
}

function submitSpelling() {
  if (!currentQuestion.value || currentQuestion.value.answered) return
  const input = spellingInput.value.trim().toLowerCase()
  const correct = input === currentQuestion.value.correctAnswer.toLowerCase()
  currentQuestion.value.answered = true
  correct ? handleCorrect() : handleWrong()
}

function handleCorrect() {
  const dmg = selectedWeapon.value.damage
  bossHp.value = Math.max(0, bossHp.value - dmg)
  combo.value++
  game.addStars(dmg)
  game.recordAnswer(true)

  // 自适应难度：连对3题升级到normal
  if (combo.value >= 3) difficulty.value = 'normal'

  // 保存Boss血量
  game.saveBossHp(bossId, bossHp.value)

  // Effects
  triggerBossShake()
  showDamageFloat(dmg, dmg >= 3 ? 'text-amber-400' : 'text-white')
  bossDialogue.value = bossData.value.dialogues.hit

  // Check boss defeat
  setTimeout(() => {
    if (bossHp.value <= 0) {
      handleVictory()
    } else {
      // Next turn
      selectedWeapon.value = null
      currentQuestion.value = null
      if (combo.value >= 3) {
        phase.value = 'choose-weapon' // Show master sword option
      } else {
        phase.value = 'choose-weapon'
      }
    }
  }, 1200)
}

function handleWrong() {
  combo.value = 0
  game.recordAnswer(false)
  bossDialogue.value = bossData.value.dialogues.miss

  // 自适应难度：连续答错降级到easy
  difficulty.value = 'easy'

  // 保存Boss血量
  game.saveBossHp(bossId, bossHp.value)

  // Boss counterattack
  setTimeout(() => {
    // Check shield
    const hasShield = game.useItem('woodShield') || game.useItem('knightShield')
    if (hasShield) {
      bossDialogue.value = '🛡️ 盾牌挡住了攻击！'
    } else {
      game.takeDamage(1)
      if (game.state.hp <= 0) {
        phase.value = 'retreat'
        return
      }
    }

    selectedWeapon.value = null
    currentQuestion.value = null
    phase.value = 'choose-weapon'
  }, 1500)
}

function handleVictory() {
  phase.value = 'victory'
  game.defeatBoss(bossId)
  game.addStars(bossData.value.rewards.stars)
  game.clearBossHp(bossId) // 清除保存的血量

  // Gift chance
  if (Math.random() < (bossData.value.rewards.giftChance || 0)) {
    hasGift.value = true
    game.addGiftCoupon()
  }

  // Daily login reward
  game.updateStreak()
  game.addItem('heartApple', 2)
}

function useItem(itemId) {
  if (phase.value !== 'choose-weapon' && phase.value !== 'question') return

  const used = game.useItem(itemId)
  if (!used) return

  switch (itemId) {
    case 'heartApple':
      game.heal(1)
      break
    case 'fairyHoney':
      game.fullHeal()
      break
    case 'bomb':
      bossHp.value = Math.max(0, bossHp.value - 2)
      triggerBossShake()
      showDamageFloat(2, 'text-orange-400')
      if (bossHp.value <= 0) handleVictory()
      break
    case 'fairyPotion':
      // Reveal correct answer
      if (currentQuestion.value?.options) {
        currentQuestion.value.options = currentQuestion.value.options.map(o => ({
          ...o,
          style: o.correct ? 'ring-2 ring-amber-400' : 'opacity-30'
        }))
      }
      break
    case 'fireArrowItem':
      bossHp.value = Math.max(0, bossHp.value - 3)
      triggerBossShake()
      showDamageFloat(3, 'text-red-400')
      if (bossHp.value <= 0) handleVictory()
      break
  }
}

function triggerBossShake() {
  bossShaking.value = true
  setTimeout(() => bossShaking.value = false, 500)
}

function showDamageFloat(amount, color) {
  const id = floatId++
  const x = 40 + Math.random() * 20
  const y = 30 + Math.random() * 10
  damageFloats.value.push({ id, amount, color, x, y })
  setTimeout(() => {
    damageFloats.value = damageFloats.value.filter(d => d.id !== id)
  }, 1000)
}

function retreat() { phase.value = 'retreat' }
function goBack() { router.push('/adventure') }

onMounted(() => {
  game.updateStreak()
  game.fullHeal()
  bossDialogue.value = ''
  // 恢复保存的Boss血量
  const savedHp = game.getBossHp(bossId)
  bossHp.value = savedHp !== null ? savedHp : bossData.value.maxHp
})
</script>
