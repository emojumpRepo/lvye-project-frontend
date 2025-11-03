<script lang="ts" setup>
import { safeAreaInsets } from '@/utils/systemInfo'
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

// 用户信息
const userInfo = ref({
  userName: '心之旅用户4392',
  studentId: '20251020',
  avatar: '',
})

// 处理退出登录
function handleLogout() {
  uni.showLoading({ title: '退出中...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.reLaunch({ url: '/pages/auth/login' })
  }, 500)
}
</script>

<template>
  <view class="relative box-border min-h-screen flex flex-col gap-6 bg-#F4F9F9FF p-30rpx" :style="{ paddingTop: `${safeAreaInsets?.top + 30}rpx` }">
    <view class="flex-1 space-y-4">
      <!-- 顶部横幅 -->
      <HeaderBanner />

      <!-- 用户卡片 -->
      <StudentCard
        :user-name="userInfo.userName"
        :student-id="userInfo.studentId"
        :avatar="userInfo.avatar"
        @logout="handleLogout"
      />

      <!-- 功能卡片列表 -->
      <FeatureCard />
    </view>

    <!-- 底部标识 -->
    <view class="shrink-0 pb-11 text-center">
      <text class="text-22rpx text-[#2D3E5066]">心之旅AI · 守护心理健康</text>
    </view>
  </view>
</template>
