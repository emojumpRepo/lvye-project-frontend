<script lang="ts" setup>
import { getBucketFileUrl } from '@vben/utils'

defineOptions({
  name: 'HeaderBanner',
})
</script>

<template>
  <!-- Logo 和卡通形象区域 -->
  <view class="flex items-start justify-between">
    <image :src="getBucketFileUrl('student_h5/logo/logo_black.png')" class="h-60rpx w-[164rpx]" mode="aspectFit" />
  </view>
</template>
