<script setup lang="ts">
import type { Dimension } from '@vben/types';

import { computed } from 'vue';

const props = defineProps<{
  dimension: Dimension;
  getDimensionColor: (config: {
    isAbnormal: number;
    questionnaireName: string;
    riskLevel: number;
    type: 'bg' | 'color';
  }) => string;
  questionnaireName: string;
}>();

const questionnaireDimension = computed(() => {
  const data = {
    questionnaireName: props.questionnaireName,
    riskLevel: props.dimension.riskLevel,
    isAbnormal: props.dimension.isAbnormal,
  };
  return {
    ...props.dimension,
    color: props.getDimensionColor({ ...data, type: 'color' }),
    backgroundColor: props.getDimensionColor({ ...data, type: 'bg' }),
  };
});
</script>

<template>
  <div
    class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
  >
    <!-- 维度头部信息 -->
    <div class="border-b border-gray-100 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-medium text-gray-900">
            {{ questionnaireDimension?.name }}
          </h3>
          <div
            v-if="dimension?.level"
            class="rounded-full px-3 py-1 text-sm font-medium"
            :style="{
              backgroundColor: questionnaireDimension?.backgroundColor,
              color: questionnaireDimension?.color,
            }"
          >
            {{ dimension.level }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">得分:</span>
          <span
            class="mb-1 text-2xl font-bold"
            :style="{ color: questionnaireDimension?.color }"
          >
            {{ dimension?.score }}
          </span>
        </div>
      </div>
    </div>

    <!-- 评价内容 -->
    <div class="space-y-4 p-4">
      <!-- 学生评价 -->
      <!-- <div class="rounded-lg bg-[#1966FF14] p-4">
        <div class="mb-3 flex items-center gap-2">
          <div class="h-2 w-2 rounded-full bg-[#1966FF]"></div>
          <h4 class="text-sm font-semibold text-[#1966FF]">学生建议</h4>
        </div>
        <p class="text-sm leading-relaxed text-gray-700">
          {{ dimension?.studentComment }}
        </p>
      </div> -->

      <!-- 教师评价 -->
      <div class="rounded-lg bg-[#FF9C0514] p-4">
        <div class="mb-3 flex items-center gap-2">
          <div class="h-2 w-2 rounded-full bg-[#FF9C05]"></div>
          <h4 class="text-sm font-semibold text-[#FF9C05]">教师建议</h4>
        </div>
        <p class="text-sm leading-relaxed text-gray-700">
          {{ dimension?.teacherComment }}
        </p>
      </div>
    </div>
  </div>
</template>
