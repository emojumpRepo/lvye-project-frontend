<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  // 按钮类型
  type?: 'primary' | 'success' | 'info' | 'warning' | 'error' | 'default' | 'primary-plain'
  // 按钮尺寸
  size?: 'small' | 'medium' | 'large'
  // 是否为朴素按钮
  plain?: boolean
  // 是否禁用
  disabled?: boolean
  // 是否加载中
  loading?: boolean
  // 是否块级元素
  block?: boolean
  // 是否圆形按钮（完全圆角）
  round?: boolean
  // 图标名称
  icon?: string
  // 图标位置
  iconPosition?: 'left' | 'right'
  // 自定义类名
  customClass?: string
  // 自定义样式
  customStyle?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'large',
  plain: false,
  disabled: false,
  loading: false,
  block: false,
  round: false,
  iconPosition: 'left',
})

const emit = defineEmits<{
  click: [event: Event]
}>()

// 计算按钮的自定义样式
const buttonCustomStyle = computed(() => {
  const styles: string[] = []

  // 圆角样式
  if (props.round) {
    styles.push('border-radius: 999rpx')
  }
  else {
    styles.push('border-radius: 32rpx') // 默认圆角 rounded-2xl
  }

  // 高度和字体
  if (props.size === 'large') {
    styles.push('height: 104rpx')
    styles.push('font-size: 28rpx')
    styles.push('font-weight: 500')
  }
  else if (props.size === 'medium') {
    styles.push('height: 96rpx')
    styles.push('font-size: 28rpx')
  }
  else if (props.size === 'small') {
    styles.push('height: 64rpx')
    styles.push('width: 140rpx')
    styles.push('font-size: 28rpx')
  }

  // 类型样式
  if (!props.plain) {
    if (props.type === 'primary') {
      styles.push('background-color: var(--primary-color)')
      styles.push('border-color: var(--primary-color)')
      styles.push('color: #fff')
    }
    else if (props.type === 'primary-plain') {
      styles.push('background-color: #EAF8F2FF')
      styles.push('color: var(--primary-color)')
    }
    else if (props.type === 'default') {
      styles.push('background-color: #fff')
      styles.push('color: #2D3E50CC')
    }
    else if (props.type === 'error') {
      styles.push('background-color: #ef4444')
      styles.push('border-color: #ef4444')
      styles.push('color: #fff')
    }
    else if (props.type === 'success') {
      styles.push('background-color: #10b981')
      styles.push('border-color: #10b981')
      styles.push('color: #fff')
    }
    else if (props.type === 'warning') {
      styles.push('background-color: #f59e0b')
      styles.push('border-color: #f59e0b')
      styles.push('color: #fff')
    }
  }
  else {
    // 朴素按钮样式
    styles.push('background-color: transparent')
    if (props.type === 'primary') {
      styles.push('color: var(--primary-color)')
      styles.push('border-color: var(--primary-color)')
    }
    else if (props.type === 'error') {
      styles.push('color: #ef4444')
      styles.push('border-color: #ef4444')
    }
    else if (props.type === 'success') {
      styles.push('color: #10b981')
      styles.push('border-color: #10b981')
    }
    else if (props.type === 'warning') {
      styles.push('color: #f59e0b')
      styles.push('border-color: #f59e0b')
    }
  }

  // 添加用户自定义样式
  if (props.customStyle) {
    styles.push(props.customStyle)
  }

  return styles.join('; ')
})

// 处理点击事件
function handleClick(event: Event) {
  if (props.disabled || props.loading) {
    return
  }
  emit('click', event)
}
</script>

<template>
  <wd-button
    :type="type === 'primary-plain' ? 'default' : type"
    :size="size"
    :plain="plain"
    :disabled="disabled"
    :loading="loading"
    :block="block"
    :round="false"
    :icon="iconPosition === 'left' ? icon : undefined"
    :icon-right="iconPosition === 'right' ? icon : undefined"
    :custom-class="`ly-button ly-button--${type} ${customClass || ''}`"
    :custom-style="buttonCustomStyle"
    @click="handleClick"
  >
    <slot />
  </wd-button>
</template>
