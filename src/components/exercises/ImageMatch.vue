<template>
  <div class="im-exercise">
    <!-- Prompt -->
    <div class="prompt-area">
      <p class="prompt-label">选择与下方单词匹配的图片</p>
      <div class="word-prompt">
        <span class="word-prompt-emoji">{{ exercise.promptEmoji }}</span>
        <h2 class="word-prompt-text">{{ exercise.prompt }}</h2>
      </div>
    </div>

    <!-- Image Grid -->
    <div class="image-grid" :class="gridClass">
      <button
        v-for="(opt, i) in exercise.options"
        :key="i"
        class="image-card"
        :class="optionClass(opt)"
        :disabled="selected !== null"
        @click="select(opt)"
      >
        <span class="card-emoji">{{ opt.emoji }}</span>
        <span class="card-label">{{ opt.meaning }}</span>
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="selected !== null" class="feedback-area" :class="isCorrect ? 'correct' : 'wrong'">
      <span class="feedback-icon">{{ isCorrect ? '✅' : '❌' }}</span>
      <span class="feedback-text">
        {{ isCorrect ? '配对成功！' : `正确答案是：${exercise.correctAnswer}` }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  exercise: { type: Object, required: true },
  combo: { type: Number, default: 0 },
  muted: { type: Boolean, default: false },
})
const emit = defineEmits(['answer', 'skip'])

const selected = ref(null)
const isCorrect = computed(() => selected.value === props.exercise.correctAnswer)

const gridClass = computed(() => {
  const count = props.exercise.options?.length || 4
  if (count <= 4) return 'grid-2x2'
  return 'grid-2x3'
})

function optionClass(opt) {
  if (selected.value === null) return ''
  if (opt.meaning === props.exercise.correctAnswer) return 'correct'
  if (opt.meaning === selected.value && !isCorrect.value) return 'wrong'
  return 'dimmed'
}

function select(opt) {
  if (selected.value !== null) return
  selected.value = opt.meaning
  emit('answer', {
    correct: opt.meaning === props.exercise.correctAnswer,
    wordId: props.exercise.wordId,
  })
}
</script>

<style scoped>
.im-exercise {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
}

.prompt-area {
  text-align: center;
  margin-bottom: 20px;
}
.prompt-label {
  color: #64748b;
  font-size: 13px;
  margin: 0 0 12px;
}

.word-prompt {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: rgba(255,255,255,0.04);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
}
.word-prompt-emoji {
  font-size: 36px;
}
.word-prompt-text {
  font-size: 24px;
  font-weight: 900;
  color: #f1f5f9;
  margin: 0;
}

/* Image Grid */
.image-grid {
  display: grid;
  gap: 10px;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 8px;
}
.grid-2x2 { grid-template-columns: 1fr 1fr; }
.grid-2x3 { grid-template-columns: 1fr 1fr; }

.image-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 12px;
  background: rgba(255,255,255,0.05);
  border: 2.5px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  animation: cardEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.image-card:nth-child(1) { animation-delay: 0.05s; }
.image-card:nth-child(2) { animation-delay: 0.1s; }
.image-card:nth-child(3) { animation-delay: 0.15s; }
.image-card:nth-child(4) { animation-delay: 0.2s; }
@keyframes cardEnter {
  from { opacity: 0; transform: scale(0.85) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.image-card:active:not(:disabled) {
  transform: scale(0.94);
}

.card-emoji {
  font-size: 44px;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
}
.card-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-align: center;
}

.image-card.correct {
  background: rgba(52, 211, 153, 0.12);
  border-color: #34d399;
  animation: cardCorrect 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.image-card.correct .card-label { color: #34d399; }
@keyframes cardCorrect {
  0% { transform: scale(1); }
  20% { transform: scale(1.08); border-width: 3px; }
  100% { transform: scale(1); }
}

.image-card.wrong {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  animation: cardWrong 0.5s ease;
}
.image-card.wrong .card-label { color: #ef4444; }
@keyframes cardWrong {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.image-card.dimmed { opacity: 0.3; }

/* Feedback */
.feedback-area {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 12px;
  text-align: center;
  animation: feedbackPop 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes feedbackPop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.feedback-area.correct { background: rgba(52, 211, 153, 0.1); }
.feedback-area.wrong { background: rgba(239, 68, 68, 0.1); }
.feedback-icon { font-size: 20px; }
.feedback-text {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin-top: 4px;
}
</style>
