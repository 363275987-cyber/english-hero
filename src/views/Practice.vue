<template>
  <div class="practice-page">
    <!-- Module header -->
    <div class="module-header" v-if="!exercises.length">
      <div class="header-content">
        <h1 class="module-name">{{ moduleInfo.name }}</h1>
        <p class="module-name-en">{{ moduleInfo.nameEn }}</p>
      </div>
      <div class="lesson-info">
        <span class="lesson-badge">{{ lessonLabel }}</span>
        <span class="word-count">{{ wordCount }} 个单词</span>
      </div>
    </div>

    <!-- Loading / Generating -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在准备练习...</p>
    </div>

    <!-- Exercise Engine -->
    <ExerciseEngine
      v-if="exercises.length > 0"
      :exercises="exercises"
      :module-id="moduleId"
      @complete="onComplete"
      @exit="onExit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { generateExercises, generateReviewExercises } from '../data/exercises'
import { getWordsByModule } from '../data/words'
import ExerciseEngine from '../components/ExerciseEngine.vue'

const router = useRouter()
const route = useRoute()
const game = useGameStore()

const moduleId = parseInt(route.params.moduleId) || 1
const mode = route.query.mode || 'learn' // learn | review
const count = parseInt(route.query.count) || 8

const exercises = ref([])
const loading = ref(true)

const moduleMap = {
  1: { name: '职业迷宫', nameEn: 'Jobs Labyrinth' },
  2: { name: '电子迷宫', nameEn: 'E-age Maze' },
  3: { name: '美食火山', nameEn: 'Food Volcano' },
  4: { name: '黑暗厨房', nameEn: 'Dark Kitchen' },
  5: { name: '风之神殿', nameEn: 'Wind Temple' },
  6: { name: '最终城堡', nameEn: 'Final Castle' },
}
const moduleInfo = computed(() => moduleMap[moduleId] || { name: '练习', nameEn: 'Practice' })

const lessonLabel = computed(() => {
  if (mode === 'review') return '🔄 复习'
  return '📖 新课'
})

const wordCount = computed(() => {
  if (mode === 'review') return game.reviewCount
  return getWordsByModule(moduleId).length
})

onMounted(() => {
  // Generate exercises
  setTimeout(() => {
    if (mode === 'review') {
      const queue = game.getReviewQueue(count)
      if (queue.length > 0) {
        exercises.value = generateReviewExercises(queue, count)
      } else {
        exercises.value = generateExercises(moduleId, count)
      }
    } else {
      exercises.value = generateExercises(moduleId, count)
    }
    loading.value = false
  }, 300)
})

function onComplete(result) {
  // Navigate back
  if (mode === 'review') {
    router.push('/review')
  } else {
    router.push('/adventure')
  }
}

function onExit() {
  router.back()
}
</script>

<style scoped>
.practice-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}

.module-header {
  padding: 20px 16px;
  text-align: center;
  padding-top: max(20px, env(safe-area-inset-top));
}
.module-name {
  font-size: 24px;
  font-weight: 900;
  color: #fbbf24;
  margin: 0;
}
.module-name-en {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
}
.lesson-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}
.lesson-badge {
  padding: 4px 12px;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #fbbf24;
}
.word-count {
  font-size: 12px;
  color: #64748b;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #64748b;
}
.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
