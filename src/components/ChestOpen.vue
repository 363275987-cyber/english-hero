<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" v-if="visible">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Chest container -->
    <div class="relative flex flex-col items-center">
      <!-- Stage indicator -->
      <div v-if="stage === 'closed'" class="text-center mb-6">
        <div class="text-6xl mb-4 animate-float">{{ chestEmoji }}</div>
        <div class="text-amber-400 font-bold text-xl tracking-wider">
          {{ chestLabel }}
        </div>
        <button
          @click="openChest"
          class="mt-6 btn-gold text-lg px-8 py-3"
        >
          🗝️ 打开宝箱
        </button>
      </div>

      <!-- Opening animation -->
      <div v-if="stage === 'opening'" class="text-center">
        <div class="relative">
          <div class="text-8xl chest-opening-anim">{{ chestEmoji }}</div>
          <!-- Light rays -->
          <div class="absolute inset-0 flex items-center justify-center light-rays"></div>
        </div>
        <div class="text-amber-300 text-lg mt-4 animate-pulse">✨ 获得奖励中...</div>
      </div>

      <!-- Rewards display -->
      <div v-if="stage === 'rewards'" class="text-center w-72 max-w-full">
        <div class="text-4xl mb-2">🎉</div>
        <div class="text-amber-400 font-bold text-xl mb-4">获得奖励！</div>

        <!-- Individual reward items -->
        <div class="space-y-3 mb-6">
          <div
            v-for="(reward, idx) in rewards"
            :key="idx"
            class="card-dark flex items-center gap-3 reward-item"
            :style="{ animationDelay: `${idx * 0.3}s` }"
          >
            <span class="text-3xl reward-pop" :style="{ animationDelay: `${idx * 0.3}s` }">
              {{ reward.emoji }}
            </span>
            <div class="text-left">
              <div class="font-bold text-white">{{ reward.name }}</div>
              <div class="text-sm text-gray-400">{{ reward.desc }}</div>
            </div>
            <div v-if="reward.count" class="ml-auto text-amber-400 font-bold">×{{ reward.count }}</div>
          </div>
        </div>

        <!-- Mystery gift special -->
        <div v-if="hasMystery" class="my-4">
          <div class="mystery-gift text-2xl font-bold text-pink-400">
            🎁 神秘礼物！
          </div>
        </div>

        <button
          @click="$emit('close')"
          class="btn-primary w-full text-lg"
        >
          太棒了！收下奖励 ✨
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  chestType: {
    type: String,
    default: 'wood',
    validator: v => ['wood', 'iron', 'silver', 'gold', 'master'].includes(v)
  },
  rewards: { type: Array, default: () => [] }
})

defineEmits(['close'])

const stage = ref('closed') // closed -> opening -> rewards

const chestEmoji = computed(() => {
  const map = {
    wood: '🪙',
    iron: '🔩',
    silver: '🥈',
    gold: '🥇',
    master: '👑'
  }
  return map[props.chestType] || '📦'
})

const chestLabel = computed(() => {
  const map = {
    wood: '木宝箱',
    iron: '铁宝箱',
    silver: '银宝箱',
    gold: '金宝箱',
    master: '大师宝箱'
  }
  return map[props.chestType] || '宝箱'
})

const hasMystery = computed(() =>
  props.rewards.some(r => r.mystery)
)

watch(() => props.visible, (v) => {
  if (v) {
    stage.value = 'closed'
  } else {
    stage.value = 'closed'
  }
})

function openChest() {
  stage.value = 'opening'
  setTimeout(() => {
    stage.value = 'rewards'
  }, 1500)
}
</script>

<style scoped>
/* Chest opening animation */
@keyframes chestOpen {
  0% { transform: scale(1) rotate(0deg); }
  20% { transform: scale(1.1) rotate(-3deg); }
  40% { transform: scale(1.2) rotate(3deg); }
  60% { transform: scale(1.1) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.chest-opening-anim {
  animation: chestOpen 1s ease-in-out;
}

/* Light rays from chest */
@keyframes lightRays {
  0% { opacity: 0; transform: scale(0.5); }
  30% { opacity: 1; transform: scale(1.5); }
  100% { opacity: 0; transform: scale(3); }
}

.light-rays::before {
  content: '✨';
  font-size: 4rem;
  position: absolute;
  animation: lightRays 1.5s ease-out;
}

/* Reward item slide in */
@keyframes rewardSlide {
  0% {
    opacity: 0;
    transform: translateX(-30px) scale(0.8);
  }
  60% {
    transform: translateX(5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.reward-item {
  animation: rewardSlide 0.5s ease-out both;
}

/* Reward emoji pop */
@keyframes rewardPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}

.reward-pop {
  animation: rewardPop 0.4s ease-out both;
}

/* Mystery gift special */
@keyframes mysteryGlow {
  0%, 100% {
    text-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
    transform: scale(1);
  }
  50% {
    text-shadow: 0 0 30px rgba(236, 72, 153, 0.8), 0 0 60px rgba(236, 72, 153, 0.4);
    transform: scale(1.05);
  }
}

.mystery-gift {
  animation: mysteryGlow 1s ease-in-out infinite;
}
</style>
