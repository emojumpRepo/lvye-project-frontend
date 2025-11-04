<script lang="ts" setup>
import { computed } from 'vue'
import { safeAreaInsets } from '@/utils/systemInfo'

interface Props {
  title?: string
  showBack?: boolean
  backgroundColor?: string
  titleAlign?: 'left' | 'center'
  fixed?: boolean
  scrollTop?: number // 页面滚动距离，由父组件传入
  scrollThreshold?: number // 滚动多少距离后改变背景色
  onBack?: () => void
}

defineOptions({
  name: 'Navbar',
})

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  backgroundColor: 'transparent',
  titleAlign: 'center',
  fixed: true,
  scrollTop: 0,
  scrollThreshold: 20, // 默认滚动20rpx后改变背景色
})

const emit = defineEmits<{
  back: []
}>()

// 计算当前背景色
const currentBgColor = computed(() => {
  if (props.scrollTop > props.scrollThreshold) {
    return '#ffffff'
  }
  return props.backgroundColor
})

const navbarHeight = computed(() => {
  return `${(safeAreaInsets?.top || 0) + 88}rpx`
})

function handleBack() {
  if (props.onBack) {
    props.onBack()
  }
  else {
    emit('back')
    uni.navigateBack()
  }
}
</script>

<template>
  <view
    class="navbar"
    :class="{ 'navbar--fixed': fixed }"
    :style="{ backgroundColor: currentBgColor, transition: 'background-color 0.2s ease' }"
  >
    <view class="h-88rpx flex items-center justify-between px-32rpx">
      <view class="w-40rpx flex items-center justify-center">
        <view v-if="showBack" @click="handleBack">
          <wd-icon name="arrow-left" size="36rpx" />
        </view>
        <slot v-else name="left" />
      </view>

      <view
        class="title-text flex-1 text-base font-semibold"
        :class="titleAlign === 'center' ? 'text-center' : 'text-left'"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </view>

      <view class="w-40rpx flex items-center justify-center">
        <slot name="right" />
      </view>
    </view>
  </view>

  <view v-if="fixed" class="navbar-placeholder" :style="{ height: navbarHeight }" />
</template>

<style lang="scss" scoped>
.navbar {
  &--fixed {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 999;
    width: 100%;
  }
}

.navbar-placeholder {
  width: 100%;
}
</style>
