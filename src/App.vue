<template>
  <div>
    <!-- PIN Login -->
    <PinLogin v-if="!game.isLoggedIn" @loggedIn="onLogin" />

    <!-- Main App -->
    <div v-else class="app-shell">
      <header class="app-header">
        <div class="header-left">
          <span class="header-title">🔥 燃学英语</span>
        </div>
        <div class="header-right">
          <span v-if="game.cloudOk" class="sync-dot" title="云端已同步">☁️</span>
          <span class="header-level" title="当前等级">
            <span class="level-icon">{{ game.levelInfo.emoji }}</span> Lv.{{ game.state.level }}
          </span>
          <span class="header-stars" title="星星数量">
            <span class="star-icon">⭐</span> {{ game.state.totalStars }}
          </span>
        </div>
      </header>

      <main class="app-content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>

      <nav class="tab-bar">
        <router-link v-for="tab in tabs" :key="tab.path" :to="tab.path"
                     class="tab-item" :class="{ active: currentPath === tab.path }">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from './stores/game'
import PinLogin from './components/PinLogin.vue'

const route = useRoute()
const game = useGameStore()
const currentPath = computed(() => route.path)

const tabs = [
  { icon: '🏠', label: '首页', path: '/home' },
  { icon: '⚔️', label: '冒险', path: '/adventure' },
  { icon: '🏪', label: '商城', path: '/shop' },
  { icon: '👤', label: '我的', path: '/profile' },
]

function onLogin(pin, cloudState) {
  game.login(pin, cloudState)
}

onMounted(() => {
  if (game.isLoggedIn) {
    game.pullCloud()
  }
})
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
}

.app-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0.8));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  z-index: 100;
}

.header-left { display: flex; align-items: center; gap: 8px; }

.header-title {
  font-size: 20px; font-weight: 900;
  background: linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.header-right { display: flex; align-items: center; gap: 12px; }

.sync-dot { font-size: 14px; opacity: 0.6; }

.header-level, .header-stars {
  display: flex; align-items: center; gap: 4px;
  font-size: 14px; font-weight: 700; color: #e2e8f0;
}

.level-icon { font-size: 16px; }
.star-icon { font-size: 15px; }

.app-content { flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; padding-bottom: env(safe-area-inset-bottom); }

.tab-bar {
  flex-shrink: 0; display: flex; align-items: stretch; justify-content: space-around;
  padding: 6px 8px; padding-bottom: max(6px, env(safe-area-inset-bottom));
  background: rgba(15,23,42,0.88);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255,255,255,0.08);
  z-index: 100;
}

.tab-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; flex: 1; padding: 6px 0; text-decoration: none; border-radius: 12px;
  transition: all 0.25s ease;
}

.tab-item.active { background: rgba(245,158,11,0.12); }
.tab-icon { font-size: 22px; line-height: 1; transition: transform 0.25s ease; }
.tab-item.active .tab-icon { transform: scale(1.15); filter: drop-shadow(0 0 6px rgba(245,158,11,0.5)); }
.tab-label { font-size: 11px; font-weight: 500; color: rgba(226,232,240,0.5); transition: color 0.25s ease; }
.tab-item.active .tab-label { color: #f59e0b; font-weight: 700; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
