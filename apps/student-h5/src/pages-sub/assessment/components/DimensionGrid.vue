<script setup lang="ts">
import type { Dimension } from '@vben/types'
import { computed, onMounted, watch } from 'vue'

interface Props {
  dimensionList: Dimension[]
  modelValue?: Dimension | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', dimension: Dimension | null): void
}>()

// 风险等级常量（对应 RiskLevelEnum）
const RISK_LEVEL = {
  NONE: 0,
  LOW: 1,
  MILD: 2,
  MEDIUM: 3,
  SEVERE: 4,
} as const

// 使用常量构建样式映射
function createDimensionColorMap() {
  const map: Record<number, { basicStyle: string, activeStyle: string }> = {}

  map[RISK_LEVEL.NONE] = {
    basicStyle: 'bg-#F7F8FA border-#F7F8FA text-#979899',
    activeStyle: 'bg-#FFFFFF text-#979899 border-#E5E5E5',
  }

  map[RISK_LEVEL.LOW] = {
    basicStyle: 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white',
    activeStyle: 'bg-#EAF8F2FF text-[var(--primary-color)] border-[var(--primary-color)]',
  }

  map[RISK_LEVEL.MILD] = {
    basicStyle: 'bg-#F1CA5CFF border-#F1CA5CFF text-white',
    activeStyle: 'bg-#FDF6E8FF text-#F1CA5CFF border-#F1CA5CFF',
  }

  map[RISK_LEVEL.MEDIUM] = {
    basicStyle: 'bg-#F6AD63FF border-#F6AD63FF text-white',
    activeStyle: 'bg-#FEF3E8FF text-#F6AD63FF border-#F6AD63FF',
  }

  map[RISK_LEVEL.SEVERE] = {
    basicStyle: 'bg-#D55966FF border-#D55966FF text-white',
    activeStyle: 'bg-#FBE8EAFF text-#D55966FF border-#D55966FF',
  }

  return map
}

const DIMENSION_COLOR_MAP = createDimensionColorMap()

// 安全获取维度颜色样式
function getDimensionStyle(riskLevel: number | undefined | null) {
  if (riskLevel == null || !DIMENSION_COLOR_MAP[riskLevel]) {
    // 如果 riskLevel 不存在或不在范围内，返回 NONE 的样式
    return DIMENSION_COLOR_MAP[RISK_LEVEL.NONE]
  }
  return DIMENSION_COLOR_MAP[riskLevel]
}

const activeDimension = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  },
})

function handleDimensionClick(dimension: Dimension) {
  activeDimension.value = dimension
}

// 初始化：如果没有选中的维度且列表不为空，自动选中第一个
onMounted(() => {
  if (!props.modelValue && props.dimensionList.length > 0) {
    activeDimension.value = props.dimensionList[0]
  }
})

// 监听维度列表变化
watch(() => props.dimensionList, (newList) => {
  if (newList.length > 0 && !props.modelValue) {
    activeDimension.value = newList[0]
  }
})
</script>

<template>
  <view class="grid grid-cols-3 gap-4">
    <view
      v-for="dimension in props.dimensionList" :key="dimension.dimensionId"
      class="center border rounded-2xl border-solid p-4 text-28rpx font-medium" :class="[activeDimension === dimension ? getDimensionStyle(dimension.riskLevel).activeStyle : getDimensionStyle(dimension.riskLevel).basicStyle]"
      @click="handleDimensionClick(dimension)"
    >
      {{ dimension.colloquialAlias }}
    </view>
  </view>
</template>
