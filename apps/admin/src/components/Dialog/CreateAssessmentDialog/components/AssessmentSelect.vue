<script lang="ts" setup>
import type { QuestionnaireVO } from '@vben/types';

import { computed, inject, onMounted, ref } from 'vue';

import { Modal as AModal, message } from 'ant-design-vue';

import { getQuestionnaireListSimple } from '#/api/psychology/questionnaire';
import { getAssessmentScenarioList } from '#/api/psychology/scenario';
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
// UI 专用选中 ID：选择了场景时不显示外部问卷选中态
const selectedIdsForUI = computed<number[]>(() =>
  selectedScenarioId.value === undefined
    ? selectedList.value.map((i) => i.id as number)
    : [],
);

// 场景ID双向绑定（支持 v-model:scenario-id）
const selectedScenarioId = defineModel<number | undefined>('scenarioId', {
  default: undefined,
});

const isModalOpen = ref(false);
const assessmentDetail = ref<null | QuestionnaireVO>(null);

const assessmentList = ref<QuestionnaireVO[]>([]);
// 可用场景与限制（通过卡片选择，不再使用下拉组件与步骤条）
type SimpleScenario = {
  id: number;
  maxQuestionnaireCount?: number;
  name: string;
};
const scenarioList = ref<SimpleScenario[]>([]);
const selectedScenario = computed(() =>
  scenarioList.value.find((s) => s.id === selectedScenarioId.value),
);

type UICard = {
  __isScenario: boolean;
  description?: string;
  estimatedDuration?: number;
  id: number;
  questionCount?: number;
  title: string;
};

const uiCards = computed<UICard[]>(() => {
  const scenarioCards: UICard[] = scenarioList.value.map((s) => ({
    id: s.id,
    title: s.name,
    description: '场景预设：按场景配置量表创建测评任务',
    __isScenario: true,
  }));
  const assessmentCards: UICard[] = assessmentList.value
    .filter((a) => typeof a.id === 'number')
    .map((a) => ({
      id: a.id as number,
      title: String(a.title || (a as any).questionnaireTitle || `问卷#${a.id}`),
      description: a.description,
      __isScenario: false,
      estimatedDuration:
        (a.estimatedDuration as number | undefined) ?? undefined,
      questionCount: (a.questionCount as number | undefined) ?? undefined,
    }));
  return [...scenarioCards, ...assessmentCards];
});

function toggleCard(card: UICard) {
  if (card.__isScenario) {
    const idNum = Number(card.id);
    if (selectedScenarioId.value === idNum) {
      selectedScenarioId.value = undefined;
    } else {
      // 选择场景后，用场景插槽绑定的问卷填充选择列表
      selectedScenarioId.value = idNum;
      const scenario = scenarioList.value.find((s) => s.id === idNum) as any;
      if (scenario && Array.isArray(scenario.slots)) {
        const questionnaires = scenario.slots
          .map((slot: any) => slot?.questionnaire)
          .filter((q: any) => !!q && typeof q.id === 'number');
        selectedList.value = questionnaires as any;
      } else {
        selectedList.value = [];
      }
    }
    return;
  }
  if (selectedScenarioId.value !== undefined) {
    message.warning('已选择场景卡片，不能再选择其他量表');
    return;
  }
  const idx = selectedList.value.findIndex((i) => i.id === card.id);
  const found = assessmentList.value.find((a) => a.id === card.id);
  if (!found) return;
  selectedList.value =
    idx === -1
      ? [...selectedList.value, found]
      : [
          ...selectedList.value.slice(0, idx),
          ...selectedList.value.slice(idx + 1),
        ];
}

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
        slots: i.slots,
      }));
  } catch (error) {
    console.error(error);
  }
}

const activeScenarioPopoverId = ref<null | number>(null);
const scenarioQuestionnaires = ref<QuestionnaireVO[]>([]);
const scenarioLoading = ref(false);

async function handleViewScenarioQuestionnaires(scenarioId: number) {
  try {
    scenarioLoading.value = true;
    activeScenarioPopoverId.value = scenarioId;

    // 从本地scenarioList中获取场景数据
    const scenario = scenarioList.value.find((s) => s.id === scenarioId);

    if (scenario && (scenario as any).slots) {
      const questionnaires = (scenario as any).slots
        .map((slot: any) => slot?.questionnaire)
        .filter((q: any) => !!q && typeof q.id === 'number');
      scenarioQuestionnaires.value = questionnaires;
    } else {
      scenarioQuestionnaires.value = [];
    }
  } catch (error) {
    console.error('查询场景关联问卷失败:', error);
    message.error('查询场景关联问卷失败');
    scenarioQuestionnaires.value = [];
  } finally {
    scenarioLoading.value = false;
  }
}

