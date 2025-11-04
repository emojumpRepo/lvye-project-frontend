import type { UserInfo } from '@vben/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAuthPermissionInfo,
} from '@/api/user'

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<UserInfo | null>(null)
    // 用户信息确认状态
    const isInfoConfirmed = ref(false)

    // 设置用户信息
    const setUserInfo = (val: UserInfo, tenantName?: string) => {
      userInfo.value = {
        ...val,
        tenantName: tenantName || '',
      }
    }

    // 设置用户信息确认状态
    const setInfoConfirmed = (confirmed: boolean) => {
      isInfoConfirmed.value = confirmed
      console.log('用户信息确认状态:', confirmed)
    }

    // 删除用户信息
    const clearUserInfo = () => {
      userInfo.value = null
      isInfoConfirmed.value = false
      uni.removeStorageSync('user')
    }

    /**
     * 获取用户信息
     */
    const fetchUserInfo = async () => {
      const res = await getAuthPermissionInfo()
      console.log('获取用户信息', res)
      setUserInfo(res.user, res.tenantName)
      return res
    }

    return {
      userInfo,
      isInfoConfirmed,
      clearUserInfo,
      fetchUserInfo,
      setUserInfo,
      setInfoConfirmed,
    }
  },
  {
    persist: true,
  },
)
