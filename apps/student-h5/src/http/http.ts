import type { IWebAuthLoginRes } from '@/api/types/login'
import type { CustomRequestOptions, IResponse } from '@/http/types'
import { nextTick } from 'vue'
import { LOGIN_PAGE } from '@/router/config'
import { useAuthStore } from '@/store/auth'
import { ResultEnum } from './tools/enum'

// 刷新 token 状态管理
let refreshing = false // 防止重复刷新 token 标识
let taskQueue: (() => void)[] = [] // 刷新 token 请求队列

export function http<T>(options: CustomRequestOptions) {
  // 1. 返回 Promise 对象
  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success: async (res) => {
        const responseData = res.data as IResponse<T>
        const { code } = responseData

        // 检查是否是401错误（包括HTTP状态码401或业务码401）
        const isTokenExpired = res.statusCode === 401 || code === 401

        // 检查服务器处理业务逻辑是否成功
        const isSuccess = code === 400

        if (isTokenExpired) {
          const authStore = useAuthStore()

          // 检查是否有 refreshToken
          const { refreshToken } = authStore.tokenInfo as IWebAuthLoginRes || {}

          // 如果没有 refreshToken，直接清理用户信息，跳转到登录页
          if (!refreshToken) {
            await authStore.logout()
            uni.navigateTo({ url: LOGIN_PAGE })
            return reject(res)
          }

          /* -------- 无感刷新 token ----------- */
          // token 失效的，且有刷新 token 的，才放到请求队列里
          taskQueue.push(async () => {
            try {
              const result = await http<T>(options)
              resolve(result)
            }
            catch (err) {
              reject(err)
            }
          })

          // 如果有 refreshToken 且未在刷新中，发起刷新 token 请求
          if (!refreshing) {
            refreshing = true
            try {
              // 发起刷新 token 请求（使用 store 的 refreshToken 方法）
              await authStore.refreshToken()
              // 刷新 token 成功
              refreshing = false
              console.log('Token 刷新成功')
              // 将任务队列的所有任务重新请求
              taskQueue.forEach(task => task())
              taskQueue = []
            }
            catch (refreshErr) {
              console.error('刷新 token 失败:', refreshErr)
              refreshing = false
              // 刷新失败，清空队列并拒绝所有请求
              taskQueue.forEach((task) => {
                try {
                  task() // 执行任务，让它们自己处理错误
                }
                catch (err) {
                  // 忽略错误
                }
              })
              taskQueue = []
              // 刷新 token 失败，跳转到登录页
              nextTick(() => {
                // 关闭其他弹窗
                uni.hideToast()
                uni.showToast({
                  title: '登录已过期，请重新登录',
                  icon: 'none',
                })
              })
              // 清除用户信息
              await authStore.logout()
              // 跳转到登录页
              setTimeout(() => {
                uni.navigateTo({ url: LOGIN_PAGE })
              }, 2000)
            }
          }

          // 不要立即 reject，让队列中的任务来决定 Promise 的最终状态
          return
        }

        if (isSuccess) {
          console.log('请求错误:', responseData)
          uni.showToast({
            icon: 'none',
            title: responseData.msg || responseData.message || '请求错误',
          })
          return reject(responseData)
        }

        // 处理其他成功状态（HTTP状态码200-299）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 处理业务逻辑错误
          if (code !== ResultEnum.Success0 && code !== ResultEnum.Success200) {
            uni.showToast({
              icon: 'none',
              title: responseData.msg || responseData.message || '请求错误',
            })
          }
          return resolve(responseData.data)
        }

        // 处理其他错误
        !options.hideErrorToast
        && uni.showToast({
          icon: 'none',
          title: (res.data as any).msg || '请求错误',
        })
        reject(res)
      },
      // 响应失败
      fail(err) {
        uni.showToast({
          icon: 'none',
          title: '网络错误，换个网络试试',
        })
        reject(err)
      },
    })
  })
}

/**
 * GET 请求
 * @param url 后台地址
 * @param query 请求query参数
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpGet<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'GET',
    header,
    ...options,
  })
}

/**
 * POST 请求
 * @param url 后台地址
 * @param data 请求body参数
 * @param query 请求query参数，post请求也支持query，很多微信接口都需要
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpPost<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    header,
    ...options,
  })
}
/**
 * PUT 请求
 */
export function httpPut<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    data,
    query,
    method: 'PUT',
    header,
    ...options,
  })
}

/**
 * DELETE 请求（无请求体，仅 query）
 */
export function httpDelete<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'DELETE',
    header,
    ...options,
  })
}

// 支持与 axios 类似的API调用
http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete

// 支持与 alovaJS 类似的API调用
http.Get = httpGet
http.Post = httpPost
http.Put = httpPut
http.Delete = httpDelete
