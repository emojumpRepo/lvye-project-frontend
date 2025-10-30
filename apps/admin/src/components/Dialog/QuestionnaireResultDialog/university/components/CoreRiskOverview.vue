<script setup lang="ts">
import type { MtuiUniversityResultRespVO } from '#/api/psychology/assessment/index';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Popover } from 'ant-design-vue';

import { getColorConfig } from '#/api/constants';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { getDictLabel } from '#/utils/dict';

import AssessmentRadar from '../../components/AssessmentRadar.vue';
import { useDimensionFormatter } from '../../composables/useDimensionFormatter';
import {
  FINAL_ADVICE_DESCRIPTION,
  FINAL_RISK_LEVEL_SUMMARY_MAP,
} from '../constants';

const props = defineProps<{
  mtuiResult?: MtuiUniversityResultRespVO;
}>();

// 将 props.mtuiResult?.questionnaireResults 转换为响应式 computed
const questionnaireResults = computed(
  () => props.mtuiResult?.questionnaireResults ?? [],
);

// 使用维度格式化 composable
const {
  formattedResults: formattedMtuiResult,
  getFormattedDimensionsByRiskLevel,
} = useDimensionFormatter(questionnaireResults);

// 极端行为维度结果
const extremeBehaviorDimensionResult = computed(() => {
  return formattedMtuiResult.value
    .find((item) => item.questionnaireName.includes('极端行为'))
    ?.dimensionResults.find((item) => item.dimensionName.includes('极端行为'));
});

/**
 * 参与测评计算的其他重点维度结果
 */

// 重度风险维度
const heavyRiskDimensions = computed(() =>
  getFormattedDimensionsByRiskLevel(4),
);

// 中/中重度风险维度
const moderateRiskDimensions = computed(() =>
  getFormattedDimensionsByRiskLevel(3),
);

// 轻度风险维度
const lightRiskDimensions = computed(() =>
  getFormattedDimensionsByRiskLevel(2),
);

/**
 * 综合建议总结列表
 */
const summaryList = computed(() => {
  return [
    extremeBehaviorDimensionResult.value?.teacherComment,
    ...(FINAL_RISK_LEVEL_SUMMARY_MAP[
      props.mtuiResult?.assessmentResult.combinedRiskLevel ?? 1
    ] ?? []),
  ];
});
</script>

