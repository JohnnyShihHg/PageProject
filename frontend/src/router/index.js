import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import AlbumView from '../views/AlbumView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/album', component: AlbumView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
