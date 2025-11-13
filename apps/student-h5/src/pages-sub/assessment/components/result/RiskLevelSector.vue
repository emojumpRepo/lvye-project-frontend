<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface RiskLevel {
  name: string
  color: string
  value?: number | string
}

interface Props {
  levels?: RiskLevel[]
  currentLevel?: number | string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  levels: () => [
    { name: '无风险', color: '#45C886FF', value: 1 },
    { name: '低风险', color: '#F1CA5CFF', value: 2 },
    { name: '中风险', color: '#F6AD63FF', value: 3 },
    { name: '高风险', color: '#D55966FF', value: 4 },
  ],
  currentLevel: 1,
  size: 0, // 默认为 0，表示自动计算
})

// 容器实际宽度
const containerWidth = ref(props.size || 300)

// 获取容器宽度
function getContainerWidth() {
  if (props.size > 0) {
    // 如果传入了固定尺寸，直接使用
    containerWidth.value = props.size
    return
  }

  // 否则查询父容器宽度
  uni.createSelectorQuery()
    .in(null)
    .select('.risk-level-sector')
    .boundingClientRect((rect: any) => {
      if (rect && rect.width) {
        // 设置为父容器宽度的 90%，留一些边距
        containerWidth.value = Math.min(rect.width * 0.9, 400)
      }
    })
    .exec()
}

// 监听窗口大小变化
let resizeTimer: number | null = null
function handleResize() {
  if (resizeTimer)
    clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    getContainerWidth()
  }, 300) as unknown as number
}

onMounted(() => {
  setTimeout(() => {
    getContainerWidth()
  }, 100)

  // 监听窗口变化
  uni.onWindowResize(handleResize)
})

onUnmounted(() => {
  if (resizeTimer)
    clearTimeout(resizeTimer)
  uni.offWindowResize(handleResize)
})

const svgSize = computed(() => containerWidth.value)
const centerX = computed(() => svgSize.value / 2)
const centerY = computed(() => svgSize.value / 2)
const borderWidth = computed(() => Math.max(10, svgSize.value * 0.05))
const outerRadius = computed(() => svgSize.value / 2 - 20 - borderWidth.value)
const innerRadius = computed(() => outerRadius.value * 0.2)
const borderOuterRadius = computed(() => outerRadius.value + borderWidth.value)
const borderInnerRadius = computed(() => innerRadius.value - borderWidth.value)

const currentLevelIndex = computed(() => {
  const index = props.levels.findIndex(level => level.value === props.currentLevel)
  return index >= 0 ? index : 0
})

const pointerAngle = computed(() => {
  const levelCount = props.levels.length
  const anglePerLevel = 180 / levelCount
  const targetAngle = currentLevelIndex.value * anglePerLevel + anglePerLevel / 2
  return targetAngle - 90
})

// 指针尺寸
const pointerLength = computed(() => {
  // 指针从内圆边缘延伸到外圆边缘
  return outerRadius.value * 0.4
})

const pointerWidth = computed(() => {
  // 指针宽度固定为 3px
  return 3
})

function getSectorPath(index: number) {
  const levelCount = props.levels.length
  const anglePerLevel = 180 / levelCount

  const startAngle = (index * anglePerLevel - 180) * (Math.PI / 180)
  const endAngle = ((index + 1) * anglePerLevel - 180) * (Math.PI / 180)

  const x1 = centerX.value + outerRadius.value * Math.cos(startAngle)
  const y1 = centerY.value + outerRadius.value * Math.sin(startAngle)
  const x2 = centerX.value + outerRadius.value * Math.cos(endAngle)
  const y2 = centerY.value + outerRadius.value * Math.sin(endAngle)

  const x3 = centerX.value + innerRadius.value * Math.cos(endAngle)
  const y3 = centerY.value + innerRadius.value * Math.sin(endAngle)
  const x4 = centerX.value + innerRadius.value * Math.cos(startAngle)
  const y4 = centerY.value + innerRadius.value * Math.sin(startAngle)

  const largeArcFlag = anglePerLevel > 180 ? 1 : 0

  return `
    M ${x1} ${y1}
    A ${outerRadius.value} ${outerRadius.value} 0 ${largeArcFlag} 1 ${x2} ${y2}
    L ${x3} ${y3}
    A ${innerRadius.value} ${innerRadius.value} 0 ${largeArcFlag} 0 ${x4} ${y4}
    Z
  `
}

