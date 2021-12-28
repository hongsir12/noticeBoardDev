// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import jq from 'jquery'

//引入echarts可视化图表库
import * as echarts from 'echarts'

// 引入moment时间库
import moment from 'moment'
// 引入ace编辑器组件
import ace from 'ace-builds'
// 引入大屏可视化组件库
import dataV from '@jiaminghi/data-view'
// 引入读取xlsx表格数据组件
import vueXlsxTable from 'vue-xlsx-table'
// 引入可拖拽缩放组件
import VueDraggableResizable from 'vue-draggable-resizable'
// 引入element组件
import './utils/element.js'
// 引入工具类
import './utils/util.js'
// 引入自定义请求方法
import {request} from '@/utils/request.js'
import aceEditor from '@/components/editor/aceEditor.js'


// 引入elementui样式
import 'element-ui/lib/theme-chalk/index.css'
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'
// 引入字体文件
import './assets/font/iconfont.css'
// 引入全局css
import './assets/css/global.less'

window.$ = jq
// 将全局的echarts对象挂载到vue的原型对象上
Vue.prototype.$echarts = echarts
// 将全局的moment对象挂载到vue的原型对象上
Vue.prototype.$moment = moment
// 创建bus总线
Vue.prototype.$bus = new Vue()
// 将自定义请求方法挂载到全局
Vue.prototype.$request = request
Vue.component('vue-draggable-resizable', VueDraggableResizable)

Vue.config.productionTip = false

Vue.use(dataV)
Vue.use(vueXlsxTable,{rABS:false})
Vue.use(ace)
Vue.use(aceEditor)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
