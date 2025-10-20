<script lang="ts" setup>
import type {
  AssessmentComfirmInfo,
  CoreAssessmentType,
  DetailedAssessmentType,
} from '@vben/types';

import type { InterventionAssessmentReqVO } from '#/api/psychology';

import { computed, ref } from 'vue';

import { CommonDialogContent } from '#/components/Dialog/CommonDialog';

import CoreAssessment from './components/CoreAssessment.vue';
import DetailedAssessment from './components/DetailedAssessment.vue';
import InfoConfirm from './components/InfoConfirm.vue';

const props = withDefaults(
  defineProps<{
    comfirmInfo: AssessmentComfirmInfo;
    loading?: boolean;
    step?: number; // 1-3
  }>(),
  {
    step: 1,
    loading: false,
  },
);

const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'publish', params: InterventionAssessmentReqVO): void;
}>();

// 步骤标题和描述
const contentHeader: Record<number, { description: string; title: string }> = {
  1: { title: '信息确认', description: '请确认评估信息是否正确' },
  2: { title: '核心评估结论', description: '请对本次咨询进行标准化评估' },
  3: {
    title: '详细评估内容',
    description: '选择评估方式并记录详细的评估过程、分析和依据',
  },
};

const coreAssessmentRef = ref<InstanceType<typeof CoreAssessment>>();
const detailedAssessmentRef = ref<InstanceType<typeof DetailedAssessment>>();

// 核心评估数据
const coreAssessmentData = ref<CoreAssessmentType>({
  issues: [],
  recommendation: 0,
  riskLevel: 0,
});
// 详细评估数据
const detailedAssessmentData = ref<DetailedAssessmentType>({
  report: '',
  fileId: undefined,
});
// 问题类型
const availableIssues = ref<string[]>([
  '学业压力',
  '人际关系',
  '情绪管理',
  '家庭问题',
  '自我认知',
  '适应困难',
]);

/** 添加问题类型 */
function handleAddNewIssue(name: string) {
  if (name && !availableIssues.value.includes(name)) {
    availableIssues.value.push(name);
  }
}

/**
 * 是否可以下一步
 */
const canNext = computed(() => {
  switch (props.step) {
    case 1: {
      return true;
    }
    case 2: {
      return !!coreAssessmentRef.value?.validate();
    }
    case 3: {
      return !!detailedAssessmentRef.value?.validate();
    }
    default: {
      return false;
    }
  }
});

/** 下一步文案 */
const nextText = computed(() => {
  if (props.step === 1) {
    return '确认，下一步';
  } else if (props.step === 2) {
    return '保存，下一步';
  } else {
    return '完成评估';
  }
});

/** 上一步触发 */
function handlePrev() {
  emit('prev');
}

/** 下一步触发 */
async function handleNext() {
  if (props.step === 3) {
    const params = {
      riskLevel: coreAssessmentData.value.riskLevel,
      problemTypes: coreAssessmentData.value.issues,
      followUpSuggestion: coreAssessmentData.value.recommendation,
      content: detailedAssessmentData.value.report || '',
      fileId: detailedAssessmentData.value.fileId,
      attachments: detailedAssessmentData.value.fileId
        ? [detailedAssessmentData.value.fileId]
        : undefined,
    };

    emit('publish', params);
  } else {
    emit('next');
  }
}
</script>

<template>
  <CommonDialogContent
    :title="contentHeader[props.step]?.title"
    :description="contentHeader[props.step]?.description"
    :show-prev="props.step > 1"
    :show-save="props.step === 3"
    save-text="保存草稿"
    :show-next="true"
    :next-disabled="!canNext"
    :save-disabled="!canNext"
    :next-text="nextText"
    :loading="loading"
    @prev="handlePrev"
    @next="handleNext"
  >
    <!-- Step 1: 确认信息 -->
    <InfoConfirm v-if="props.step === 1" :comfirm-info="props.comfirmInfo" />

    <!-- Step 2: 核心评估结论（保持实例，避免跨步骤丢失状态） -->
    <KeepAlive v-else-if="props.step === 2">
      <CoreAssessment
        ref="coreAssessmentRef"
        v-model="coreAssessmentData"
        :available-issues="availableIssues"
        @handle-add-new-issue="handleAddNewIssue"
      />
    </KeepAlive>

    <!-- Step 3: 详细评估内容（保持实例，保留选择方式与已选文件） -->
    <KeepAlive v-else>
      <DetailedAssessment
        ref="detailedAssessmentRef"
        v-model="detailedAssessmentData"
        :summary="coreAssessmentData"
      />
    </KeepAlive>
  </CommonDialogContent>
</template>
