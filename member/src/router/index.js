import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import AlbumsView from '../views/AlbumsView.vue'
import AlbumDetailView from '../views/AlbumDetailView.vue'
import TagsView from '../views/TagsView.vue'
import UploadView from '../views/UploadView.vue'
import ContentView from '../views/ContentView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { ROUTE_PATHS } from './paths'

// 路徑本身由 ./paths.js 統一定義（Worker 的 404 判斷也讀同一份），這裡只負責把
// 路徑對應到元件。下方兩道檢查會在任何一邊漏改時立刻拋錯，不讓它安靜地分岔。
const routeComponents = {
  '/': { component: DashboardView },
  '/albums': { component: AlbumsView },
  '/albums/:collectionId': { component: AlbumDetailView, props: true },
  '/tags': { component: TagsView },
  '/upload': { component: UploadView },
  '/content': { component: ContentView },
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
// 加進去會讓所有網址都變合法，等於把 404 判斷廢掉。
routes.push({ path: '/:pathMatch(.*)*', component: NotFoundView })

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
