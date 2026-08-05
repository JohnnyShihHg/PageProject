import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import AlbumView from '../views/AlbumView.vue'
import AlbumDetailView from '../views/AlbumDetailView.vue'
import EventChoiceView from '../views/EventChoiceView.vue'
import GalleryView from '../views/GalleryView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { ROUTE_PATHS } from './paths'

// 路徑本身由 ./paths.js 統一定義（Worker 的 404 判斷也讀同一份），這裡只負責把路徑
// 對應到元件。下方兩道檢查會在任何一邊漏改時立刻拋錯，不讓它安靜地分岔。
const routeComponents = {
  '/': { component: Home },
  '/album': { component: AlbumView },
  '/album/:albumId': { component: AlbumDetailView, props: true },
  '/event': { component: EventChoiceView },
  '/event/portrait': { component: GalleryView, props: { type: 'portrait' } },
  '/event/activity': { component: GalleryView, props: { type: 'activity' } },
  '/about': { component: AboutView },
  '/contact': { component: ContactView },
}

const routes = ROUTE_PATHS.map((path) => {
  const entry = routeComponents[path]
  if (!entry) {
    throw new Error(`[router] ROUTE_PATHS 列了 "${path}"，但 routeComponents 沒有對應元件`)
  }
  return { path, ...entry }
})

for (const path of Object.keys(routeComponents)) {
  if (!ROUTE_PATHS.includes(path)) {
    throw new Error(`[router] routeComponents 有 "${path}"，但 ROUTE_PATHS 沒列 —— Worker 會把它當成 404`)
  }
}

// Catch-all 刻意不放進 ROUTE_PATHS：那份清單是「Worker 該回 200 的合法路徑」，
// 把萬用比對加進去會讓所有網址都變成合法，等於把 404 判斷整個廢掉。
// 這條只負責讓前端有東西可以渲染（否則畫面全白），HTTP 狀態碼由 Worker 決定。
routes.push({ path: '/:pathMatch(.*)*', component: NotFoundView })

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
