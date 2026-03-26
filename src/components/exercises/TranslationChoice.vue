<template>
  <div class="tc-exercise">
    <!-- Prompt -->
    <div class="prompt-area">
      <span v-if="exercise.promptEmoji" class="prompt-emoji">{{ exercise.promptEmoji }}</span>
      <h2 class="prompt-text">{{ exercise.prompt }}</h2>
      <span v-if="exercise.promptPhonetic" class="prompt-phonetic">{{ exercise.promptPhonetic }}</span>
    </div>

    <p class="direction-label">{{ exercise.direction === 'en2cn' ? '选择正确的中文翻译' : '选择正确的英文单词' }}</p>

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
        <span class="option-letter">{{ ['A', 'B', 'C', 'D'][i] }}</span>
        <span class="option-text">{{ opt }}</span>
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="selected !== null" class="feedback-area" :class="isCorrect ? 'correct' : 'wrong'">
      <span class="feedback-icon">{{ isCorrect ? '✅' : '❌' }}</span>
      <span class="feedback-text">
        {{ isCorrect ? '太棒了！' : `正确答案是：${exercise.correctAnswer}` }}
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
.tc-exercise {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 24px;
}

.prompt-area {
  text-align: center;
  margin-bottom: 12px;
}
.prompt-emoji {
  font-size: 56px;
  display: block;
  margin-bottom: 8px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
  animation: emojiFloat 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes emojiFloat {
  0% { transform: scale(0.5) translateY(20px); opacity: 0; }
  60% { transform: scale(1.1) translateY(-5px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}
.prompt-text {
  font-size: 28px;
  font-weight: 900;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: 0.5px;
}
.prompt-phonetic {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
  display: block;
}

.direction-label {
  text-align: center;
  color: #64748b;
  font-size: 13px;
  margin: 0 0 20px;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  animation: optionEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.option-btn:nth-child(1) { animation-delay: 0.05s; }
.option-btn:nth-child(2) { animation-delay: 0.1s; }
.option-btn:nth-child(3) { animation-delay: 0.15s; }
.option-btn:nth-child(4) { animation-delay: 0.2s; }

@keyframes optionEnter {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.option-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.option-letter {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #94a3b8;
  flex-shrink: 0;
}
.option-text { flex: 1; }

.option-btn.correct {
  background: rgba(52, 211, 153, 0.15);
  border-color: #34d399;
  color: #34d399;
  animation: bounceCorrect 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.option-btn.correct .option-letter {
  background: #34d399;
  color: #022c22;
}
@keyframes bounceCorrect {
  0% { transform: scale(1); }
  30% { transform: scale(1.03); }
  60% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.option-btn.wrong {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
  animation: shakeWrong 0.5s ease;
}
.option-btn.wrong .option-letter {
  background: #ef4444;
  color: white;
}
@keyframes shakeWrong {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.option-btn.dimmed {
  opacity: 0.4;
}

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
.feedback-area.correct {
  background: rgba(52, 211, 153, 0.1);
}
.feedback-area.wrong {
  background: rgba(239, 68, 68, 0.1);
}
.feedback-icon { font-size: 20px; }
.feedback-text {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin-top: 4px;
}
</style>
