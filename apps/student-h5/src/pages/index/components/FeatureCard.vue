<script lang="ts" setup>
import { getBucketFileUrl } from '@vben/utils'

defineOptions({
  name: 'FeatureCard',
})

const emit = defineEmits<{
  click: []
}>()

// 功能列表
const features = [
  {
    id: 'evaluation',
    title: '心理测评',
    titleClass: 'text-[#128074FF] text-base',
    description: '探索内心世界，了解心理状态',
    descriptionClass: 'text-[#12807466]',
    hasButton: true,
    bgColor: 'linear-gradient( 180deg, #EEFFF5 0%, #FFFFFF 100%)',
    icon: 'student_h5/icon/home/evaluation_icon.svg ',
    handleClick: () => {
      uni.navigateTo({ url: '/pages/assessment/list' })
    },
  },
  {
    id: 'mindfulness',
    title: '正念练习',
    titleClass: 'text-[#5B40ACFF] text-base',
    description: '放松身心，专注当下时刻',
    descriptionClass: 'text-[#5B40AC66]',
    hasButton: false,
    bgColor: 'linear-gradient( 180deg, #EFEDFF 0%, #FFFFFF 100%)',
    handleClick: () => {
      uni.navigateTo({ url: '/pages/mindfulness/index' })
    },
  },
  {
    id: 'ai-chat',
    title: 'AI对话',
    titleClass: 'text-[#346BA6FF] text-base',
    description: '倾诉烦恼，获得温暖支持',
    hasButton: false,
    descriptionClass: 'text-[#346BA666]',
    bgColor: 'linear-gradient( 180deg, #E9F7FF 0%, #FFFFFF 100%)',
    handleClick: () => {
      uni.navigateTo({ url: '/pages/ai-chat/index' })
    },
  },
  {
    id: 'service-hotline',
    title: '心理咨询服务热线',
    titleClass: 'title-text text-sm',
    description: '专业心理援助，24小时守护',
    descriptionClass: 'desc-text',
    hasButton: true,
    bgColor: '#FFFFFF',
    icon: 'student_h5/icon/home/service_hotline_icon.svg',
    handleClick: () => {
      console.log('点击心理咨询服务热线')
      // uni.navigateTo({ url: '/pages/hotline/index' })
    },
  },
]
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <template v-for="feature in features" :key="feature.id">
      <view
        class="relative flex flex-col justify-between rounded-2xl p-4"
        :class="{
          'row-span-2': feature.id === 'evaluation',
          'col-span-2 !flex-row gap-4 items-center': feature.id === 'service-hotline',
        }"
        :style="{ background: feature.bgColor }"
        @click="!feature.hasButton ? feature.handleClick() : null"
      >
        <view v-if="feature.id === 'service-hotline'">
          <image :src="getBucketFileUrl(feature.icon)" class="h-110rpx w-110rpx" mode="aspectFit" />
        </view>

        <view class="flex flex-1 flex-col gap-1">
          <text class="font-semibold" :class="feature.titleClass">{{ feature.title }}</text>
          <text class="text-xs font-medium" :class="feature.descriptionClass">{{ feature.description }}</text>
        </view>

        <view v-if="feature.hasButton" class="h-fit w-fit flex-shrink-0 rounded-full bg-[#45C887FF] px-3.5 py-1.5" @click="feature.handleClick()">
          <text class="text-sm text-white">去查看</text>
        </view>

        <view v-if="feature.id === 'evaluation'">
          <image :src="getBucketFileUrl(feature.icon)" class="absolute bottom-0 right-0 h-164rpx w-164rpx" mode="aspectFit" />
        </view>
      </view>
    </template>
  </div>
</template>
