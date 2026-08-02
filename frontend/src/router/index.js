import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import AlbumView from '../views/AlbumView.vue'
import AlbumDetailView from '../views/AlbumDetailView.vue'
import EventChoiceView from '../views/EventChoiceView.vue'
import GalleryView from '../views/GalleryView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/album', component: AlbumView },
  { path: '/album/:albumId', component: AlbumDetailView, props: true },
  { path: '/event', component: EventChoiceView },
  { path: '/event/portrait', component: GalleryView, props: { type: 'portrait' } },
  { path: '/event/activity', component: GalleryView, props: { type: 'activity' } },
  { path: '/about', component: AboutView },
  { path: '/contact', component: ContactView }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition);
        } else if (to.hash) {
          resolve({ el: to.hash, behavior: 'smooth' });
        } else {
          resolve({ top: 0, left: 0, behavior: 'instant' });
        }
      }, 50); // 50ms 延遲確保 Vue 組件完全掛載
    });
  },
})

export default router
