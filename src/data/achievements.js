// ===== Achievement Definitions =====
// Phase 4.2: 成就系统

export const achievementDefs = [
  // 学习里程碑
  {
    id: 'first_word',
    name: '初出茅庐',
    desc: '学会第一个单词',
    emoji: '🌟',
    condition: (state) => state.totalWordsLearned >= 1,
    reward: { stars: 5 },
    category: 'learning',
  },
  {
    id: 'words_10',
    name: '单词猎人',
    desc: '学会 10 个单词',
    emoji: '📚',
    condition: (state) => state.totalWordsLearned >= 10,
    reward: { stars: 20 },
    category: 'learning',
  },
  {
    id: 'words_50',
    name: '词汇达人',
    desc: '学会 50 个单词',
    emoji: '📖',
    condition: (state) => state.totalWordsLearned >= 50,
    reward: { stars: 100 },
    category: 'learning',
  },
  {
    id: 'words_104',
    name: '英语小能手',
    desc: '学会全部 104 个单词',
    emoji: '🎓',
    condition: (state) => state.totalWordsLearned >= 104,
    reward: { stars: 500 },
    category: 'learning',
  },

  // 连续学习
  {
    id: 'streak_3',
    name: '三天不打烊',
    desc: '连续学习 3 天',
    emoji: '🔥',
    condition: (state) => state.streak >= 3,
    reward: { stars: 15 },
    category: 'streak',
  },
  {
    id: 'streak_7',
    name: '一周坚持',
    desc: '连续学习 7 天',
    emoji: '💪',
    condition: (state) => state.streak >= 7,
    reward: { stars: 50, item: 'heartApple', itemCount: 3 },
    category: 'streak',
  },
  {
    id: 'streak_30',
    name: '月度学霸',
    desc: '连续学习 30 天',
    emoji: '👑',
    condition: (state) => state.streak >= 30,
    reward: { stars: 300, item: 'fairyHoney', itemCount: 2 },
    category: 'streak',
  },

  // 星星收集
  {
    id: 'stars_100',
    name: '百星闪耀',
    desc: '累计获得 100 颗星星',
    emoji: '⭐',
    condition: (state) => state.totalStars >= 100,
    reward: { stars: 0 },
    category: 'stars',
  },
  {
    id: 'stars_500',
    name: '星辰大海',
    desc: '累计获得 500 颗星星',
    emoji: '🌌',
    condition: (state) => state.totalStars >= 500,
    reward: { stars: 0 },
    category: 'stars',
  },
  {
    id: 'stars_2000',
    name: '至尊学霸',
    desc: '累计获得 2000 颗星星',
    emoji: '🏅',
    condition: (state) => state.totalStars >= 2000,
    reward: { stars: 0 },
    category: 'stars',
  },

  // Boss 战斗
  {
    id: 'first_boss',
    name: '初次胜利',
    desc: '击败第一个 Boss',
    emoji: '⚔️',
    condition: (state) => state.totalBossDefeated >= 1,
    reward: { stars: 30 },
    category: 'battle',
  },
  {
    id: 'bosses_3',
    name: '半路英雄',
    desc: '击败 3 个 Boss',
    emoji: '🗡️',
    condition: (state) => state.totalBossDefeated >= 3,
    reward: { stars: 100 },
    category: 'battle',
  },
  {
    id: 'all_bosses',
    name: '拯救英语世界',
    desc: '击败全部 Boss',
    emoji: '🏆',
    condition: (state) => state.totalBossDefeated >= 8, // 6 main + mini bosses
    reward: { stars: 500, giftCoupon: 1 },
    category: 'battle',
  },

  // 武器升级
  {
    id: 'weapon_10',
    name: '武器收藏家',
    desc: '拥有 10 把武器',
    emoji: '🗡️',
    condition: (state) => {
      return Object.values(state.wordProgress || {}).filter(p => p.status === 'learned').length >= 10
    },
    reward: { stars: 30 },
    category: 'weapon',
  },
  {
    id: 'master_sword',
    name: '大师之剑',
    desc: '将一个单词升级到大师剑等级',
    emoji: '⚡',
    condition: (state) => {
      return Object.values(state.wordProgress || {}).some(p => p.reviewCount >= 5 && p.status === 'learned')
    },
    reward: { stars: 50 },
    category: 'weapon',
  },

  // 礼物兑换
  {
    id: 'first_gift',
    name: '神秘礼物',
    desc: '兑换第一份现实礼物',
    emoji: '🎁',
    condition: (state) => (state.giftsRedeemed || 0) >= 1,
    reward: { stars: 0 },
    category: 'special',
  },
]

// 礼物列表（现实奖励）
export const giftList = [
  { id: 'ice_cream', name: '冰淇淋一个', emoji: '🍦', cost: 1, desc: '跟老王说3个英语单词验证后兑换' },
  { id: 'game_time', name: '游戏时间30分钟', emoji: '🎮', cost: 2, desc: '额外的游戏时间奖励' },
  { id: 'stationery', name: '文具盲盒', emoji: '🎁', cost: 3, desc: '文具店随机文具' },
  { id: 'pet_time', name: '宠物体验券', emoji: '🐾', cost: 5, desc: '去宠物店撸猫/狗30分钟' },
  { id: 'amusement', name: '游乐场半天', emoji: '🎢', cost: 10, desc: '周末去游乐场玩半天' },
]
