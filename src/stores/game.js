import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { allWords } from '../data/words'
import { achievementDefs } from '../data/achievements'

const LEVEL_TITLES = [
  { level: 1, title: '英语萌新', emoji: '🐣', starsNeeded: 0 },
  { level: 5, title: '单词猎人', emoji: '🏹', starsNeeded: 100 },
  { level: 10, title: '拼读达人', emoji: '📖', starsNeeded: 300 },
  { level: 15, title: '语法高手', emoji: '🧙', starsNeeded: 600 },
  { level: 20, title: '英语小能手', emoji: '⭐', starsNeeded: 1000 },
  { level: 30, title: '至尊学霸', emoji: '👑', starsNeeded: 2000 },
]

const SAVE_KEY = 'english-hero-game'
const PIN_KEY = 'english-hero-pin'

function loadLocal() {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null } catch { return null }
}
function saveLocal(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data))
}

const defaults = {
  playerName: '小勇者',
  totalStars: 0, exp: 0, level: 1,
  hp: 5, maxHp: 5,
  streak: 0, lastPlayDate: null, totalPlayDays: 0,
  totalTimeMinutes: 0, totalWordsLearned: 0,
  totalBossDefeated: 0, totalCorrect: 0, totalAnswered: 0,
  weapons: { woodSword: 100, knightSword: 80, spiritBow: 60 },
  equippedWeapon: 'knightSword',
  items: { heartApple: 3, bomb: 2 },
  ownedSkins: [], equippedSkins: { avatar: null, background: null, title: null },
  giftCoupons: 0, defeatedBosses: [],
  bossHpMap: {}, // { bossId: remainingHp } — 撤退保留Boss血量
  unlockedAchievements: [], // 已解锁成就ID列表
  giftsRedeemed: 0, // 已兑换礼物数
  dailyTasksDone: [], todayStarsEarned: 0,
  bossHpMap: {},
  // Phase 0: 学习进度
  wordProgress: {},
  moduleProgress: {},
  todayLearned: [],
  customMemoryHints: {},
}

