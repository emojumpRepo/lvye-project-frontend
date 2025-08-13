<script lang="ts" setup>
import type { CoreAssessmentType, DetailedAssessmentType } from '#/api/consult';

import { computed, nextTick, ref, watch } from 'vue';

import { CommonDialogContent } from '#/components/Dialog/CommonDialog';

import CoreAssessment from './components/CoreAssessment.vue';
import DetailedAssessment from './components/DetailedAssessment.vue';
import InfoConfirm from './components/InfoConfirm.vue';

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    step?: number; // 1-3
  }>(),
  {
    step: 1,
  },
);

const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'publish'): void;
}>();

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

const coreAssessment = ref<CoreAssessmentType>({
  issues: [],
  recommendations: '',
  riskLevel: '',
});
const detailedAssessment = ref<DetailedAssessmentType>({
  report: '',
  file: undefined,
});

const canNext = ref(false);

// 仅用于“完成评估”时触发提交弹窗/逻辑，如未使用可移除
// const isPublishOpen = ref(false);

const nextText = computed(() => {
  if (props.step === 1) {
    return '确认，下一步';
  } else if (props.step === 2) {
    return '保存，下一步';
  } else {
    return '完成评估';
  }
});

async function handleNext() {
  if (props.step === 3) {
    // 提交逻辑留空：父层自行处理（可在此发起请求）
  } else {
    emit('next');
  }
}

function handlePrev() {
  emit('prev');
}

// 根据当前步骤重置/设置下一步可用性，避免沿用上一步的状态
watch(
  () => props.step,
  async (v, _oldV) => {
    switch (v) {
      case 1: {
        canNext.value = true;
        break;
      }
      case 2: {
        await nextTick();
        const validator = coreAssessmentRef.value?.validate;
        if (validator) {
          const valid = validator();
          canNext.value = !!valid;
        }
        break;
      }
      case 3: {
        await nextTick();
        const validator = detailedAssessmentRef.value?.validate;
        if (validator) {
          const valid = validator();
          canNext.value = !!valid;
        } else {
          canNext.value = false;
        }
        break;
      }
      default: {
        canNext.value = true;
      }
    }
  },
  { immediate: true },
);

// Step 2: 实时校验
watch(
  coreAssessment,
  () => {
    if (props.step !== 2) return;
    const validator = coreAssessmentRef.value?.validate;
    canNext.value = validator ? !!validator() : false;
  },
  { deep: true },
);

// Step 3: 实时校验
watch(
  detailedAssessment,
  () => {
    if (props.step !== 3) return;
    const validator = detailedAssessmentRef.value?.validate;
    canNext.value = validator ? !!validator() : false;
  },
  { deep: true },
);
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
    :next-text="nextText"
    :loading="loading"
    @prev="handlePrev"
    @next="handleNext"
  >
    <!-- Step 1: 确认信息 -->
    <InfoConfirm
      v-if="props.step === 1"
      :core-assessment="coreAssessment"
      :detailed-assessment="detailedAssessment"
    />

    <!-- Step 2: 核心评估结论（保持实例，避免跨步骤丢失状态） -->
    <KeepAlive>
      <CoreAssessment
        v-if="props.step === 2"
        ref="coreAssessmentRef"
        v-model="coreAssessment"
      />
    </KeepAlive>

    <!-- Step 3: 详细评估内容（保持实例，保留选择方式与已选文件） -->
    <KeepAlive>
      <DetailedAssessment
        v-if="props.step === 3"
        ref="detailedAssessmentRef"
        v-model="detailedAssessment"
      />
    </KeepAlive>
  </CommonDialogContent>
</template>
