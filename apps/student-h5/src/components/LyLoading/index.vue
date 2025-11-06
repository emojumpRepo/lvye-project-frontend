<script setup lang="ts">
/**
 * 封装 wot-design-uni 的 loading 组件
 * 默认使用项目主题色
 */
interface Props {
  color?: string
  size?: number | string
  type?: 'outline' | 'ring'
}

const props = withDefaults(defineProps<Props>(), {
  color: '#10B981', // 项目主题绿色（对应 --primary-color）
  type: 'ring',
})
</script>

<template>
  <wd-loading
    :color="props.color"
    :size="props.size"
    :type="props.type"
  />
</template>
