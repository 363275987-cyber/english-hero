export const bosses = {
  m1_boss: {
    id: 'm1_boss', name: '盖侬的影子', nameEn: "Ganon's Shadow", module: 1, type: 'main',
    hp: 30, maxHp: 30, emoji: '👹',
    color: 'from-purple-900 via-red-900 to-purple-950',
    bgGradient: 'bg-gradient-to-b from-gray-900 via-purple-950 to-black',
    phases: 1,
    dialogues: {
      intro: "Hahaha! You don't even know these jobs? Try me!",
      weak: "No! My weakness!",
      defeat: "Light... too bright...",
      attack: "What does he do? Guess!",
      hit: "Ouch! That's correct!",
      miss: "Wrong! Try harder!",
      victory: "You defeated me! Here is your reward!",
    },
    rewards: { stars: 100, chest: 'silver', giftChance: 0 },
    grammarPoint: 'What do/does... do? Where do/does... work?',
  },
  m2_boss: {
    id: 'm2_boss', name: '古代守护者', nameEn: 'Ancient Guardian', module: 2, type: 'main',
    hp: 40, maxHp: 40, emoji: '🤖',
    color: 'from-blue-900 via-cyan-800 to-blue-950',
    bgGradient: 'bg-gradient-to-b from-slate-900 via-blue-950 to-black',
    phases: 1,
    dialogues: {
      intro: "BEEP BOOP! How often do you check your e-mail? NEVER? That's why you'll lose!",
      weak: "System... malfunction...",
      defeat: "Power... shutting down...",
      attack: "How often do you use your phone?",
      hit: "Error! Correct answer detected!",
      miss: "Incorrect! Processing damage...",
      victory: "Guardian defeated! You earned my respect!",
    },
    rewards: { stars: 150, chest: 'silver', giftChance: 0 },
    grammarPoint: 'to + infinitive / will / How often',
  },
  m3_boss: {
    id: 'm3_boss', name: '垃圾食品巨人', nameEn: 'Junk Food Giant', module: 3, type: 'main',
    hp: 50, maxHp: 50, emoji: '🍔',
    color: 'from-red-900 via-yellow-800 to-red-950',
    bgGradient: 'bg-gradient-to-b from-orange-900 via-red-950 to-black',
    phases: 1,
    dialogues: {
      intro: "MUNCH MUNCH! Eat more junk food! Haha!",
      weak: "No... vegetables... disgusting!",
      defeat: "I'm... melting... into a salad...",
      attack: "Is this healthy? MUNCH!",
      hit: "YUCK! That healthy food hurts!",
      miss: "Wrong! Have another hamburger!",
      victory: "The giant is defeated! Healthy diet wins!",
    },
    rewards: { stars: 200, chest: 'silver', giftChance: 0 },
    grammarPoint: 'less / fewer / more / too much / enough',
  },
  m4_boss: {
    id: 'm4_boss', name: '黑暗厨师', nameEn: 'Dark Chef', module: 4, type: 'main',
    hp: 50, maxHp: 50, emoji: '👨‍🍳',
    color: 'from-orange-900 via-red-800 to-black',
    bgGradient: 'bg-gradient-to-b from-amber-950 via-red-900 to-black',
    phases: 1,
    dialogues: {
      intro: "Welcome to my kitchen! Can you follow my recipe?",
      weak: "My recipe is ruined!",
      defeat: "You're a better chef than me...",
      attack: "First, I chop... then what comes next?",
      hit: "Correct! You can really cook!",
      miss: "Wrong order! The dish is ruined!",
      victory: "The dark chef is impressed! You win!",
    },
    rewards: { stars: 200, chest: 'gold', giftChance: 0 },
    grammarPoint: 'need... to / First, Next, Then, Finally',
  },
  m5_boss: {
    id: 'm5_boss', name: '风之神兽', nameEn: 'Wind Divine Beast', module: 5, type: 'main',
    hp: 60, maxHp: 60, emoji: '🌪️',
    color: 'from-teal-800 via-emerald-700 to-cyan-950',
    bgGradient: 'bg-gradient-to-b from-sky-900 via-teal-950 to-black',
    phases: 3,
    dialogues: {
      intro: "WHOOSH! Have you ever ridden a horse? NO? Then you can't beat me!",
      weak: "The wind... is calming...",
      defeat: "The divine beast is tamed!",
      attack: "Have you ever climbed walls? Answer me!",
      hit: "Correct! You're experienced!",
      miss: "You haven't! Take this!",
      victory: "Wind beast defeated! Here's a special gift!",
    },
    rewards: { stars: 250, chest: 'gold', giftChance: 0.3 },
    grammarPoint: 'Present perfect / too + adjective',
  },
  m6_boss: {
    id: 'm6_boss', name: '灾厄盖侬', nameEn: 'Calamity Ganon', module: 6, type: 'main',
    hp: 80, maxHp: 80, emoji: '💀',
    color: 'from-red-950 via-gray-900 to-black',
    bgGradient: 'bg-gradient-to-b from-red-950 via-gray-900 to-black',
    phases: 3,
    dialogues: {
      intro: "FOOLISH CHILD! You think you can save the Earth? I am CALAMITY GANON!",
      weak: "My... power... fading...",
      defeat: "IMPOSSIBLE! The hero... prevails...",
      attack: "Why don't you recycle? ANSWER ME!",
      hit: "NO! That's correct!",
      miss: "WRONG! The pollution grows stronger!",
      victory: "Calamity Ganon is defeated! The English world is saved!",
    },
    rewards: { stars: 500, chest: 'master', giftChance: 0.5 },
    grammarPoint: 'already / yet / Perhaps / Maybe / Why don\'t',
  },
}

