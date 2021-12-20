import Vue from 'vue'
import Router from 'vue-router'
// 引入home主页面视图组件
const home = () => import('../views/home.vue')
// 引入人员周报组件
const weeklyReport = () =>
  import('../views/weeklyReportPage/WeeklyReportPage.vue')
// 引入系统与设备运行情况组件
const SystemAndDevice = () =>
  import('../views/SystemAndDevicePage/SystemAndDevicePage.vue')
// 引入磁盘IO页面组件
const diskIO = () => import('../views/storageReportPage/diskIOPage.vue')
// 引入故障分布页面组件
const fd = () => import('../views/storageReportPage/fdPage.vue')
// 引入交换机接口使用率页面组件
const SIU = () => import('../views/storageReportPage/SIUPage.vue')
// 引入人员周报数据录入页面组件
const wrDataEntry = ()=>import('../views/dataEntryPage/wrDataEntryPage.vue')
// 引入系统与设备数据录入页面组件
const sadDataEntry = ()=>import('../views/dataEntryPage/sadDataEntryPage.vue')
// 引入故障分布数据录入页面组件
const faultDevDataEntry = ()=>import('../views/dataEntryPage/faultDevDataEntryPage.vue')


Vue.use(Router)
const routes = [
  { path: '/', redirect: '/home' },
  {
    path: '/home',
    component: home,
    children: [
      { path: '/weeklyReport', component: weeklyReport },
      { path: '/SystemAndDevice', component: SystemAndDevice },
      { path: '/diskIO', component: diskIO },
      { path: '/fd', component: fd },
      { path: '/SIU', component: SIU },
      {path:'/wrDataEntry',component:wrDataEntry},
      {path:'/sadDataEntry',component:sadDataEntry},
      {path:'/faultDevDataEntry',component:faultDevDataEntry},
    ],
  },
  
]
export default new Router({
  routes,
})
