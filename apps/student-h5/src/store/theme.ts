import type { ConfigProviderThemeVars } from 'wot-design-uni'

import { defineStore } from 'pinia'

export const useThemeStore = defineStore(
  'theme-store',
  () => {
    /** 主题 */
    const theme = ref<'light' | 'dark'>('light')

    /** 主题变量 */
    const themeVars = ref<ConfigProviderThemeVars>({
      // 配置主题色为项目绿色主题
      colorTheme: '#10B981', // 项目的主题绿色
      // 可以根据需要添加更多主题变量
      // buttonPrimaryBgColor: '#10B981',
      // buttonPrimaryColor: '#ffffff',
    })

    /** 设置主题变量 */
    const setThemeVars = (partialVars: Partial<ConfigProviderThemeVars>) => {
      themeVars.value = { ...themeVars.value, ...partialVars }
    }

    /** 切换主题 */
    const toggleTheme = () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
    }

    return {
      /** 设置主题变量 */
      setThemeVars,
      /** 切换主题 */
      toggleTheme,
      /** 主题变量 */
      themeVars,
      /** 主题 */
      theme,
    }
  },
  {
    persist: true,
  },
)
