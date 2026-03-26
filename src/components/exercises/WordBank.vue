<template>
  <div class="wb-exercise">
    <!-- Prompt -->
    <div class="prompt-area">
      <p class="prompt-label">用下面的单词拼出句子</p>
      <p class="prompt-meaning">{{ exercise.prompt }}</p>
    </div>

    <!-- Answer area (where words go) -->
    <div class="answer-area" @click.self="removeLast">
      <div v-if="answerWords.length === 0" class="answer-placeholder">
        点击下方单词拼出句子
      </div>
      <span
        v-for="(word, i) in answerWords"
        :key="'a-' + i"
        class="word-block answer-block"
        :class="{ correct: showCorrect, wrong: showWrong && !isCorrect }"
        @click="removeWord(i)"
      >
        {{ word }}
        <span class="remove-x">×</span>
      </span>
    </div>

    <!-- Word Bank -->
    <div class="word-bank">
      <span
        v-for="(word, i) in availableWords"
        :key="'b-' + i"
        class="word-block bank-block"
        @click="addWord(word)"
      >
        {{ word }}
      </span>
    </div>

    <!-- Action buttons -->
    <div class="action-area">
      <button class="clear-btn" @click="clearAll" :disabled="answerWords.length === 0 || submitted">
        清空
      </button>
      <button
        class="check-btn"
        :disabled="answerWords.length === 0 || submitted"
        @click="checkAnswer"
      >
        确认
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="submitted" class="feedback-area" :class="isCorrect ? 'correct' : 'wrong'">
      <span class="feedback-icon">{{ isCorrect ? '✅' : '❌' }}</span>
      <span class="feedback-text">
        {{ isCorrect ? '完美！' : `正确答案：${exercise.correctAnswer}` }}
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

const answerWords = ref([])
const submitted = ref(false)
const showCorrect = ref(false)
const showWrong = ref(false)

// Words in the bank (not yet used)
const availableWords = computed(() => {
  const used = [...answerWords.value]
  return props.exercise.wordBank.filter(w => {
    const idx = used.indexOf(w)
    if (idx >= 0) {
      used.splice(idx, 1)
      return false
    }
    return true
  })
})

const isCorrect = computed(() =>
  answerWords.value.join(' ').toLowerCase() === props.exercise.correctAnswer.toLowerCase()
)

function addWord(word) {
  if (submitted.value) return
  answerWords.value.push(word)
}

function removeWord(index) {
  if (submitted.value) return
  answerWords.value.splice(index, 1)
}

function removeLast() {
  if (submitted.value || answerWords.value.length === 0) return
  answerWords.value.pop()
}

function clearAll() {
  answerWords.value = []
}

function checkAnswer() {
  if (answerWords.value.length === 0 || submitted.value) return
  submitted.value = true

  if (isCorrect.value) {
    showCorrect.value = true
  } else {
    showWrong.value = true
    // Show correct answer briefly, then emit
    setTimeout(() => {
      emit('answer', {
        correct: false,
        wordId: props.exercise.wordId,
      })
    }, 1200)
    return
  }

  emit('answer', {
    correct: true,
    wordId: props.exercise.wordId,
  })
}
</script>

<style scoped>
.wb-exercise {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 24px;
}

.prompt-area {
  text-align: center;
  margin-bottom: 20px;
}
.prompt-label {
  color: #64748b;
  font-size: 13px;
  margin: 0 0 8px;
}
.prompt-meaning {
  font-size: 20px;
  font-weight: 800;
  color: #fbbf24;
  margin: 0;
}

/* Answer area */
.answer-area {
  min-height: 64px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.04);
  border: 2px dashed rgba(255,255,255,0.15);
  border-radius: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  transition: border-color 0.3s;
  cursor: pointer;
}
.answer-area:focus-within {
  border-color: rgba(245, 158, 11, 0.4);
}
.answer-placeholder {
  color: #475569;
  font-size: 14px;
  width: 100%;
  text-align: center;
}

/* Word blocks */
.word-block {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.bank-block {
  background: rgba(255,255,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.15);
  color: #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.bank-block:active {
  transform: scale(0.92);
}

.answer-block {
  background: rgba(245, 158, 11, 0.15);
  border: 1.5px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  animation: blockFlyIn 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes blockFlyIn {
  from { transform: translateY(15px) scale(0.85); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.remove-x {
  font-size: 14px;
  opacity: 0.5;
  font-weight: 400;
}
.answer-block:hover .remove-x { opacity: 1; }

.answer-block.correct {
  background: rgba(52, 211, 153, 0.15);
  border-color: #34d399;
  color: #34d399;
  animation: bounceCorrect 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes bounceCorrect {
  0% { transform: scale(1); }
  30% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
.answer-block.wrong {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
  animation: shakeWrong 0.5s ease;
}
@keyframes shakeWrong {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

/* Word Bank */
.word-bank {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 16px;
  background: rgba(0,0,0,0.2);
  border-radius: 16px;
  min-height: 56px;
}

/* Action buttons */
.action-area {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.clear-btn {
  flex: 1;
  padding: 14px;
  background: rgba(255,255,255,0.06);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: #94a3b8;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.clear-btn:active:not(:disabled) { transform: scale(0.96); }
.clear-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.check-btn {
  flex: 2;
  padding: 14px;
  background: linear-gradient(135deg, #34d399, #10b981);
  border: none;
  border-radius: 14px;
  color: #022c22;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
.check-btn:active:not(:disabled) { transform: scale(0.96); }
.check-btn:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }

/* Feedback */
.feedback-area {
  margin-top: 16px;
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
