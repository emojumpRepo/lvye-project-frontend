<script lang="ts" setup>
import FeatureCard from './components/FeatureCard.vue'

import HeaderBanner from './components/HeaderBanner.vue'
import StudentCard from './components/StudentCard.vue'

defineOptions({
  name: 'Home',
})

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
})
</script>

<template>
  <view class="relative box-border min-h-screen flex flex-col gap-6 p-30rpx pt-6">
    <view class="flex-1 space-y-4">
      <!-- 顶部横幅 -->
      <HeaderBanner />

      <!-- 用户卡片 -->
      <StudentCard />

      <!-- 功能卡片列表 -->
      <FeatureCard />
    </view>

    <!-- 底部标识 -->
    <view class="shrink-0 pb-11 text-center">
      <text class="text-22rpx text-[#2D3E5066]">心之旅 · 守护心理健康</text>
    </view>
  </view>
</template>
