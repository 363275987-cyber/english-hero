<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zelda-darker via-indigo-950 to-zelda-darker px-6">
    <div class="text-5xl mb-6 animate-float">🧚</div>
    <h1 class="text-2xl font-black text-amber-400 mb-2">English Hero</h1>
    <p class="text-white/50 text-sm mb-8">输入你的PIN码继续冒险</p>

    <!-- PIN Input -->
    <div class="flex gap-3 mb-6">
      <div v-for="i in 4" :key="i"
           class="w-14 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black transition-all"
           :class="pin.length >= i
             ? 'border-amber-400 bg-amber-400/10 text-amber-400'
             : 'border-white/20 text-white/20'">
        {{ pin[i - 1] || '' }}
      </div>
    </div>

    <!-- Number Pad -->
    <div class="grid grid-cols-3 gap-2.5 w-60 mb-6">
      <button v-for="n in [1,2,3,4,5,6,7,8,9,null,0,'del']" :key="n"
              @click="n === null ? null : n === 'del' ? delPin() : addPin(n)"
              :disabled="n === null"
              class="h-14 rounded-xl font-bold text-xl transition-all active:scale-95"
              :class="n === null ? 'invisible' : n === 'del' ? 'bg-white/5 text-white/40' : 'bg-white/10 text-white border border-white/10'">
        {{ n === 'del' ? '←' : n }}
      </button>
    </div>

    <!-- Submit -->
    <button v-if="pin.length === 4" @click="submitPin"
            :disabled="loading"
            class="btn-primary text-base px-10 w-60">
      {{ loading ? '连接中...' : '🚀 进入冒险' }}
    </button>

    <p class="text-white/30 text-xs mt-4">首次使用将自动创建存档</p>

    <!-- Import -->
    <div class="mt-8 w-full max-w-xs">
      <button @click="showImport = !showImport" class="text-white/30 text-xs w-full text-center underline">
        {{ showImport ? '收起' : '📖 有存档码？点击导入' }}
      </button>
      <div v-if="showImport" class="mt-3">
        <textarea v-model="importCode"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white h-20 resize-none focus:outline-none focus:border-amber-400"
                  placeholder="粘贴存档码..." autocomplete="off"></textarea>
        <button @click="doImport" class="btn-primary text-xs w-full mt-2">📥 导入存档</button>
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="text-red-400 text-sm mt-3">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const emit = defineEmits(['loggedIn'])

const pin = ref('')
const loading = ref(false)
const error = ref('')
const showImport = ref(false)
const importCode = ref('')

function addPin(n) {
  if (pin.value.length < 4) pin.value += n
}

function delPin() {
  pin.value = pin.value.slice(0, -1)
}

async function submitPin() {
  if (pin.value.length !== 4) return
  loading.value = true
  error.value = ''

  try {
    const { data, error: fetchErr } = await supabase
      .from('hero_game_state')
      .select('state')
      .eq('pin', pin.value)
      .single()

    if (fetchErr && fetchErr.code === 'PGRST116') {
      const { error: insertErr } = await supabase
        .from('hero_game_state')
        .insert({ pin: pin.value, state: {} })
      if (insertErr) throw insertErr
    } else if (fetchErr) {
      throw fetchErr
    }

    localStorage.setItem('english-hero-pin', pin.value)
    emit('loggedIn', pin.value, data?.state || {})
  } catch (e) {
    console.error('PIN login error:', e)
    if (e.message?.includes('does not exist') || e.code === '42P01') {
      error.value = '云端表未创建，请先在 Supabase Dashboard 运行 SQL'
    } else {
      error.value = '连接失败，请检查网络'
    }
  } finally {
    loading.value = false
  }
}

function doImport() {
  try {
    const code = importCode.value.trim()
    if (!code) return
    const json = JSON.parse(atob(code))
    if (json._type === 'english-hero-save') {
      emit('loggedIn', pin.value, json.data)
      importCode.value = ''
      showImport.value = false
    } else {
      error.value = '无效的存档码'
    }
  } catch {
    error.value = '存档码格式错误'
  }
}
</script>