<template>
  <div class="space-y-4 rounded-xl bg-white p-5">
    <LyCardTitle
      title="核心风险速览"
      icon="ix:user-filled"
      title-class="text-base font-bold text-[#000000D9] sm:text-lg"
      hide-line
      icon-bg="linear-gradient(143.39deg, #FFB6D9 11.39%, #FF1271 89.3%)"
    />

    <div class="horizontal-divider"></div>

    <div class="flex items-center gap-4">
      <div class="risk-card">
        <AssessmentRadar
          :questionnaire-result="props.mtuiResult?.questionnaireResults ?? []"
        />
      </div>
      <div class="risk-card flex flex-col items-center justify-center gap-4">
        <span class="font-bold text-[#17191AFF]">综合风险评级</span>
        <div
          class="mb-4 flex items-center justify-center rounded-2xl border border-solid px-6 py-3 text-2xl font-bold tracking-wider"
          :style="{
            backgroundColor: getColorConfig({
              dictValue: props.mtuiResult?.assessmentResult.combinedRiskLevel,
              target: 'bg',
            }) as string,
            borderColor: '#FFB1BEFF',
            color: getColorConfig({
              dictValue: props.mtuiResult?.assessmentResult.combinedRiskLevel,
              target: 'color',
            }) as string,
          }"
        >
          {{ props.mtuiResult?.assessmentResult.riskLevelDescription }}
        </div>

        <div class="level-text flex w-full flex-col gap-4 px-6">
          <!-- 极端行为风险 -->
          <div>
            <span
              :style="{
                color: getColorConfig({
                  dictValue: extremeBehaviorDimensionResult?.riskLevel,
                  target: 'color',
                }) as string,
              }"
              >极端行为风险：
            </span>
            <span>
              {{
                getDictLabel(
                  'questionnaire_result_risk_level',
                  extremeBehaviorDimensionResult?.riskLevel,
                )
              }}
            </span>
          </div>

          <!-- 其他重点维度风险 -->
          <div>
            <div class="flex flex-col gap-2">
              <div>其他重点维度风险：</div>

              <!-- 重度风险 -->
              <div
                v-if="heavyRiskDimensions.length > 0"
                class="other-dimension-line"
              >
                <span
                  :style="{
                    color: getColorConfig({
                      dictValue: 4,
                      target: 'color',
                    }) as string,
                  }"
                >
                  重度（{{ heavyRiskDimensions.length }}）：
                </span>
                <span class="dimension-name">
                  {{ heavyRiskDimensions.join('、') }}
                </span>
              </div>

              <!-- 中/中重度风险 -->
              <div
                v-if="moderateRiskDimensions.length > 0"
                class="other-dimension-line"
              >
                <span
                  :style="{
                    color: getColorConfig({
                      dictValue: 3,
                      target: 'color',
                    }) as string,
                  }"
                >
                  中/中重度（{{ moderateRiskDimensions.length }}）：
                </span>
                <span class="dimension-name">
                  {{ moderateRiskDimensions.join('、') }}
                </span>
              </div>

              <!-- 轻度风险 -->
              <div
                v-if="lightRiskDimensions.length > 0"
                class="other-dimension-line"
              >
                <span
                  :style="{
                    color: getColorConfig({
                      dictValue: 2,
                      target: 'color',
                    }) as string,
                  }"
                >
                  轻度（{{ lightRiskDimensions.length }}）：
                </span>
                <span class="dimension-name">
                  {{ lightRiskDimensions.join('、') }}
                </span>
              </div>

              <!-- 无风险时提示 -->
              <div
                v-if="
                  heavyRiskDimensions.length === 0 &&
                  moderateRiskDimensions.length === 0 &&
                  lightRiskDimensions.length === 0
                "
                class="dimension-name indent-4"
              >
                暂无风险
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 综合建议 -->
    <div
      class="rounded-xl border border-solid border-[#04DC70FF] bg-[#14E77E14] p-5"
    >
      <div class="flex items-center gap-2 text-base font-bold text-[#17191AD9]">
        综合建议
        <Popover
          :content="FINAL_ADVICE_DESCRIPTION"
          placement="right"
          arrow-point-at-center
          :mouse-enter-delay="0.3"
          :mouse-leave-delay="0.1"
          :overlay-style="{
            maxWidth: '400px',
            wordWrap: 'break-word',
          }"
        >
          <IconifyIcon
            icon="material-symbols:help"
            class="cursor-pointer text-lg text-[#04DC70] transition-colors hover:text-[#04DC70]/80"
          />
        </Popover>
      </div>
      <div class="horizontal-divider !bg-[#CEEAE4FF]"></div>
      <div class="flex flex-col gap-2 text-sm text-[#17191A99]">
        <span
          v-for="(item, index) in summaryList"
          :key="index"
          :style="{
            color:
              index === 0
                ? (getColorConfig({
                    dictValue: extremeBehaviorDimensionResult?.riskLevel,
                    target: 'color',
                  }) as string)
                : '#17191A99',
          }"
        >
          <span class="mr-2 font-bold"> · </span>
          {{ item }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.horizontal-divider {
  display: inline-block;
  width: 100%;
  height: 0.5px;
  margin: 12px 0;
  background: #f2f3f5ff;
}

.risk-card {
  @apply h-[400px] w-[50%] rounded-xl border border-[#EEEFF5FF] bg-[#FAFDFFFF];

  .level-text {
    font-size: 14px;
    font-weight: bold;
  }

  .dimension-name {
    @apply text-sm font-medium text-[#17191a99];
  }

  .other-dimension-line {
    @apply ml-4;
  }
}
</style>
