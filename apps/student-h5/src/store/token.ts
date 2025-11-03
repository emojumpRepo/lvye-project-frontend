import type { ISmsLoginForm } from '@/api/login'
import type { IWebAuthLoginRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  logout as _logout,
  refreshToken as _refreshToken,
  smsLogin as _smsLogin,
} from '@/api/login'
import { isWebAuthLoginRes } from '@/api/types/login'
import { useUserStore } from './user'

// 初始化状态
const tokenInfoState: IWebAuthLoginRes = {
  userId: 0,
  accessToken: '',
  refreshToken: '',
  expiresTime: '',
  isParent: 0,
}

export const useTokenStore = defineStore(
  'token',
  () => {
    // 定义token信息
    const tokenInfo = ref<IWebAuthLoginRes>({ ...tokenInfoState })

    // 设置token信息
    const setTokenInfo = (val: IWebAuthLoginRes) => {
      tokenInfo.value = val

      // 将 ISO 8601 格式的过期时间转换为时间戳
      if (val.expiresTime) {
        const expireTime = new Date(val.expiresTime).getTime()
        uni.setStorageSync('accessTokenExpireTime', expireTime)
      }

      // 保存 userId 和 isParent
      uni.setStorageSync('userId', val.userId)
      uni.setStorageSync('isParent', val.isParent)
    }

    /**
     * 判断token是否过期
     */
    const isTokenExpired = computed(() => {
      if (!tokenInfo.value || !tokenInfo.value.accessToken) {
        return true
      }

      const now = Date.now()
      const expireTime = uni.getStorageSync('accessTokenExpireTime')

      if (!expireTime)
        return true

      // 提前5分钟判定为过期，避免临界情况
      return now >= expireTime - 5 * 60 * 1000
    })

    /**
     * 判断refreshToken是否过期
     * Web登录没有单独的refreshToken过期时间，使用accessToken过期时间判断
     */
    const isRefreshTokenExpired = computed(() => {
      if (!tokenInfo.value || !tokenInfo.value.refreshToken) {
        return true
      }
      // 简单判断：如果 accessToken 都过期了，refreshToken 也认为过期
      return isTokenExpired.value
    })

    /**
     * 登录成功后处理逻辑
     * @param loginRes 登录返回的信息
     */
    async function _postLogin(loginRes: IWebAuthLoginRes) {
      setTokenInfo(loginRes)
      const userStore = useUserStore()
      // 如果需要获取用户详细信息，可以在这里调用
      // await userStore.fetchUserInfo()
    }

    /**
     * 手机验证码登录
     * @param loginForm 登录表单 { mobile, code }
     * @returns 登录结果
     */
    const login = async (loginForm: ISmsLoginForm) => {
      try {
        const res = await _smsLogin(loginForm)
        console.log('验证码登录成功:', res)
        await _postLogin(res)
        return res
      }
      catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    }

    /**
     * 退出登录并删除用户信息
     */
    const logout = async () => {
      try {
        await _logout()
      }
      catch (error) {
        console.error('退出登录失败:', error)
      }
      finally {
        // 无论成功失败，都需要清除本地信息
        uni.removeStorageSync('accessTokenExpireTime')
        uni.removeStorageSync('userId')
        uni.removeStorageSync('isParent')
        console.log('退出登录-清除用户信息')
        tokenInfo.value = { ...tokenInfoState }

        const userStore = useUserStore()
        userStore.clearUserInfo()
      }
    }

    /**
     * 刷新token
     * @returns 刷新结果
     */
    const refreshToken = async () => {
      try {
        // 检查refreshToken是否存在
        if (!tokenInfo.value.refreshToken) {
          throw new Error('无效的refreshToken')
        }

        const res = await _refreshToken(tokenInfo.value.refreshToken)
        console.log('刷新token成功:', res)

        // refreshToken 返回的也是完整的登录响应
        if (isWebAuthLoginRes(res)) {
          setTokenInfo(res)
        }
        return res
      }
      catch (error) {
        console.error('刷新token失败:', error)
        throw error
      }
    }

    /**
     * 获取有效的token
     */
    const getValidToken = computed(() => {
      // token已过期，返回空
      if (isTokenExpired.value) {
        return ''
      }
      return tokenInfo.value.accessToken || ''
    })

    /**
     * 检查是否有登录信息（不考虑token是否过期）
     */
    const hasLoginInfo = computed(() => {
      return !!tokenInfo.value.accessToken && !!tokenInfo.value.userId
    })

    /**
     * 检查是否已登录且token有效
     */
    const hasValidLogin = computed(() => {
      return hasLoginInfo.value && !isTokenExpired.value
    })

    /**
     * 尝试获取有效的token，如果过期且可刷新，则刷新token
     * @returns 有效的token或空字符串
     */
    const tryGetValidToken = async (): Promise<string> => {
      if (!getValidToken.value && !isRefreshTokenExpired.value) {
        try {
          await refreshToken()
          return getValidToken.value
        }
        catch (error) {
          console.error('尝试刷新token失败:', error)
          return ''
        }
      }
      return getValidToken.value
    }

    /**
     * 获取用户ID
     */
    const getUserId = computed(() => tokenInfo.value.userId)

    /**
     * 判断是否为家长登录
     */
    const isParentLogin = computed(() => tokenInfo.value.isParent === 1)

    return {
      // 核心API方法
      login,
      logout,

      // 认证状态判断（最常用的）
      hasLogin: hasValidLogin,

      // 用户信息
      userId: getUserId,
      isParent: isParentLogin,

      // 内部系统使用的方法
      refreshToken,
      tryGetValidToken,
      validToken: getValidToken,

      // 调试或特殊场景可能需要直接访问的信息
      tokenInfo,
      setTokenInfo,
    }
  },
  {
    // 添加持久化配置，确保刷新页面后token信息不丢失
    persist: true,
  },
)