function getLabelPosition(index: number) {
  const levelCount = props.levels.length
  const anglePerLevel = 180 / levelCount

  const angle = ((index + 0.5) * anglePerLevel - 180) * (Math.PI / 180)
  const labelRadius = (outerRadius.value + innerRadius.value) / 2

  return {
    x: centerX.value + labelRadius * Math.cos(angle),
    y: centerY.value + labelRadius * Math.sin(angle),
  }
}
</script>

<template>
  <view class="risk-level-sector">
    <view class="sector-container" :style="{ width: `${svgSize}px`, height: `${svgSize / 2 + 40}px` }">
      <svg
        :width="svgSize"
        :height="svgSize / 2 + 40"
        :viewBox="`0 0 ${svgSize} ${svgSize / 2 + 40}`"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          :d="`
          M ${centerX - borderOuterRadius} ${centerY}
          A ${borderOuterRadius} ${borderOuterRadius} 0 0 1 ${centerX + borderOuterRadius} ${centerY}
          L ${centerX + outerRadius} ${centerY}
          A ${outerRadius} ${outerRadius} 0 0 0 ${centerX - outerRadius} ${centerY}
          Z
        `"
          fill="#f7fbfa"
          stroke="none"
        />
        <!-- <path
          :d="`
          M ${centerX - innerRadius} ${centerY}
          A ${innerRadius} ${innerRadius} 0 0 1 ${centerX + innerRadius} ${centerY}
          L ${centerX + borderInnerRadius} ${centerY}
          A ${borderInnerRadius} ${borderInnerRadius} 0 0 0 ${centerX - borderInnerRadius} ${centerY}
          Z
        `"
          fill="#f7fbfa"
          stroke="none"
        /> -->

        <g v-for="(level, index) in levels" :key="index">
          <path :d="getSectorPath(index)" :fill="level.color" fill-opacity="0.9" stroke="none" />
        </g>

        <circle :cx="centerX" :cy="centerY" :r="innerRadius" fill="#fff" stroke="none" />
      </svg>

      <view
        v-for="(level, index) in levels"
        :key="`label-${index}`"
        class="level-label"
        :style="{
          left: `${getLabelPosition(index).x}px`,
          top: `${getLabelPosition(index).y}px`,
        }"
      >
        {{ level.name }}
      </view>

      <!-- 指针 -->
      <view
        class="pointer"
        :style="{
          left: `${centerX}px`,
          top: `${centerY}px`,
          width: `${pointerWidth}px`,
          height: `${pointerLength}px`,
          transform: `translate(-50%, -100%) rotate(${pointerAngle}deg)`,
        }"
      />

      <!-- 指针圆点 -->
      <view
        class="pointer-dot"
        :style="{
          left: `${centerX}px`,
          top: `${centerY}px`,
        }"
      />
    </view>
  </view>
</template>

<style scoped lang="scss">
.risk-level-sector {
  display: flex;
  align-items: center;
  justify-content: center;

  .sector-container {
    position: relative;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .level-label {
    position: absolute;
    z-index: 1;
    font-size: 24rpx;
    color: #fff;
    white-space: nowrap;
    text-shadow: 0 1px 3px rgb(0 0 0 / 20%);
    pointer-events: none;
    user-select: none;
    transform: translate(-50%, -50%);
  }

  .pointer {
    position: absolute;
    z-index: 2;
    pointer-events: none;
    background: var(--title-text-color);
    border-radius: 2px;
    transform-origin: center bottom;
    transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .pointer-dot {
    position: absolute;
    z-index: 3;
    width: 12px;
    height: 12px;
    pointer-events: none;
    background: var(--title-text-color);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