export const miniBosses = {
  m1_mini1: { id: 'm1_mini1', name: '职业小怪', module: 1, type: 'mini', hp: 15, maxHp: 15, emoji: '👻', color: 'from-gray-700 to-gray-500', dialogues: { intro: "I'm just a mini boss!", defeat: "Bye bye!" }, rewards: { stars: 30, chest: 'iron' } },
  m1_mini2: { id: 'm1_mini2', name: '迷路学徒', module: 1, type: 'mini', hp: 15, maxHp: 15, emoji: '🐸', color: 'from-green-700 to-green-500', dialogues: { intro: "What job am I? Even I don't know!", defeat: "Maybe I should find a real job." }, rewards: { stars: 30, chest: 'iron' } },
  m2_mini1: { id: 'm2_mini1', name: '断线精灵', module: 2, type: 'mini', hp: 15, maxHp: 15, emoji: '📡', color: 'from-blue-700 to-blue-500', dialogues: { intro: "No signal! Can't communicate!", defeat: "Connected at last!" }, rewards: { stars: 30, chest: 'iron' } },
  m2_mini2: { id: 'm2_mini2', name: '病毒小虫', module: 2, type: 'mini', hp: 15, maxHp: 15, emoji: '🐛', color: 'from-lime-700 to-lime-500', dialogues: { intro: "I ate all your messages!", defeat: "Antivirus activated!" }, rewards: { stars: 30, chest: 'iron' } },
  m3_mini1: { id: 'm3_mini1', name: '糖果怪', module: 3, type: 'mini', hp: 15, maxHp: 15, emoji: '🍭', color: 'from-pink-600 to-pink-400', dialogues: { intro: "Eat more candy! It's delicious!", defeat: "Too sweet... I feel sick." }, rewards: { stars: 30, chest: 'iron' } },
  m3_mini2: { id: 'm3_mini2', name: '薯条骑士', module: 3, type: 'mini', hp: 15, maxHp: 15, emoji: '🍟', color: 'from-yellow-600 to-yellow-400', dialogues: { intro: "I am the Knight of Fries!", defeat: "Out of oil... defeated." }, rewards: { stars: 30, chest: 'iron' } },
  m4_mini1: { id: 'm4_mini1', name: '意大利面怪', module: 4, type: 'mini', hp: 15, maxHp: 15, emoji: '🍝', color: 'from-orange-600 to-yellow-500', dialogues: { intro: "Slurp slurp! Can't catch me!", defeat: "Al dente... I'm done." }, rewards: { stars: 30, chest: 'iron' } },
  m4_mini2: { id: 'm4_mini2', name: '寿司忍者', module: 4, type: 'mini', hp: 15, maxHp: 15, emoji: '🍣', color: 'from-rose-700 to-rose-500', dialogues: { intro: "Wasabi kick! HIYA!", defeat: "Too much wasabi... defeated." }, rewards: { stars: 30, chest: 'iron' } },
  m5_mini1: { id: 'm5_mini1', name: '野营小熊', module: 5, type: 'mini', hp: 15, maxHp: 15, emoji: '🐻', color: 'from-amber-700 to-amber-500', dialogues: { intro: "This is my camping spot!", defeat: "Okay, you can camp here." }, rewards: { stars: 30, chest: 'iron' } },
  m5_mini2: { id: 'm5_mini2', name: '迷路蝴蝶', module: 5, type: 'mini', hp: 15, maxHp: 15, emoji: '🦋', color: 'from-violet-600 to-purple-400', dialogues: { intro: "Where am I? Have you been here before?", defeat: "Found my way home!" }, rewards: { stars: 30, chest: 'iron' } },
  m6_mini1: { id: 'm6_mini1', name: '塑料怪', module: 6, type: 'mini', hp: 15, maxHp: 15, emoji: '🥤', color: 'from-gray-600 to-gray-400', dialogues: { intro: "I'm plastic! I'll never go away!", defeat: "Recycled! I'm useful now!" }, rewards: { stars: 30, chest: 'iron' } },
  m6_mini2: { id: 'm6_mini2', name: '烟雾精灵', module: 6, type: 'mini', hp: 15, maxHp: 15, emoji: '💨', color: 'from-gray-500 to-gray-300', dialogues: { intro: "Cough cough! The air is bad!", defeat: "Clean air at last!" }, rewards: { stars: 30, chest: 'iron' } },
}

export const allBosses = { ...bosses, ...miniBosses }

export function getMainBoss(moduleId) {
  return Object.values(bosses).find(b => b.module === moduleId)
}

export function getMiniBosses(moduleId) {
  return Object.values(miniBosses).filter(b => b.module === moduleId)
}
