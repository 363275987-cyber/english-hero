import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/adventure', name: 'Adventure', component: () => import('../views/Adventure.vue') },
  { path: '/learn/:moduleId', name: 'WordLearn', component: () => import('../views/WordLearn.vue') },
  { path: '/review', name: 'Review', component: () => import('../views/ReviewPage.vue') },
  { path: '/weapons', name: 'Weapons', component: () => import('../views/WeaponList.vue') },
  { path: '/boss/:bossId', name: 'BossBattle', component: () => import('../views/BossBattle.vue') },
  { path: '/achievements', name: 'Achievements', component: () => import('../views/AchievementPage.vue') },
  { path: '/grammar', name: 'Grammar', component: () => import('../views/GrammarPage.vue') },
  { path: '/gifts', name: 'Gifts', component: () => import('../views/GiftShop.vue') },
  { path: '/assessment', name: 'Assessment', component: () => import('../views/AssessmentPage.vue') },
  { path: '/shop', name: 'Shop', component: () => import('../views/Shop.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
