import axios from 'axios'
import  '../../static/config.js'
import { deepClone } from '@/utils/deepClone'
export function request(url, params, type) {
  // 请求超过30秒则判定为超时
  const instance = axios.create({
    baseURL: window.gurl.SERVICE_CONTEXT_PATH,
    // baseURL: 'http://localhost:8002/expand/report/',
    timeout: 30000,
    withCredentials: false,
  })
  // axios拦截器
  if (url === 'apiDelete') {
    // 请求拦截
    instance.interceptors.request.use(
      config => {
        config.data.msgid = 'string'
        config.data.session = 'string'
        config.data.source = 'string'
        config.data.timestamp = new Date().format('yyyy-MM-dd hh:mm:ss')
        return config
      },
      err => {
        console.log(err)
      }
    )
  } else {
    // 请求拦截
    instance.interceptors.request.use(
      config => {
        let params = deepClone(config.data)
        for (let k in config.data) {
          delete config.data[k]
        }
        config.data.data = []
        config.data.data.push(params)
        config.data.msgid = 'string'
        config.data.session = 'string'
        config.data.source = 'string'
        config.data.timestamp = new Date().format('yyyy-MM-dd hh:mm:ss')
        return config
      },
      err => {
        console.log(err)
      }
    )
  }

  //   响应拦截器
  instance.interceptors.response.use(res => {
    res = res.data
    return res
  })
  instance.defaults.withCredentials = false
  instance.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
  if (!type || type == 'get') {
    if (params) {
      params = {
        params: params,
      }
      return instance.get(url, params)
    } else {
      return instance.get(url)
    }
  } else if (type == 'post') {
    return instance.post(url, params)
  }
}
