import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 租户管理 Store
 */
export const useTenantStore = defineStore(
  'tenant',
  () => {
    // 租户ID
    const tenantId = ref<number | null>(null)

    /**
     * 设置租户ID
     */
    const setTenantId = (id: number | null) => {
      tenantId.value = id
      if (id !== null) {
        uni.setStorageSync('tenant_id', id)
      }
      else {
        uni.removeStorageSync('tenant_id')
      }
    }

    /**
     * 从URL参数或本地存储中初始化租户ID
     */
    const initTenantId = () => {
      // 判断是否为开发环境
      const isDev = import.meta.env.MODE === 'development'

      // 首先尝试从URL参数获取 tenant_id
      // #ifdef H5
      const urlParams = new URLSearchParams(window.location.search)
      const tenantIdFromUrl = urlParams.get('tenant_id')
      if (tenantIdFromUrl) {
        const id = Number.parseInt(tenantIdFromUrl, 10)
        if (!Number.isNaN(id)) {
          setTenantId(id)
          return
        }
      }
      // #endif

      // 尝试从本地存储获取
      const storedTenantId = uni.getStorageSync('tenant_id')
      if (storedTenantId) {
        tenantId.value = storedTenantId
        return
      }

      // 开发环境使用默认值1，生产环境不设置默认值
      if (isDev) {
        setTenantId(1)
      }
      else {
        setTenantId(null)
      }
    }

    /**
     * 检查是否有有效的租户ID
     */
    const hasValidTenantId = computed(() => {
      return tenantId.value !== null && tenantId.value > 0
    })

    /**
     * 获取租户ID
     */
    const getTenantId = computed(() => tenantId.value)

    /**
     * 清除租户ID
     */
    const clearTenantId = () => {
      setTenantId(null)
    }

    return {
      tenantId,
      setTenantId,
      initTenantId,
      hasValidTenantId,
      getTenantId,
      clearTenantId,
    }
  },
  {
    // 添加持久化配置
    persist: true,
  },
)
