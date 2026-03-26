<template>
  <div class="fb-exercise">
    <!-- Prompt -->
    <div class="prompt-area">
      <p class="prompt-label">选择正确的单词填入空白处</p>
      <div class="sentence-display">
        <template v-for="(part, i) in sentenceParts" :key="i">
          <span v-if="part.type === 'text'" class="sentence-text">{{ part.value }}</span>
          <span
            v-else
            class="blank-slot"
            :class="blankClass"
          >
            {{ selectedWord || '___' }}
          </span>
        </template>
      </div>
    </div>

    <!-- Options -->
    <div class="options-grid">
      <button
        v-for="(opt, i) in exercise.options"
        :key="i"
        class="option-btn"
        :class="optionClass(opt)"
        :disabled="selected !== null"
        @click="select(opt)"
      >
        {{ opt }}
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="selected !== null" class="feedback-area" :class="isCorrect ? 'correct' : 'wrong'">
      <span class="feedback-icon">{{ isCorrect ? '✅' : '❌' }}</span>
      <span class="feedback-text">
        {{ isCorrect ? '正确！' : `正确答案是：${exercise.correctAnswer}` }}
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

const selectedWord = computed(() => selected.value)

// Split sentence into text and blank parts
const sentenceParts = computed(() => {
  const sentence = props.exercise.sentence
  const parts = []
  const blankIdx = sentence.indexOf('___')
  if (blankIdx >= 0) {
    parts.push({ type: 'text', value: sentence.substring(0, blankIdx) })
    parts.push({ type: 'blank', value: '___' })
    parts.push({ type: 'text', value: sentence.substring(blankIdx + 3) })
  } else {
    parts.push({ type: 'text', value: sentence })
  }
  return parts
})

const blankClass = computed(() => {
  if (selected.value === null) return 'idle'
  return isCorrect.value ? 'correct' : 'wrong'
})

function optionClass(opt) {
  if (selected.value === null) return ''
  if (opt === props.exercise.correctAnswer) return 'correct'
  if (opt === selected.value && !isCorrect.value) return 'wrong'
  return 'dimmed'
}

function select(opt) {
  if (selected.value !== null) return
  selected.value = opt
  emit('answer', {
    correct: opt === props.exercise.correctAnswer,
    wordId: props.exercise.wordId,
  })
}
</script>

<style scoped>
.fb-exercise {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 32px;
}

.prompt-area {
  text-align: center;
  margin-bottom: 24px;
}
.prompt-label {
  color: #64748b;
  font-size: 13px;
  margin: 0 0 16px;
}

.sentence-display {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 20px 24px;
  background: rgba(255,255,255,0.04);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  max-width: 400px;
  margin: 0 auto;
  font-size: 20px;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.6;
}

.blank-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 2px 12px;
  border-radius: 8px;
  border-bottom: 3px solid;
  font-weight: 800;
  transition: all 0.3s;
}
.blank-slot.idle {
  border-color: #f59e0b;
  color: #f59e0b;
  animation: blink 1.5s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.blank-slot.correct {
  border-color: #34d399;
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  animation: blankPop 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.blank-slot.wrong {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  animation: shakeWrong 0.5s ease;
}
@keyframes blankPop {
  0% { transform: scale(1); }
  30% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes shakeWrong {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.option-btn {
  padding: 14px 12px;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: #e2e8f0;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  animation: optionEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.option-btn:nth-child(1) { animation-delay: 0.05s; }
.option-btn:nth-child(2) { animation-delay: 0.1s; }
.option-btn:nth-child(3) { animation-delay: 0.15s; }
.option-btn:nth-child(4) { animation-delay: 0.2s; }
@keyframes optionEnter {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.option-btn:active:not(:disabled) { transform: scale(0.95); }

.option-btn.correct {
  background: rgba(52, 211, 153, 0.15);
  border-color: #34d399;
  color: #34d399;
}
.option-btn.wrong {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
  animation: shakeWrong 0.5s ease;
}
.option-btn.dimmed { opacity: 0.35; }

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
