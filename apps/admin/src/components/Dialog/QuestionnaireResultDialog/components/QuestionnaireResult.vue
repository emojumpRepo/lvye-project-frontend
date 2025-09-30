<script setup lang="ts">
import type { QuestionnaireResultDataVO } from '@vben/types';

import { ref } from 'vue';

const props = defineProps<{
  questionnaireName: string;
  questionnaireResult: QuestionnaireResultDataVO;
}>();

const riskLevelColorType = ref<Record<number, { bg: string; text: string }>>({
  1: {
    bg: '#04DC7E14',
    text: '#04DC7E',
  },
  2: {
    bg: '#1966FF14',
    text: '#1966FF',
  },
  3: {
    bg: '#FF9C0514',
    text: '#FF9C05',
  },
  4: {
    bg: '#FF083114',
    text: '#FF0831',
  },
});

/**
 * 获取风险等级颜色
 */
function getRiskLevelColor({
  riskLevel,
  isAbnormal,
  type,
}: {
  isAbnormal: number;
  riskLevel: number;
  type: 'bg' | 'text';
}): string {
  const DEFAULT_COLOR = '#666666';

  // 没有问卷名称时返回默认颜色
  if (!props.questionnaireName) {
    return DEFAULT_COLOR;
  }

  // 心理健康评估的特殊处理
  if (props.questionnaireName.includes('心理健康评估')) {
    const isNormal = isAbnormal === 0;
    const colorMap = {
      bg: isNormal ? '#14E77E14' : '#FF083114',
      text: isNormal ? '#14E77E' : '#FF0831',
    };
    return colorMap[type];
  }

  // 其他问卷按照风险等级显示对应颜色
  const colorConfig = riskLevelColorType.value[riskLevel];
  return colorConfig?.[type] || DEFAULT_COLOR;
}
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
            {{ questionnaireResult?.dimensionName }}
          </h3>
          <!-- <div
            class="rounded-full px-3 py-1 text-sm font-medium"
            :class="[
              questionnaireResult?.isAbnormal === 0
                ? 'text-primary bg-[#14E77E14]'
                : 'bg-[#FF083114] text-[#FF0831]',
            ]"
          >
            {{ questionnaireResult?.isAbnormal === 0 ? '正常' : '异常' }}
          </div> -->
          <div
            v-if="questionnaireResult?.level"
            class="rounded-full px-3 py-1 text-sm font-medium"
            :style="{
              backgroundColor: getRiskLevelColor({
                riskLevel: questionnaireResult?.riskLevel || 0,
                isAbnormal: questionnaireResult?.isAbnormal || 0,
                type: 'bg',
              }),
              color: getRiskLevelColor({
                riskLevel: questionnaireResult?.riskLevel || 0,
                isAbnormal: questionnaireResult?.isAbnormal || 0,
                type: 'text',
              }),
            }"
          >
            {{ questionnaireResult.level }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">得分:</span>
          <span
            class="mb-1 text-2xl font-bold"
            :style="{
              color: getRiskLevelColor({
                riskLevel: questionnaireResult?.riskLevel || 0,
                isAbnormal: questionnaireResult?.isAbnormal || 0,
                type: 'text',
              }),
            }"
          >
            {{ questionnaireResult?.score }}
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
          {{ questionnaireResult?.studentComment }}
        </p>
      </div> -->

      <!-- 教师评价 -->
      <div class="rounded-lg bg-[#FF9C0514] p-4">
        <div class="mb-3 flex items-center gap-2">
          <div class="h-2 w-2 rounded-full bg-[#FF9C05]"></div>
          <h4 class="text-sm font-semibold text-[#FF9C05]">教师建议</h4>
        </div>
        <p class="text-sm leading-relaxed text-gray-700">
          {{ questionnaireResult?.teacherComment }}
        </p>
      </div>
    </div>
  </div>
</template>
