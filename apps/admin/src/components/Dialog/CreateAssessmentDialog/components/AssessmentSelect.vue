<script lang="ts" setup>
import type { QuestionnaireVO } from '@vben/types';

import type { PsychologyScenarioApi } from '#/api/psychology/scenario';

import { computed, inject, nextTick, onMounted, ref, watch } from 'vue';

import { Modal as AModal, message, Select, Steps } from 'ant-design-vue';

import { getQuestionnaireListSimple } from '#/api/psychology/questionnaire';
import {
  getAssessmentScenarioList,
  getAssessmentScenarioSlots,
} from '#/api/psychology/scenario';
import LyButton from '#/components/LyButton/index.vue';

const { start, stop } = inject('CommonDialogContentLoading') as {
  set: (v: boolean) => void;
  start: () => void;
  stop: () => void;
};

// 多选：选中的量表列表（支持 v-model:assessments）
const selectedList = defineModel<QuestionnaireVO[]>('assessments', {
  default: [],
});
const selectedIds = computed(() => selectedList.value.map((i) => i.id));

// 场景ID双向绑定（支持 v-model:scenario-id）
const selectedScenarioId = defineModel<number | undefined>('scenarioId', {
  default: undefined,
});

const isModalOpen = ref(false);
const assessmentDetail = ref<null | QuestionnaireVO>(null);

const assessmentList = ref<QuestionnaireVO[]>([]);
// 可用场景与限制
type SimpleScenario = {
  id: number;
  maxQuestionnaireCount?: number;
  name: string;
};
const scenarioList = ref<SimpleScenario[]>([]);
const selectedScenario = computed(() =>
  scenarioList.value.find((s) => s.id === selectedScenarioId.value),
);
const selectionLimit = computed(
  () => selectedScenario.value?.maxQuestionnaireCount,
);

const scenarioSlots = ref<PsychologyScenarioApi.AssessmentScenarioSlot[]>([]);
const stepsItems = computed(() =>
  scenarioSlots.value.map((slot) => ({ title: slot.slotName })),
);
const currentStep = computed(() =>
  Math.min(selectedList.value.length, stepsItems.value.length),
);
const hasLeftSlot = ref(false);

function toggleAssessment(item: QuestionnaireVO) {
  const isSelected = selectedList.value.some((i) => i.id === item.id);
  if (
    !isSelected &&
    selectionLimit.value &&
    selectedList.value.length >= selectionLimit.value
  ) {
    message.warning(
      `已达该场景限制，最多可选择 ${selectionLimit.value} 个量表`,
    );
    return;
  }
  const idx = selectedList.value.findIndex((i) => i.id === item.id);
  selectedList.value =
    idx === -1
      ? [...selectedList.value, item]
      : [
          ...selectedList.value.slice(0, idx),
          ...selectedList.value.slice(idx + 1),
        ];
}

// 当选择了场景后，如果已选数量超过限制，自动截断
watch(selectionLimit, (limit) => {
  if (!limit || limit <= 0) return;
  if (selectedList.value.length > limit) {
    selectedList.value = selectedList.value.slice(0, limit);
    message.info(`已按场景限制保留前 ${limit} 个量表`);
  }
});

function handleViewDetail(id: number) {
  assessmentDetail.value = assessmentList.value.find(
    (assessment) => assessment.id === id,
  )!;
  isModalOpen.value = true;
}

async function getAssessmentList() {
  try {
    const res = await getQuestionnaireListSimple();
    assessmentList.value = res;
  } catch (error) {
    console.error(error);
  } finally {
    stop();
  }
}

async function getScenarios() {
  try {
    const list = await getAssessmentScenarioList();
    scenarioList.value = list
      .filter((i) => typeof i.id === 'number')
      .map((i) => ({
        id: i.id as number,
        name: i.name,
        maxQuestionnaireCount: i.maxQuestionnaireCount,
      }));
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  start();
  await Promise.all([getAssessmentList(), getScenarios()]);
  await nextTick();
  hasLeftSlot.value = !!document.querySelector('#common-dialog-left-slot');

  // 如果有选中的场景ID，加载对应的插槽信息
  if (selectedScenarioId.value !== undefined) {
    try {
      const slots = await getAssessmentScenarioSlots(selectedScenarioId.value);
      scenarioSlots.value = slots;
    } catch (error) {
      console.error(error);
      scenarioSlots.value = [];
    }
  }
});

