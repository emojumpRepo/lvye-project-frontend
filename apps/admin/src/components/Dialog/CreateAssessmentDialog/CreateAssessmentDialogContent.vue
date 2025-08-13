<script lang="ts" setup>
import type {
  AssessmentTarget,
  AssessmentType,
  BasicInfo,
} from '#/api/assessment/task';

import { computed, nextTick, ref, watch } from 'vue';

import { Modal as AModal } from 'ant-design-vue';
import dayjs from 'dayjs';

import { CommonDialogContent } from '#/components/Dialog/CommonDialog';
import LyButton from '#/components/LyButton/index.vue';

import AssessmentSelect from './components/AssessmentSelect.vue';
import BasicInfoForm from './components/BasicInfoForm.vue';
import PublishConfirm from './components/PublishConfirm.vue';
import PublishSuccess from './components/PublishSuccess.vue';
import TargetSelect from './components/TargetSelect.vue';

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    step?: number; // 1-4
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

const contentTitle: Record<number, string> = {
  1: '基本信息设置',
  2: '选择测评量表',
  3: '选择测评对象',
  4: '确认发布',
};

const basicInfoFormRef = ref<InstanceType<typeof BasicInfoForm> | null>(null);
const assessmentSelectRef = ref<InstanceType<typeof AssessmentSelect> | null>(
  null,
);
const targetSelectRef = ref<InstanceType<typeof TargetSelect> | null>(null);

const basicInfoFormData = ref<BasicInfo>({
  name: '',
  timeRange: [dayjs().startOf('day'), dayjs().startOf('day').add(7, 'day')],
  description: '',
});
const selectedAssessment = ref<AssessmentType | null>(null);
const targetSelectData = ref<AssessmentTarget>({
  type: 'student',
  selected: [],
});
const canNext = ref(false);

const isPublishOpen = ref(false);
const publishSucceeded = ref(false);

// 发布成功页面信息
const successTaskId = ref(`TSK_${dayjs().format('YYYY_MMDD_HH')}`);
const successLink = computed(
  () => `https://system.com/assessment/${successTaskId.value}`,
);
const selectedStudentCount = computed(() =>
  targetSelectData.value.selected.reduce(
    (acc, cur) => acc + (cur.studentIds?.length || 0),
    0,
  ),
);

function onTargetUpdate(v: AssessmentTarget) {
  canNext.value = v.selected.reduce((n, i) => n + i.studentIds.length, 0) > 0;
}
const expectedFinishDate = computed(() =>
  basicInfoFormData.value.timeRange?.[1]
    ? dayjs(basicInfoFormData.value.timeRange[1]).format('YYYY-MM-DD')
    : '',
);
const notifySendText = computed(
  () => `${selectedStudentCount.value}/${selectedStudentCount.value}(100%成功)`,
);

async function handleNext() {
  if (publishSucceeded.value) {
    // TODO: navigate to task progress page
  } else if (props.step === 4 && !publishSucceeded.value) {
    isPublishOpen.value = true;
  } else {
    emit('next');
  }
}

function handlePrev() {
  if (publishSucceeded.value) {
    // TODO: back to task list
  } else {
    emit('prev');
  }
}

// 根据当前步骤重置/设置下一步可用性，避免沿用上一步的状态
watch(
  () => props.step,
  async (v, oldV) => {
    switch (v) {
      case 1: {
        // 初次进入第1步不触发校验；仅在“从其他步骤返回到第1步”时才重校验
        if (oldV && oldV !== 1) {
          await nextTick();
          const validator = basicInfoFormRef.value?.validate;
          if (validator) {
            const valid = await validator();
            canNext.value = !!valid;
          }
        } else {
          canNext.value = false;
        }
        break;
      }
      case 2: {
        canNext.value = !!selectedAssessment.value;
        break;
      }
      case 3: {
        canNext.value = selectedStudentCount.value > 0;
        break;
      }
      default: {
        canNext.value = true;
      }
    }
  },
  { immediate: true },
);

// 第二步：选择量表后，立即更新下一步按钮可用状态
watch(
  selectedAssessment,
  (v) => {
    if (props.step === 2) {
      canNext.value = !!v;
    }
  },
  { deep: false },
);

// 发布测评任务（示意：成功后展示发布成功页）
function handlePublish() {
  isPublishOpen.value = false;
  publishSucceeded.value = true;
  emit('publish');
}
</script>

<template>
  <CommonDialogContent
    :title="!publishSucceeded ? contentTitle[props.step] : ''"
    :show-prev="props.step > 1"
    :show-next="true"
    :next-disabled="!canNext"
    :next-text="
      publishSucceeded
        ? '查看任务进度'
        : props.step === 4
          ? '确认发布'
          : '下一步'
    "
    :prev-text="publishSucceeded ? '返回任务列表' : '上一步'"
    :loading="loading"
    @prev="handlePrev"
    @next="handleNext"
  >
    <!-- Step 1: 基本信息 -->
    <BasicInfoForm
      ref="basicInfoFormRef"
      v-if="props.step === 1"
      v-model:model-value="basicInfoFormData"
      @valid="(v: boolean) => (canNext = v)"
    />

    <!-- Step 2: 选择量表 -->
    <AssessmentSelect
      ref="assessmentSelectRef"
      v-else-if="props.step === 2"
      v-model:assessment="selectedAssessment"
    />

    <!-- Step 3: 选择对象 -->
    <TargetSelect
      ref="targetSelectRef"
      v-else-if="props.step === 3"
      v-model:model-value="targetSelectData"
      @update:model-value="onTargetUpdate"
    />

    <!-- Step 4: 确认发布 -->
    <PublishConfirm
      v-else-if="props.step === 4 && !publishSucceeded"
      :basic="basicInfoFormData"
      :assessment="selectedAssessment"
      :target="targetSelectData"
    />

    <!-- 发布成功页面 -->
    <PublishSuccess
      v-else
      :task-id="successTaskId"
      :link="successLink"
      :notify-text="notifySendText"
      :finish-date="expectedFinishDate"
    />
  </CommonDialogContent>

  <!-- 确认发布弹窗 -->
  <AModal
    v-model:open="isPublishOpen"
    title="确认发布测评任务吗？"
    width="560px"
    wrap-class-name="assessment-detail-modal"
    @cancel="isPublishOpen = false"
  >
    <div class="p-4">
      发布后将立即向{{
        selectedStudentCount
      }}名学生发送测评通知，任务发布后不可撤销, 但可以修改截止时间！
    </div>

    <template #footer>
      <LyButton type="default" size="middle" @click="isPublishOpen = false">
        取消
      </LyButton>
      <LyButton type="success" size="middle" @click="handlePublish">
        确认发布
      </LyButton>
    </template>
  </AModal>
</template>
