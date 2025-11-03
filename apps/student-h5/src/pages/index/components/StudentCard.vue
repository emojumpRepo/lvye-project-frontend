<script lang="ts" setup>
import { getBucketFileUrl } from '@vben/utils'

interface Props {
  userName?: string
  studentId?: string
  avatar?: string
}

defineOptions({
  name: 'StudentCard',
})

withDefaults(defineProps<Props>(), {
  userName: '心之旅用户4392',
  studentId: '20251020',
  avatar: '',
})

const emit = defineEmits<{
  logout: []
}>()

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success(res) {
      if (res.confirm) {
        emit('logout')
      }
    },
  })
}
</script>

<template>
  <view class="relative h-[330rpx] rounded-2xl bg-white px-2.5 pb-2.5">
    <view class="flex items-start justify-between px-20rpx">
      <view class="mt-6 flex items-center gap-4">
        <view class="flex flex-col items-center gap-1.5 font-medium">
          <text class="title-text text-36rpx">心之旅AI</text>
          <text class="desc-text text-24rpx">守护心理健康</text>
        </view>
        <view class="center rounded-full bg-[#00BF601A] px-2.5 py-1 text-24rpx text-[#45C887FF]">
          学生卡
        </view>
      </view>
      <image :src="getBucketFileUrl('primary/teaching_teacher.png')" class="h-[280rpx] w-[204rpx]" mode="aspectFit" />
    </view>
    <view class="absolute bottom-0 left-0 right-0 mx-2.5 mb-2.5 flex items-center justify-between rounded-xl bg-[#F7FBFAFF] p-4">
      <!-- 左侧：头像和用户信息 -->
      <view class="flex flex-1 items-center gap-4">
        <image
          v-if="avatar"
          :src="avatar"
          class="h-96rpx w-96rpx rounded-full"
          mode="aspectFill"
        />
        <view v-else class="h-96rpx w-96rpx flex items-center justify-center rounded-full from-green-400 to-green-600 bg-gradient-to-br">
          <text class="text-48rpx text-white">U</text>
        </view>

        <view class="flex flex-col gap-1 font-medium">
          <text class="title-text text-sm">{{ userName }}</text>
          <text class="desc-text text-xs">学号：{{ studentId }}</text>
        </view>
      </view>

      <!-- 右侧：退出登录按钮 -->
      <view
        class="flex items-center justify-center border border-[#F6D1CDFF] rounded-full border-solid bg-[#FFF4F4FF] p-1.2 transition-all duration-300 active:scale-95"
        @click="handleLogout"
      >
        <wd-icon name="poweroff" size="30rpx" color="#E74C3CFF" />
      </view>
    </view>
  </view>
</template>
