<script lang="ts" setup>
import { getBucketFileUrl } from '@vben/utils'
import { safeAreaInsets } from '@/utils/systemInfo'

defineOptions({
  name: 'NoAccess',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '无权限访问',
  },
})

// 刷新页面
function handleRefresh() {
  // #ifdef H5
  window.location.reload()
  // #endif
  // #ifndef H5
  uni.reLaunch({ url: '/pages/index/index' })
  // #endif
}
</script>

<template>
  <view class="default-bg-color h-screen flex flex-col items-center justify-center px-60rpx" :style="{ paddingTop: `${safeAreaInsets?.top}px` }">
    <!-- 提示图标 -->
    <view class="mb-60rpx flex flex-col items-center">
      <view class="mb-40rpx h-240rpx w-240rpx center rounded-full bg-gradient-to-br from-orange-50 to-red-50">
        <wd-icon name="warning" size="120rpx" color="#FF6B6B" />
      </view>
      <text class="title-text mb-24rpx text-48rpx font-bold">暂无权限访问</text>
      <text class="desc-text text-center text-28rpx leading-relaxed">
        抱歉，您当前没有访问该应用的权限。<br>
        请联系管理员获取访问权限。
      </text>
    </view>

    <!-- 操作按钮 -->
    <view class="w-full space-y-4">
      <view
        class="primary-btn h-96rpx center rounded-2xl"
        @click="handleRefresh"
      >
        <text class="text-32rpx text-white font-medium">刷新页面</text>
      </view>
    </view>

    <!-- 提示信息 -->
    <view class="mt-80rpx center flex-col">
      <text class="mb-16rpx text-24rpx text-[var(--desc-text-color)]">如有疑问，请联系管理员</text>
      <text class="text-24rpx text-[var(--primary-color)]">客服电话：400-xxx-xxxx</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
</style>
