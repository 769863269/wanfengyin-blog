import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { lazyBg } from './directives/lazyBg'

import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'

const app = createApp(App)
app.directive('lazy-bg', lazyBg)
app.use(router)
app.mount('#app')