function closeScenarioPopover() {
  activeScenarioPopoverId.value = null;
  scenarioLoading.value = false;
  // 延迟清空数据，避免关闭时的闪烁
  setTimeout(() => {
    scenarioQuestionnaires.value = [];
  }, 200);
}

onMounted(async () => {
  start();
  await Promise.all([getAssessmentList(), getScenarios()]);
  stop();
});
</script>

<template>
  <div class="flex max-h-[435px] flex-col overflow-hidden">
    <div
      class="mb-2 flex items-center justify-between text-[12px] text-[#6b7280]"
    >
      <span v-if="selectedScenarioId !== undefined" class="text-[#00BE5F]">
        <span>已选场景：{{ selectedScenario?.name }}</span>
        <span class="text-gray-400">
          (关联 {{ selectedScenario?.maxQuestionnaireCount }} 个量表)
        </span>
      </span>
      <span v-else> 已选择：{{ selectedIdsForUI.length }} 个量表 </span>
    </div>

    <div class="flex-1 overflow-y-auto p-1">
      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div
          v-for="card in uiCards"
          :key="
            card.__isScenario ? `scenario-${card.id}` : `assessment-${card.id}`
          "
          class="cursor-pointer rounded-2xl border-2 p-6 transition"
          :class="
            (
              card.__isScenario
                ? selectedScenarioId === Number(card.id)
                : selectedIdsForUI.includes(card.id as number)
            )
              ? 'border-[#04DC70] bg-[#14E77E0F]'
              : 'border-transparent bg-[#F7F8FA]'
          "
          @click="toggleCard(card as any)"
        >
          <div class="line-clamp-1 text-[20px] font-semibold">
            {{ card.title }}
          </div>
          <div class="mt-2 flex gap-2">
            <template v-if="!card.__isScenario">
              <span class="tag border-[#00EC76] bg-[#F2FFF6] text-[#01BE5F]">
                {{ card.estimatedDuration }}分钟
              </span>
              <span class="tag border-[#0060FF] bg-[#0060FF0D] text-[#0060FF]">
                {{ card.questionCount }}题
              </span>
            </template>
            <template v-else>
              <span class="tag border-[#0060FF] bg-[#0060FF0D] text-[#0060FF]">
                场景
              </span>
              <span class="tag border-[#6B7280] bg-[#6B72800D] text-[#6B7280]">
                仅支持单独下发
              </span>
            </template>
          </div>
          <div
            class="mt-3 line-clamp-2 h-[50px] text-[14px] leading-6 text-[#979899]"
          >
            {{ card.description }}
          </div>
          <div
            class="mt-2 w-fit text-[14px] text-[#0060FF] underline"
            v-if="!card.__isScenario"
            @click.stop="handleViewDetail(card.id as number)"
          >
            查看详情
          </div>
          <div v-else>
            <a-popover
              placement="right"
              :open="activeScenarioPopoverId === Number(card.id)"
              @open-change="(open: boolean) => !open && closeScenarioPopover()"
            >
              <template #content>
                <div class="max-w-xs">
                  <div
                    v-if="scenarioLoading"
                    class="flex items-center justify-center py-4"
                  >
                    <a-spin size="small" />
                    <span class="ml-2 text-gray-500">加载中...</span>
                  </div>
                  <div
                    v-else-if="scenarioQuestionnaires.length === 0"
                    class="text-gray-500"
                  >
                    暂无关联问卷
                  </div>
                  <div v-else class="space-y-3">
                    <div
                      v-for="questionnaire in scenarioQuestionnaires"
                      :key="questionnaire.id"
                      class="rounded-lg border border-gray-200 bg-gray-50 p-3 last:mb-0"
                    >
                      <div class="mb-2 flex items-start justify-between">
                        <div class="line-clamp-1 font-medium text-gray-900">
                          {{ questionnaire.title }}
                        </div>
                        <div class="ml-2 flex shrink-0 gap-1">
                          <span
                            class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-600"
                          >
                            {{ questionnaire.questionCount }}题
                          </span>
                          <span
                            class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-600"
                          >
                            {{ questionnaire.estimatedDuration }}分钟
                          </span>
                        </div>
                      </div>
                      <div class="line-clamp-2 text-sm text-gray-600">
                        {{ questionnaire.description || '暂无描述' }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <template #title>
                <span>关联问卷列表</span>
              </template>
              <div
                class="mt-2 w-fit text-[14px] text-[#0060FF] underline"
                @click.stop="
                  handleViewScenarioQuestionnaires(card.id as number)
                "
              >
                查看关联问卷
              </div>
            </a-popover>
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
