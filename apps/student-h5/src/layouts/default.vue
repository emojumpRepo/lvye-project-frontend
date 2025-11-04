<script lang="ts" setup>
import { safeAreaInsets } from '@/utils/systemInfo'
</script>

<template>
  <view class="basic-layout min-h-screen" :style="{ paddingTop: `${safeAreaInsets?.top}rpx` }">
    <slot />
  </view>
</template>

<style lang="scss" scoped>
.basic-layout {
  background-color: var(--bg-color);
  background-image: url('https://mindtrip-1305613707.cos.ap-guangzhou.myqcloud.com/static/student_h5/index_bg.png');
  background-repeat: no-repeat;
  background-position: top;
  background-size: 100% auto;
}
</style>
