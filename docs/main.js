import Vue from 'vue'
import App from './APP.vue'
import 'melody.css'
import axios from 'axios'

Vue.prototype.$http = axios

new Vue({
  render: h => h(App)
}).$mount('#app')
