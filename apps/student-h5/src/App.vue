<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { navigateToInterceptor } from '@/router/interceptor'
import { useAuthStore, useTenantStore, useThemeStore, useUserStore } from '@/store'

const tenantStore = useTenantStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const themeStore = useThemeStore()

onLaunch((options) => {
  console.log('App Launch', options)

  // 初始化租户ID
  tenantStore.initTenantId()

  // 检查是否已登录
  if (authStore.hasLogin) {
    // 获取用户信息
    userStore.fetchUserInfo()
  }
})

onShow((options) => {
  console.log('App Show', options)

  // 检查租户ID是否有效
  if (!tenantStore.hasValidTenantId) {
    // 如果当前不在无权限页面，则跳转到无权限页面
    const currentPath = getCurrentPages().at(-1)?.route || ''
    if (!currentPath.includes('no-access')) {
      uni.reLaunch({
        url: '/pages/auth/no-access',
      })
      return
    }
  }

  // 处理直接进入页面路由的情况：如h5直接输入路由、微信小程序分享后进入等
  // https://github.com/unibest-tech/unibest/issues/192
  if (options?.path) {
    navigateToInterceptor.invoke({ url: `/${options.path}`, query: options.query })
  }
  else {
    navigateToInterceptor.invoke({ url: '/' })
  }
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
// 移动端样式限制：防止H5在PC端过度拉伸变形
#app {
  min-height: 100vh; // 最小高度为视窗高度
  margin: 0 auto; // 居中显示
  background-color: #fff; // 背景色
  box-shadow: 0 0 20px rgb(0 0 0 / 10%); // 添加阴影效果

  // 在小屏设备上移除阴影和限制
  @media (min-width: 900px) {
    max-width: 480px; // 限制最大宽度
    box-shadow: none;
  }
}

scroll-view {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

image {
  width: 100%;
  height: 100%;
  vertical-align: middle;
}
</style>
