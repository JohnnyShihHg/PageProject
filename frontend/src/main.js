import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { MasonryWall } from '@yeger/vue-masonry-wall'

createApp(App).use(router).component('MasonryWall', MasonryWall).mount('#app')
