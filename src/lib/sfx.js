const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
  gain.gain.setValueAtTime(volume, audioCtx.currentTime)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + duration)
}

export const sfx = {
  attack: () => playTone(200, 0.15, 'sawtooth', 0.3),
  hitBoss: () => playTone(150, 0.1, 'square', 0.4),
  shieldBlock: () => playTone(800, 0.2, 'sine', 0.3),
  bossAttack: () => {
    playTone(80, 0.3, 'square', 0.5)
    playTone(60, 0.2, 'sawtooth', 0.4)
  },
  weaponBreak: () => {
    playTone(100, 0.5, 'sawtooth', 0.3)
    playTone(50, 0.8, 'sine', 0.2)
  },
  playerHit: () => playTone(200, 0.2, 'sine', 0.2),
  victory: () => {
    playTone(523, 0.1, 'sine', 0.4)
    setTimeout(() => playTone(659, 0.1, 'sine', 0.4), 100)
    setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 200)
  },
  death: () => {
    playTone(300, 0.3, 'sawtooth', 0.4)
    setTimeout(() => playTone(200, 0.4, 'sine', 0.3), 200)
  },
  click: () => playTone(600, 0.05, 'sine', 0.2),
}

export function stopAll() {
  audioCtx?.close()
}
