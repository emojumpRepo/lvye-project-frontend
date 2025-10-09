<script setup lang="ts">
import { computed } from 'vue';

export interface ProgressSegment {
  color: string;
  percent: number;
}

interface Props {
  segments: ProgressSegment[];
  height?: number | string;
  showPercent?: boolean;
  borderRadius?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  height: 10,
  showPercent: true,
  borderRadius: 12,
});

// 计算总百分比
const totalPercent = computed(() => {
  return props.segments.reduce((sum, segment) => sum + segment.percent, 0);
});

// 格式化高度和圆角
const heightStyle = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height;
});

const borderRadiusStyle = computed(() => {
  return typeof props.borderRadius === 'number'
    ? `${props.borderRadius}px`
    : props.borderRadius;
});
</script>

<template>
  <div class="assessment-progress">
    <div class="progress-container" :style="{ height: heightStyle }">
      <div
        v-for="(segment, index) in segments"
        :key="index"
        class="progress-segment"
        :style="{
          width: `${segment.percent}%`,
          backgroundColor: segment.color,
          borderTopLeftRadius: index === 0 ? borderRadiusStyle : '0',
          borderBottomLeftRadius: index === 0 ? borderRadiusStyle : '0',
          borderTopRightRadius:
            index === segments.length - 1 ? borderRadiusStyle : '0',
          borderBottomRightRadius:
            index === segments.length - 1 ? borderRadiusStyle : '0',
        }"
      ></div>
    </div>
    <div v-if="showPercent" class="progress-text">
      {{ totalPercent.toFixed(0) }}%
    </div>
  </div>
</template>

<style scoped lang="less">
.assessment-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  .progress-container {
    flex: 1;
    display: flex;
    overflow: hidden;
    background-color: #e9eaec;
    border-radius: 12px;

    .progress-segment {
      height: 100%;
      transition: width 0.3s ease;
    }
  }

  .progress-text {
    font-size: 14px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    min-width: 45px;
    text-align: right;
  }
}
</style>
