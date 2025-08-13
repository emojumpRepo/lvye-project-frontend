<script lang="ts" setup>
import type { AssessmentType } from '#/api/assessment/task';

import { computed, ref } from 'vue';

import { Modal as AModal } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

// 双向绑定：选中的量表对象（支持 v-model:assessment）
const selected = defineModel<AssessmentType | null>('assessment', {
  default: null,
});
const selectedId = computed(() => selected.value?.id ?? null);

const isModalOpen = ref(false);
const assessmentDetail = ref<AssessmentType | null>(null);

const assessmentList = ref<AssessmentType[]>([
  {
    id: 1,
    name: '初测动态测评问卷',
    time: '15-30分钟',
    questionCount: 45,
    dimension: ['情绪', '人际', '学习'],
    description: '适用于新生入学、转班学生的首次心理健康筛查',
  },
  {
    id: 2,
    name: '复测动态测评问卷',
    time: '10-15分钟',
    questionCount: 30,
    dimension: ['情绪', '人际', '学习'],
    description: '适用于已有档案学生的定期复查和跟踪评估',
  },
  {
    id: 3,
    name: '主题动态测评问卷',
    time: '5-10分钟',
    questionCount: [15, 25],
    dimension: ['情绪', '人际', '学习'],
    description: '适用于特定问题的专项测评，如考试焦虑、人际关系等',
  },
]);

function selectAssessment(item: AssessmentType) {
  selected.value = item;
}

function handleViewDetail(id: number) {
  assessmentDetail.value = assessmentList.value.find(
    (assessment) => assessment.id === id,
  )!;
  isModalOpen.value = true;
}
</script>

<template>
  <div class="max-h-[360px] overflow-y-auto p-1">
    <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div
        v-for="assessment in assessmentList"
        :key="assessment.id"
        class="cursor-pointer rounded-2xl border-2 p-6 transition"
        :class="
          selectedId === assessment.id
            ? 'border-[#04DC70] bg-[#14E77E0F]'
            : 'border-transparent bg-[#F7F8FA]'
        "
        @click="selectAssessment(assessment)"
      >
        <div class="text-[20px] font-semibold">{{ assessment.name }}</div>
        <div class="mt-2 flex gap-2">
          <span class="tag border-[#00EC76] bg-[#F2FFF6] text-[#01BE5F]">
            {{ assessment.time }}
          </span>
          <span class="tag border-[#0060FF] bg-[#0060FF0D] text-[#0060FF]">
            {{
              typeof assessment.questionCount === 'number'
                ? `${assessment.questionCount}题`
                : `${assessment.questionCount[0]}-${assessment.questionCount[1]}题`
            }}
          </span>
        </div>
        <div class="mt-3 line-clamp-5 text-[14px] leading-6 text-[#979899]">
          {{ assessment.description }}
        </div>
        <div
          class="mt-2 w-fit text-[14px] text-[#0060FF] underline"
          @click.stop="handleViewDetail(assessment.id)"
        >
          查看详情
        </div>
      </div>
    </div>
  </div>

  <!-- 量表详情弹窗 -->
  <AModal
    v-model:open="isModalOpen"
    :title="assessmentDetail?.name"
    wrap-class-name="assessment-detail-modal"
    @cancel="isModalOpen = false"
  >
    <template #title>
      <div class="p-4 text-[20px] font-semibold text-black">
        {{ assessmentDetail?.name }}
      </div>
    </template>

    <div class="flex flex-col gap-1 p-4 pb-0">
      <div class="detail-col">
        <span class="detail-col-title">量表介绍</span>
        {{ assessmentDetail?.description }}
      </div>
      <div class="detail-col">
        <span class="detail-col-title">评估维度</span>
        {{ assessmentDetail?.dimension.join('、') }}
      </div>
      <div class="detail-col">
        <span class="detail-col-title">题目数量</span>
        {{
          typeof assessmentDetail?.questionCount === 'number'
            ? `${assessmentDetail?.questionCount}`
            : `${assessmentDetail?.questionCount[0]}-${assessmentDetail?.questionCount[1]}`
        }}
      </div>
      <div class="detail-col">
        <span class="detail-col-title">预计用时</span>
        {{ assessmentDetail?.time }}
      </div>
    </div>
    <template #footer>
      <LyButton type="default" size="middle" @click="isModalOpen = false">
        关闭
      </LyButton>
    </template>
  </AModal>
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
