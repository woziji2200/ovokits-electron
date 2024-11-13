import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import IndexPage from '@renderer/views/IndexPage.vue'
import SettingsPage from '@renderer/views/SettingsPage.vue'
import ManagementPage from '@renderer/views/ManagementPage.vue'

const routes = [
    { path: '/', component: IndexPage },
    { path: '/settings', component: SettingsPage },
    { path: '/management', component: ManagementPage }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
