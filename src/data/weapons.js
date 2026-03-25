export const weaponTypes = {
  woodSword: { id: 'woodSword', name: '木剑', nameEn: "Traveler's Sword", emoji: '🗡️', damage: 1, type: 'basic', questionType: 'image-choice', description: '看图选词（基础词汇）', color: 'from-amber-700 to-amber-500' },
  knightSword: { id: 'knightSword', name: '骑士剑', nameEn: "Knight's Sword", emoji: '⚔️', damage: 2, type: 'module', questionType: 'meaning-choice', description: '看意思想单词', color: 'from-blue-700 to-blue-500' },
  iceStaff: { id: 'iceStaff', name: '冰之杖', nameEn: 'Frost Staff', emoji: '🪄', damage: 2, type: 'grammar', questionType: 'grammar-fill', description: '语法填空', color: 'from-cyan-600 to-cyan-400' },
  fireArrow: { id: 'fireArrow', name: '火之箭', nameEn: 'Fire Arrow', emoji: '🔥', damage: 2, type: 'listen', questionType: 'listen-meaning', description: '听音辨义', color: 'from-red-600 to-orange-500' },
  spiritBow: { id: 'spiritBow', name: '精灵弓', nameEn: 'Spirit Bow', emoji: '🏹', damage: 3, type: 'spell', questionType: 'spelling', description: '拼写挑战', color: 'from-purple-600 to-purple-400' },
  masterSword: { id: 'masterSword', name: '大师之剑', nameEn: 'Master Sword', emoji: '⚡', damage: 5, type: 'ultimate', questionType: 'combo-ultimate', description: '连击×3必杀', color: 'from-yellow-400 to-amber-300' },
}

export const defaultWeapons = ['woodSword', 'knightSword', 'spiritBow']

export const itemTypes = {
  heartApple: { id: 'heartApple', name: '心心苹果', emoji: '🍎', effect: 'heal', value: 1, description: '恢复1点HP', maxStack: 10 },
  fairyHoney: { id: 'fairyHoney', name: '精灵蜂蜜', emoji: '🍯', effect: 'healAll', value: 0, description: '恢复全部HP', maxStack: 5 },
  woodShield: { id: 'woodShield', name: '木盾', emoji: '🛡️', effect: 'block', value: 1, description: '抵挡1次Boss攻击', maxStack: 2 },
  knightShield: { id: 'knightShield', name: '骑士盾', emoji: '🔰', effect: 'blockReflect', value: 1, description: '抵挡并反弹1伤害', maxStack: 2 },
  bomb: { id: 'bomb', name: '炸弹', emoji: '💣', effect: 'directDamage', value: 2, description: '直接造成2点伤害', maxStack: 5 },
  fireArrowItem: { id: 'fireArrowItem', name: '火箭', emoji: '🚀', effect: 'elementDamage', value: 3, description: '火属性伤害3点', maxStack: 10 },
  iceArrowItem: { id: 'iceArrowItem', name: '冰箭', emoji: '❄️', effect: 'elementDamage', value: 3, description: '冰属性伤害3点', maxStack: 10 },
  fairyPotion: { id: 'fairyPotion', name: '精灵药水', emoji: '🧪', effect: 'hint', value: 1, description: '战斗中提示正确答案', maxStack: 5 },
}
