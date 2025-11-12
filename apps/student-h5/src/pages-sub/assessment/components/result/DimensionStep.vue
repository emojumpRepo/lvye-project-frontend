<script lang="ts" setup>
import type { Dimension } from '@vben/types'
import type { stepConfig } from '../../data'

interface Props {
  // 标题文本
  title?: string
  // 渐变色（CSS gradient 字符串）
  gradient?: string
  // 指针样式类型
  pointerType?: 'arrow' | 'dot' | 'line'
  // 指针颜色
  pointerColor?: string
  // 步骤条高度
  barHeight?: string
  // 步骤条圆角
  borderRadius?: string
  // 步骤配置
  steps: stepConfig
  // 维度结果列表
  dimensions: Dimension[]
}

defineOptions({
  name: 'DimensionStep',
})

const props = withDefaults(defineProps<Props>(), {
  title: '您的昼夜节律类型',
  gradient: 'linear-gradient(90deg, #6580FF 0%, #7CCCED 50%, #8FF4AB 100%)',
  pointerType: 'arrow',
  pointerColor: '#DDE8E3FF',
  barHeight: '24rpx',
  borderRadius: '16rpx',
})

const targetDimension = computed(() => {
  return props.dimensions.find(d => props.steps.dimensions?.includes(d.dimensionCode)) ?? null
})

// 计算指针位置
const pointerLeft = computed(() => {
  if (!targetDimension.value)
    return '50%'

  const levelValue = targetDimension.value[props.steps.props as keyof Dimension] as string

  if (!levelValue)
    return '50%'

  // 从 position 配置中获取位置序号（1-based）
  const positionIndex = props.steps.position[levelValue]

  if (!positionIndex)
    return '50%'

  // 计算该位置盒子的中心点百分比
  // 公式：(位置序号 - 0.5) / 总数 * 100
  const percentage = ((positionIndex - 0.5) / props.steps.total) * 100

  return `${percentage}%`
})
</script>

<template>
  <view class="dimension-step">
    <view v-if="title" class="step-title">
      {{ `${title}：${targetDimension.level}` }}
    </view>

    <view class="step-container">
      <view
        class="pointer"
        :class="`pointer-${pointerType}`"
        :style="{
          'left': pointerLeft,
          '--pointer-color': pointerColor,
        }"
      >
        <view v-if="pointerType === 'arrow'" class="pointer-arrow" />
        <view v-if="pointerType === 'dot'" class="pointer-dot" />
        <view v-if="pointerType === 'line'" class="pointer-line" />
      </view>

      <view
        class="step-bar"
        :style="{
          background: gradient,
          height: barHeight,
          borderRadius,
          gridTemplateColumns: `repeat(${steps.total}, 1fr)`,
        }"
      >
        <view v-for="i in steps.total" :key="i" class="step-bar-item" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.dimension-step {
  width: 100%;

  .step-title {
    margin-bottom: 20rpx;
    font-size: 28rpx;
    color: #45c886ff;
    text-align: center;
  }

  .step-container {
    position: relative;
    width: 100%;
    padding-top: 42rpx;
  }

  .step-bar {
    display: grid;
    width: 100%;

    .step-bar-item {
      position: relative;
      height: 100%;

      &::after {
        position: absolute;
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
        content: '';
        background-color: white;
      }

      &:last-child::after {
        display: none;
      }
    }
  }

  .pointer {
    position: absolute;
    top: 0;
    z-index: 10;
    transform: translateX(-50%);

    &.pointer-arrow {
      .pointer-arrow {
        width: 0;
        height: 0;
        border-color: var(--pointer-color) transparent transparent;
        border-style: solid;
        border-width: 20rpx 18rpx 0;
      }
    }

    &.pointer-dot {
      .pointer-dot {
        width: 24rpx;
        height: 24rpx;
        margin-top: -4rpx;
        background-color: var(--pointer-color);
        border: 4rpx solid white;
        border-radius: 50%;
        box-shadow: 0 2rpx 8rpx rgb(0 0 0 / 15%);
      }
    }

    &.pointer-line {
      .pointer-line {
        width: 4rpx;
        height: 32rpx;
        background-color: var(--pointer-color);
        border-radius: 2rpx;
        box-shadow: 0 2rpx 8rpx rgb(0 0 0 / 15%);
      }
    }
  }
}
</style>