watch(selectedScenarioId, async (id) => {
  if (id === undefined) {
    scenarioSlots.value = [];
    return;
  }
  try {
    const slots = await getAssessmentScenarioSlots(id);
    scenarioSlots.value = slots;
  } catch (error) {
    console.error(error);
    scenarioSlots.value = [];
  }
});
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <div
      class="mb-2 flex w-full justify-center"
      v-if="selectedScenarioId !== undefined && stepsItems.length > 0"
    >
      <div class="flex w-[60%] justify-center">
        <Steps size="small" :current="currentStep" :items="stepsItems" />
      </div>
    </div>
    <div
      class="mb-2 flex items-center justify-between text-[12px] text-[#6b7280]"
    >
      <div>
        已选择：{{ selectedIds.length }}
        <span v-if="selectionLimit"> / {{ selectionLimit }}</span> 个量表
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[#999]">选择场景：</span>
        <Select
          v-model:value="selectedScenarioId"
          style="width: 140px"
          placeholder="选择场景"
          :options="scenarioList.map((s) => ({ label: s.name, value: s.id }))"
          allow-clear
          size="small"
        />
      </div>
    </div>

    <div class="h-[381px] overflow-y-auto p-1">
      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div
          v-for="assessment in assessmentList"
          :key="assessment.id"
          class="cursor-pointer rounded-2xl border-2 p-6 transition"
          :class="
            selectedIds.includes(assessment.id)
              ? 'border-[#04DC70] bg-[#14E77E0F]'
              : 'border-transparent bg-[#F7F8FA]'
          "
          @click="toggleAssessment(assessment)"
        >
          <div class="line-clamp-1 text-[20px] font-semibold">
            {{ assessment.title }}
          </div>
          <div class="mt-2 flex gap-2">
            <span class="tag border-[#00EC76] bg-[#F2FFF6] text-[#01BE5F]">
              {{ assessment.estimatedDuration }}分钟
            </span>
            <span class="tag border-[#0060FF] bg-[#0060FF0D] text-[#0060FF]">
              {{ assessment.questionCount }}题
            </span>
          </div>
          <div
            class="mt-3 line-clamp-2 h-[50px] text-[14px] leading-6 text-[#979899]"
          >
            {{ assessment.description }}
          </div>
          <div
            class="mt-2 w-fit text-[14px] text-[#0060FF] underline"
            @click.stop="handleViewDetail(assessment.id as number)"
          >
            查看详情
          </div>
        </div>
      </div>
    </div>

    <!-- 量表详情弹窗 -->
    <AModal
      v-model:open="isModalOpen"
      :title="assessmentDetail?.title"
      wrap-class-name="assessment-detail-modal"
      @cancel="isModalOpen = false"
    >
      <template #title>
        <div class="p-4 text-[20px] font-semibold text-black">
          {{ assessmentDetail?.title }}
        </div>
      </template>

      <div class="flex flex-col gap-1 p-4 pb-0">
        <div class="detail-col">
          <span class="detail-col-title">量表介绍</span>
          {{ assessmentDetail?.description }}
        </div>
        <div class="detail-col">
          <span class="detail-col-title">评估维度</span>
          {{ assessmentDetail?.assessmentDimensionLabels?.join('、') }}
        </div>
        <div class="detail-col">
          <span class="detail-col-title">题目数量</span>
          {{ assessmentDetail?.questionCount }}
        </div>
        <div class="detail-col">
          <span class="detail-col-title">预计用时</span>
          {{ assessmentDetail?.estimatedDuration }}
        </div>
      </div>
      <template #footer>
        <LyButton type="default" size="middle" @click="isModalOpen = false">
          关闭
        </LyButton>
      </template>
    </AModal>
  </div>
</template>

<style scoped lang="scss">
.tag {
  @apply rounded border px-[5px] py-[3px] text-[10px] leading-[10px];
}

.detail-col {
  @apply text-[14px] text-[#4B4B4D];

  .detail-col-title {
    @apply font-medium text-black;

    &::after {
      margin-right: 4px;
      margin-left: 2px;
      content: ':';
    }
  }
}
</style>

<style lang="scss">
.assessment-detail-modal {
  .ant-modal-content {
    padding: 0 !important;
    border-radius: 16px !important;

    .ant-modal-header,
    .ant-modal-footer {
      padding: 16px !important;
    }

    .ant-modal-header {
      margin-bottom: 0 !important;
      border-bottom: 1px solid #e8e9eb !important;
    }
  }
}
</style>
