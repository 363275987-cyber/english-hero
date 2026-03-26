<template>
  <div class="lc-exercise">
    <!-- Prompt -->
    <div class="prompt-area">
      <p class="prompt-label">听发音，选择正确的中文意思</p>
      <button
        class="play-btn"
        :class="{ playing: isPlaying, disabled: playCount >= maxPlays }"
        @click="playAudio"
      >
        <span class="play-icon">🔊</span>
        <span class="play-text">播放发音</span>
        <span class="play-count">{{ maxPlays - playCount }} 次机会</span>
      </button>
      <!-- Ripple effect -->
      <div v-if="isPlaying" class="ripple-ring"></div>
      <div v-if="isPlaying" class="ripple-ring delay"></div>
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
        {{ isCorrect ? '听力很棒！' : `正确答案是：${exercise.correctAnswer}（${exercise.listenWord}）` }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { speak } from '../../lib/tts'

const props = defineProps({
  exercise: { type: Object, required: true },
  combo: { type: Number, default: 0 },
  muted: { type: Boolean, default: false },
})
const emit = defineEmits(['answer', 'skip'])

const selected = ref(null)
const isPlaying = ref(false)
const playCount = ref(0)
const maxPlays = 2

const isCorrect = computed(() => selected.value === props.exercise.correctAnswer)

// Auto-play on mount
onMounted(() => {
  setTimeout(() => playAudio(), 500)
})

function playAudio() {
  if (playCount.value >= maxPlays || isPlaying.value) return
  isPlaying.value = true
  playCount.value++

  speak(props.exercise.listenWord)

  setTimeout(() => {
    isPlaying.value = false
  }, 1500)
}

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
.lc-exercise {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 24px;
}

.prompt-area {
  text-align: center;
  margin-bottom: 24px;
  position: relative;
}
.prompt-label {
  color: #64748b;
  font-size: 13px;
  margin: 0 0 20px;
}

.play-btn {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.3));
  border: 3px solid rgba(52, 211, 153, 0.4);
  color: #34d399;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  z-index: 1;
}
.play-btn:active:not(.disabled) {
  transform: scale(0.92);
}
.play-btn.playing {
  border-color: #34d399;
  box-shadow: 0 0 30px rgba(52, 211, 153, 0.4);
}
.play-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.play-icon {
  font-size: 36px;
  animation: iconFloat 2s ease-in-out infinite;
}
@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.play-btn.playing .play-icon {
  animation: iconPulse 0.6s ease-in-out infinite;
}
@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.play-text { font-size: 12px; font-weight: 700; }
.play-count { font-size: 10px; opacity: 0.6; }

.ripple-ring {
  position: absolute;
  top: 50%; left: 50%;
  width: 120px; height: 120px;
  margin: -60px 0 0 -60px;
  border-radius: 50%;
  border: 2px solid rgba(52, 211, 153, 0.4);
  animation: rippleExpand 1.5s ease-out forwards;
  pointer-events: none;
}
.ripple-ring.delay { animation-delay: 0.3s; }
@keyframes rippleExpand {
  from { transform: scale(1); opacity: 0.6; }
  to { transform: scale(2.2); opacity: 0; }
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
  padding: 14px 16px;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  animation: optionEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.option-btn:nth-child(1) { animation-delay: 0.1s; }
.option-btn:nth-child(2) { animation-delay: 0.15s; }
.option-btn:nth-child(3) { animation-delay: 0.2s; }
.option-btn:nth-child(4) { animation-delay: 0.25s; }
@keyframes optionEnter {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
.option-btn:active:not(:disabled) { transform: scale(0.97); }

.option-btn.correct {
  background: rgba(52, 211, 153, 0.15);
  border-color: #34d399;
  color: #34d399;
  animation: bounceCorrect 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes bounceCorrect {
  0% { transform: scale(1); }
  30% { transform: scale(1.03); }
  100% { transform: scale(1); }
}
.option-btn.wrong {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
  animation: shakeWrong 0.5s ease;
}
@keyframes shakeWrong {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
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
