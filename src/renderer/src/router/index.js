import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import IndexPage from '@renderer/views/IndexPage.vue'
import SettingsPage from '@renderer/views/SettingsPage.vue'

const routes = [
    { path: '/', component: IndexPage },
    { path: '/settings', component: SettingsPage }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
