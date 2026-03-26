import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Global error handler for debugging
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, 'in', info)
}

app.mount('#app')

// Log if mount succeeded
window.__APP_MOUNTED = true
