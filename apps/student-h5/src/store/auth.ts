import type { ISmsLoginForm } from '@/api/login'
import type { IWebAuthLoginRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  logout as _logout,
  refreshToken as _refreshToken,
  smsLogin as _smsLogin,
} from '@/api/login'
import { useUserStore } from './user'

export const useAuthStore = defineStore(
  'auth',
  () => {
    // 定义token信息
    // Pinia persist 插件会自动处理持久化，不需要手动初始化
    const tokenInfo = ref<IWebAuthLoginRes | null>(null)

    // 在 store 初始化时打印调试信息
    console.log('Auth Store 初始化，tokenInfo:', tokenInfo.value)

    // 设置token信息
    const setTokenInfo = (val: IWebAuthLoginRes) => {
      tokenInfo.value = val
    }

    /**
     * 判断token是否过期
     */
    const isTokenExpired = computed(() => {
      if (!tokenInfo.value || !tokenInfo.value.accessToken) {
        return true
      }

      const now = Date.now()
      const expireTime = tokenInfo.value.expiresTime

      // 提前5分钟判定为过期，避免临界情况
      return now >= new Date(expireTime).getTime() - 5 * 60 * 1000
    })

    /**
     * 判断refreshToken是否有效
     * refreshToken 没有过期时间，只要存在就认为有效
     */
    const hasValidRefreshToken = computed(() => {
      return !!tokenInfo.value?.refreshToken
    })

    /**
     * 判断是否已登录
     * 只要有 refreshToken 就认为已登录（可以通过刷新获取新的 accessToken）
     */
    const hasValidLogin = computed(() => {
      console.log('[hasValidLogin 计算] tokenInfo.value:', tokenInfo.value)
      if (!tokenInfo.value) {
        console.log('[hasValidLogin 计算] tokenInfo 为 null，返回 false')
        return false
      }
      const isLogin = hasValidRefreshToken.value && !!tokenInfo.value.userId
      console.log('[hasValidLogin 计算] hasValidRefreshToken:', hasValidRefreshToken.value, 'userId:', tokenInfo.value.userId, 'isLogin:', isLogin)
      return isLogin
    })

    /**
     * 登录成功后处理逻辑
     * @param loginRes 登录返回的信息
     */
    async function _postLogin(loginRes: IWebAuthLoginRes) {
      // 保存 token 信息
      setTokenInfo(loginRes)

      // 获取用户详细信息
      const userStore = useUserStore()
      try {
        console.log('开始获取用户信息...')
        const userInfo = await userStore.fetchUserInfo()
        console.log('用户信息获取成功:', userInfo)
      }
      catch (error) {
        console.error('获取用户信息失败:', error)
        // 获取用户信息失败不影响登录流程，仅记录错误
      }
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
        console.log('退出登录-清除用户信息')
        tokenInfo.value = null

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

        // 保存 token 信息
        setTokenInfo(res)

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
      return tokenInfo.value?.accessToken || ''
    })

    /**
     * 尝试获取有效的token，如果过期且有refreshToken，则刷新token
     * @returns 有效的token或空字符串
     */
    const tryGetValidToken = async (): Promise<string> => {
      // 如果 accessToken 无效但有 refreshToken，则刷新
      if (!getValidToken.value && hasValidRefreshToken.value) {
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
    const getUserId = computed(() => tokenInfo.value?.userId)

    /**
     * 判断是否为家长登录
     */
    const isParentLogin = computed(() => tokenInfo.value?.isParent === 1)

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