export const useGameStore = defineStore('game', () => {
  const saved = loadLocal()
  const state = ref(saved ? { ...defaults, ...saved } : { ...defaults })
  const pin = ref(localStorage.getItem(PIN_KEY) || '')
  const cloudOk = ref(false)
  let syncTimer = null

  if (saved?.lastPlayDate) {
    const diff = Math.floor((Date.now() - new Date(saved.lastPlayDate).getTime()) / 86400000)
    if (diff > 1) state.value.streak = 0
  }

  function persist() {
    saveLocal(state.value)
    if (pin.value) {
      clearTimeout(syncTimer)
      syncTimer = setTimeout(() => {
        supabase.from('hero_game_state')
          .upsert({ pin: pin.value, state: state.value }, { onConflict: 'pin' })
          .then(() => { cloudOk.value = true })
          .catch(e => console.warn('Cloud push failed:', e.message))
      }, 2000)
    }
  }

  function pullCloud() {
    if (!pin.value) return
    supabase.from('hero_game_state')
      .select('state').eq('pin', pin.value).single()
      .then(({ data }) => {
        if (data?.state) {
          const cloud = data.state
          const merged = { ...defaults, ...cloud }
          if (state.value.lastPlayDate && cloud.lastPlayDate) {
            if (new Date(state.value.lastPlayDate) > new Date(cloud.lastPlayDate)) {
              merged.streak = state.value.streak
              merged.lastPlayDate = state.value.lastPlayDate
              merged.todayStarsEarned = state.value.todayStarsEarned
              merged.dailyTasksDone = state.value.dailyTasksDone
            }
          }
          state.value = merged
          saveLocal(state.value)
          cloudOk.value = true
        }
      })
      .catch(e => console.warn('Cloud pull failed:', e.message))
  }

  function setPin(p) { pin.value = p; localStorage.setItem(PIN_KEY, p) }

  function login(newPin, cloudState) {
    setPin(newPin)
    if (cloudState && Object.keys(cloudState).length > 0) {
      const merged = { ...defaults, ...cloudState }
      if (state.value.totalStars > (cloudState.totalStars || 0)) {
        persist()
      } else {
        state.value = merged
        saveLocal(state.value)
      }
    } else {
      persist()
    }
    // 每日衰减 + 同步
    decayAllDurability()
    setInterval(pullCloud, 60000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') pullCloud()
    })
  }

  // ===== Computed =====
  const levelInfo = computed(() => {
    const current = LEVEL_TITLES.filter(l => l.level <= state.value.level).pop()
    const next = LEVEL_TITLES.find(l => l.level > state.value.level)
    return { ...current, next, expToNext: next ? next.starsNeeded - state.value.totalStars : 0 }
  })
  const correctRate = computed(() =>
    state.value.totalAnswered > 0 ? Math.round(state.value.totalCorrect / state.value.totalAnswered * 100) : 0
  )
  const isLoggedIn = computed(() => !!pin.value)

  // ===== 学习进度方法 =====

  // 学会一个单词
  function learnWordById(wordId) {
    const wp = state.value.wordProgress
    if (!wp[wordId]) {
      wp[wordId] = { status: 'learned', learnedAt: Date.now(), durability: 100, lastReview: Date.now(), reviewCount: 0 }
      state.value.totalWordsLearned++
    } else {
      wp[wordId].status = 'learned'
      wp[wordId].learnedAt = Date.now()
      wp[wordId].durability = 100
      wp[wordId].lastReview = Date.now()
    }
    // 今日已学记录
    if (!state.value.todayLearned.includes(wordId)) {
      state.value.todayLearned.push(wordId)
    }
    // 更新模块进度
    const modId = extractModuleId(wordId)
    if (modId) updateModuleProgress(modId)
    addStars(1)
    checkAchievements()
    persist()
  }

  // ===== SRS 遗忘曲线参数 =====
  // reviewCount 对应复习间隔（天）和每日衰减率
  const SRS_LEVELS = [
    { reviews: 0, intervalDays: 1, dailyDecay: 25, label: '木剑 ⚔️' },
    { reviews: 1, intervalDays: 3, dailyDecay: 15, label: '骑士剑 🗡️' },
    { reviews: 2, intervalDays: 7, dailyDecay: 8, label: '精灵弓 🏹' },
    { reviews: 3, intervalDays: 14, dailyDecay: 4, label: '大师剑 ⚡' },
  ]

  function getSrsLevel(reviewCount) {
    const rc = Math.max(0, reviewCount || 0)
    return SRS_LEVELS[Math.min(rc, SRS_LEVELS.length - 1)]
  }

  // 获取单词的"武器"等级名称
  function getWordWeaponLabel(wordId) {
    const wp = state.value.wordProgress[wordId]
    if (!wp || wp.status === 'new') return '未获得'
    if (wp.status === 'forgotten') return '已碎裂 💔'
    const level = getSrsLevel(wp.reviewCount)
    return level.label
  }

  // 获取单词的武器 emoji
  function getWordWeaponEmoji(wordId) {
    const wp = state.value.wordProgress[wordId]
    if (!wp || wp.status === 'new') return '🔒'
    if (wp.status === 'forgotten') return '💔'
    const level = getSrsLevel(wp.reviewCount)
    const emojis = ['⚔️', '🗡️', '🏹', '⚡']
    return emojis[Math.min(wp.reviewCount || 0, emojis.length - 1)]
  }

  // 获取武器列表（所有已学单词作为武器卡片）
  function getWeaponArsenal() {
    return Object.entries(state.value.wordProgress || {})
      .filter(([_, p]) => p.status !== 'new')
      .map(([wordId, p]) => {
        const word = allWords.find(w => w.id === wordId)
        const srsLevel = getSrsLevel(p.reviewCount || 0)
        return {
          wordId,
          word: word?.word || wordId,
          meaning: word?.meaning || '',
          phonetic: word?.phonetic || '',
          status: p.status, // learned / forgotten
          durability: p.durability || 0,
          reviewCount: p.reviewCount || 0,
          weaponLabel: srsLevel.label,
          weaponEmoji: getWordWeaponEmoji(wordId),
          lastReview: p.lastReview,
          learnedAt: p.learnedAt,
        }
      })
      .sort((a, b) => {
        // 碎裂的排最前（需要复习），然后按耐久度升序
        if (a.status === 'forgotten' && b.status !== 'forgotten') return -1
        if (a.status !== 'forgotten' && b.status === 'forgotten') return 1
        return a.durability - b.durability
      })
  }

  // 获取武器统计
  const weaponStats = computed(() => {
    const arsenal = getWeaponArsenal()
    return {
      total: arsenal.length,
      shattered: arsenal.filter(w => w.status === 'forgotten').length,
      critical: arsenal.filter(w => w.durability > 0 && w.durability <= 25).length,
      healthy: arsenal.filter(w => w.durability > 50).length,
    }
  })

  // 每日耐久度衰减（SRS 版 — 登录时调用）
  function decayAllDurability() {
    const today = new Date().toDateString()
    if (state.value.lastDecayDate === today) return
    state.value.lastDecayDate = today
    const wp = state.value.wordProgress
    let forgotten = 0
    for (const wordId in wp) {
      if (wp[wordId].status === 'new' || wp[wordId].status === 'forgotten') continue
      const srsLevel = getSrsLevel(wp[wordId].reviewCount)
      wp[wordId].durability = Math.max(0, (wp[wordId].durability || 100) - srsLevel.dailyDecay)
      if (wp[wordId].durability <= 0) {
        wp[wordId].status = 'forgotten'
        forgotten++
        // 更新 moduleProgress
        const moduleId = extractModuleId(wordId)
        if (moduleId && state.value.moduleProgress[`m${moduleId}`]) {
          state.value.moduleProgress[`m${moduleId}`].wordsLearned = Math.max(0, (state.value.moduleProgress[`m${moduleId}`].wordsLearned || 1) - 1)
        }
      }
    }
    persist()
  }

  // 获取需要复习的单词ID列表（SRS 智能调度）
  function getReviewQueue(limit = 10) {
    const wp = state.value.wordProgress
    const now = Date.now()
    const queue = []

    for (const wordId in wp) {
      const p = wp[wordId]
      if (p.status === 'new' || p.status === 'forgotten') continue

      const srsLevel = getSrsLevel(p.reviewCount)
      const lastReview = p.lastReview ? new Date(p.lastReview).getTime() : p.learnedAt || now
      const daysSinceReview = (now - lastReview) / 86400000

      // 如果距上次复习超过间隔天数，或者耐久度低于阈值，加入队列
      const needsReview = daysSinceReview >= srsLevel.intervalDays || p.durability < 40

      if (needsReview) {
        queue.push({
          wordId,
          urgency: p.durability, // 越低越紧急
          overdue: daysSinceReview - srsLevel.intervalDays,
        })
      }
    }

    // 按紧急度排序（耐久度最低 → 逾期最长）
    queue.sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency - b.urgency
      return b.overdue - a.overdue
    })

    return queue.slice(0, limit).map(q => q.wordId)
  }

  // 复习一个单词（SRS 增强版）
  function reviewWord(wordId, correct) {
    const wp = state.value.wordProgress
    if (!wp[wordId]) return
    wp[wordId].lastReview = Date.now()
    wp[wordId].reviewCount = (wp[wordId].reviewCount || 0) + 1
    if (correct) {
      // 答对：耐久度恢复，恢复量随 SRS 等级增加
      const restoreAmount = 25 + (wp[wordId].reviewCount * 5) // 30, 35, 40, 45...
      wp[wordId].durability = Math.min(100, (wp[wordId].durability || 50) + restoreAmount)
      addStars(1)
    } else {
      // 答错：降级 SRS 等级 + 扣耐久
      wp[wordId].reviewCount = Math.max(0, (wp[wordId].reviewCount || 1) - 1) // 降一级
      wp[wordId].durability = Math.max(0, (wp[wordId].durability || 50) - 15)
    }
    persist()
  }

  // 获取需要复习的单词数量
  const reviewCount = computed(() => {
    const wp = state.value.wordProgress
    const now = Date.now()
    let count = 0
    for (const wordId in wp) {
      const p = wp[wordId]
      if (p.status === 'new' || p.status === 'forgotten') continue
      const srsLevel = getSrsLevel(p.reviewCount)
      const lastReview = p.lastReview ? new Date(p.lastReview).getTime() : p.learnedAt || now
      const daysSinceReview = (now - lastReview) / 86400000
      if (daysSinceReview >= srsLevel.intervalDays || p.durability < 40) count++
    }
    return count
  })

  // 遗忘一个单词（耐久归零，回到待学）
  function forgetWord(wordId) {
    const wp = state.value.wordProgress
    if (!wp[wordId]) return
    wp[wordId].status = 'new'
    wp[wordId].durability = 0
    wp[wordId].reviewCount = 0
    // 更新 moduleProgress
    const moduleId = extractModuleId(wordId)
    if (moduleId && state.value.moduleProgress[`m${moduleId}`]) {
      state.value.moduleProgress[`m${moduleId}`].wordsLearned = Math.max(0, (state.value.moduleProgress[`m${moduleId}`].wordsLearned || 1) - 1)
    }
    persist()
  }

  // 从 wordId 提取 moduleId：m1_w01 → 1
  function extractModuleId(wordId) {
    const m = wordId.match(/^m(\d+)/)
    return m ? parseInt(m[1]) : null
  }

  // 模块学习进度
  function getModuleLearnedCount(moduleId) {
    return Object.entries(state.value.wordProgress || {}).filter(([id, p]) => {
      return p.status === 'learned' && extractModuleId(id) === moduleId
    }).length
  }

  function updateModuleProgress(moduleId) {
    const key = `m${moduleId}`
    if (!state.value.moduleProgress[key]) {
      state.value.moduleProgress[key] = { wordsLearned: 0, unlocked: true, bossDefeated: false }
    }
    state.value.moduleProgress[key].wordsLearned = getModuleLearnedCount(moduleId)
    persist()
  }

  function getModuleWordStatus(moduleId, wordId) {
    return state.value.wordProgress[wordId]?.status || 'new'
  }

  // 获取上次学习位置
  function getLastLearnPosition() {
    const today = new Date().toDateString()
    if (state.value.lastPlayDate !== today) return null
    return state.value.lastLearnModule || null
  }

  function setLastLearnPosition(moduleId) {
    state.value.lastLearnModule = moduleId
    persist()
  }

  // 保存用户自定义记忆法
  function saveCustomHint(wordId, hint) {
    state.value.customMemoryHints[wordId] = hint
    persist()
  }

  // ===== Boss HP 持久化 =====
  function getBossHp(bossId) {
    return state.value.bossHpMap?.[bossId] ?? null
  }
  function saveBossHp(bossId, hp) {
    if (!state.value.bossHpMap) state.value.bossHpMap = {}
    state.value.bossHpMap[bossId] = hp
    persist()
  }
  function clearBossHp(bossId) {
    if (!state.value.bossHpMap) return
    delete state.value.bossHpMap[bossId]
    persist()
  }

  // ===== 旧方法（保持兼容）=====
  function addStars(n) {
    state.value.totalStars += n
    state.value.todayStarsEarned += n
    const t = [...LEVEL_TITLES].reverse().find(l => state.value.totalStars >= l.starsNeeded)
    if (t) state.value.level = t.level
    persist()
  }
  function recordAnswer(ok) { state.value.totalAnswered++; if (ok) state.value.totalCorrect++; persist() }
  function takeDamage(n = 1) { state.value.hp = Math.max(0, state.value.hp - n); persist() }
  function heal(n) { state.value.hp = Math.min(state.value.maxHp, state.value.hp + n); persist() }
  function fullHeal() { state.value.hp = state.value.maxHp; persist() }
  function addItem(id, n = 1) { state.value.items[id] = (state.value.items[id] || 0) + n; persist() }
  function useItem(id) { if ((state.value.items[id] || 0) > 0) { state.value.items[id]--; persist(); return true } return false }
  function defeatBoss(id) { if (!state.value.defeatedBosses.includes(id)) { state.value.defeatedBosses.push(id); state.value.totalBossDefeated++; checkAchievements() } persist() }
  function saveBossHp(bossId, hp) { state.value.bossHpMap[bossId] = hp; persist() }
  function getBossHp(bossId) { return state.value.bossHpMap[bossId] || null }
  function clearBossHp(bossId) { delete state.value.bossHpMap[bossId]; persist() }
  function addGiftCoupon() { state.value.giftCoupons++; persist() }
  function useGiftCoupon() { if (state.value.giftCoupons > 0) { state.value.giftCoupons--; persist(); return true } return false }
  function redeemGift() { state.value.giftsRedeemed = (state.value.giftsRedeemed || 0) + 1; persist() }

  // ===== 成就系统 =====
  // 检查并解锁新成就，返回新解锁的成就列表
  function checkAchievements() {
    const newOnes = []
    for (const ach of achievementDefs) {
      if (state.value.unlockedAchievements.includes(ach.id)) continue
      if (ach.condition(state.value)) {
        state.value.unlockedAchievements.push(ach.id)
        // 发放奖励
        if (ach.reward?.stars) addStars(ach.reward.stars)
        if (ach.reward?.item) addItem(ach.reward.item, ach.reward.itemCount || 1)
        if (ach.reward?.giftCoupon) addGiftCoupon()
        newOnes.push(ach)
      }
    }
    if (newOnes.length > 0) persist()
    return newOnes
  }

  // 获取所有成就（含解锁状态）
  function getAllAchievements() {
    return achievementDefs.map(ach => ({
      ...ach,
      unlocked: state.value.unlockedAchievements.includes(ach.id),
    }))
  }

  // 获取已解锁成就数量
  const achievementCount = computed(() => state.value.unlockedAchievements?.length || 0)
  function updateStreak() {
    const today = new Date().toDateString()
    if (state.value.lastPlayDate !== today) {
      const last = state.value.lastPlayDate ? new Date(state.value.lastPlayDate) : null
      const diff = last ? Math.floor((new Date(today) - last) / 86400000) : 999
      state.value.streak = diff <= 1 ? state.value.streak + 1 : 1
      state.value.lastPlayDate = today
      state.value.totalPlayDays++
      state.value.todayStarsEarned = 0
      state.value.dailyTasksDone = []
      state.value.todayLearned = []
      persist()
      checkAchievements()
    }
  }
  function addTimeMinutes(m) { state.value.totalTimeMinutes += m; persist() }
  function resetGame() { state.value = { ...defaults }; persist() }
  function logout() {
    pin.value = ''; localStorage.removeItem(PIN_KEY)
    state.value = { ...defaults }; saveLocal(state.value)
    cloudOk.value = false
  }

  return {
    state, pin, levelInfo, correctRate, isLoggedIn, cloudOk,
    addStars, recordAnswer, takeDamage, heal, fullHeal,
    addItem, useItem, defeatBoss,
    addGiftCoupon, useGiftCoupon, updateStreak,
    addTimeMinutes, resetGame, persist,
    login, logout, setPin, pullCloud,
    // 新方法
    learnWordById, reviewWord, decayAllDurability, forgetWord,
    getReviewQueue, reviewCount,
    getModuleLearnedCount, getModuleWordStatus,
    getLastLearnPosition, setLastLearnPosition, updateModuleProgress,
    saveCustomHint, getBossHp, saveBossHp, clearBossHp,
    // Phase 2: 武器系统
    getWeaponArsenal, weaponStats, getWordWeaponLabel, getWordWeaponEmoji,
    getSrsLevel,
    // Phase 2: Boss血量
    saveBossHp, getBossHp, clearBossHp,
    // Phase 4: 成就 + 礼物
    checkAchievements, getAllAchievements, achievementCount,
    redeemGift,
  }
})
