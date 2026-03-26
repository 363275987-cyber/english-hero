// ===== Sound Effects Manager =====
// Uses Web Audio API to generate simple sound effects (no external files needed)

let audioCtx = null

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

// Play a tone with given frequency, duration, and type
function playTone(freq, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch (e) { /* ignore audio errors */ }
}

// Play a chord (multiple tones at once)
function playChord(freqs, duration, type = 'sine', volume = 0.2) {
  freqs.forEach(f => playTone(f, duration, type, volume))
}

// ===== Sound Effects =====

export const sfx = {
  // ✅ Correct answer — bright ascending ding
  correct() {
    playTone(523.25, 0.1, 'sine', 0.3)  // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.3), 80)  // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.3), 160) // G5
  },

  // ❌ Wrong answer — low buzz
  wrong() {
    playTone(200, 0.15, 'square', 0.15)
    setTimeout(() => playTone(180, 0.2, 'square', 0.15), 100)
  },

  // 🔥 Combo streak — rising tone
  combo(level) {
    const baseFreq = 400 + Math.min(level, 10) * 50
    playTone(baseFreq, 0.08, 'sine', 0.2)
    setTimeout(() => playTone(baseFreq + 100, 0.08, 'sine', 0.2), 60)
    setTimeout(() => playTone(baseFreq + 200, 0.12, 'sine', 0.25), 120)
  },

  // 🎉 Level complete / lesson complete — fanfare
  complete() {
    playChord([523.25, 659.25, 783.99], 0.2, 'sine', 0.2)  // C major
    setTimeout(() => playChord([587.33, 739.99, 880], 0.3, 'sine', 0.25), 200) // D major
    setTimeout(() => playChord([659.25, 783.99, 987.77], 0.5, 'sine', 0.3), 400) // E major
  },

  // ⭐ Star earned
  star() {
    playTone(1200, 0.08, 'sine', 0.15)
    setTimeout(() => playTone(1500, 0.12, 'sine', 0.2), 60)
  },

  // 💥 Boss hit
  bossHit() {
    playTone(150, 0.1, 'sawtooth', 0.2)
    playTone(100, 0.15, 'square', 0.15)
  },

  // 💀 Damage taken
  damage() {
    playTone(100, 0.2, 'sawtooth', 0.2)
    setTimeout(() => playTone(80, 0.3, 'sawtooth', 0.15), 100)
  },

  // 📢 Button click
  click() {
    playTone(800, 0.04, 'sine', 0.1)
  },

  // 🔊 Word block placed
  place() {
    playTone(600, 0.05, 'sine', 0.15)
  },

  // 🔄 Word block removed
  remove() {
    playTone(400, 0.05, 'sine', 0.1)
  },

  // 💡 Hint shown
  hint() {
    playTone(500, 0.08, 'triangle', 0.1)
    setTimeout(() => playTone(600, 0.08, 'triangle', 0.1), 80)
  },

  // 🔇 Mute toggle helper
  _muted: false,
  get muted() { return this._muted },
  mute() { this._muted = true },
  unmute() { this._muted = false },
  toggle() { this._muted = !this._muted },
}

// Wrap playTone to respect mute
const origPlayTone = playTone
// We use a flag-based approach instead of wrapping for simplicity
