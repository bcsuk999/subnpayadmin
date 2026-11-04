import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import './styles/iconfont.css'
import './styles/base.css'
import './styles/admin-ui.css'
import AdminCard from './components/AdminCard.vue'
import DataTable from './components/DataTable.vue'
import DateRangePicker from './components/DateRangePicker.vue'
import FilterCard from './components/FilterCard.vue'
import PageTabs from './components/PageTabs.vue'
import SelectDropdown from './components/SelectDropdown.vue'
import TableCard from './components/TableCard.vue'
import TableCardHeading from './components/TableCardHeading.vue'
import TableFooter from './components/TableFooter.vue'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}

const app = createApp(App)
app.component('AdminCard', AdminCard)
app.component('DataTable', DataTable)
app.component('DateRangePicker', DateRangePicker)
app.component('FilterCard', FilterCard)
app.component('PageTabs', PageTabs)
app.component('SelectDropdown', SelectDropdown)
app.component('TableCard', TableCard)
app.component('TableCardHeading', TableCardHeading)
app.component('TableFooter', TableFooter)
app.use(router).mount('#app')
