<script lang="ts" setup>
import type {
  AssessmentTarget,
  AssessmentType,
  BasicInfo,
} from '#/api/assessment/task';

import { computed, nextTick, ref, watch } from 'vue';

import { Modal as AModal } from 'ant-design-vue';
import dayjs from 'dayjs';

import LyButton from '#/components/LyButton/index.vue';

import AssessmentSelect from './components/AssessmentSelect.vue';
import BasicInfoForm from './components/BasicInfoForm.vue';
import PublishConfirm from './components/PublishConfirm.vue';
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
  targetIds: [],
});
const canNext = ref(false);

const isPublishOpen = ref(false);
const publishSucceeded = ref(false);

// 发布成功页面信息
const successTaskId = ref(`TSK_${dayjs().format('YYYY_MMDD_HH')}`);
const successLink = computed(
  () => `https://system.com/assessment/${successTaskId.value}`,
);
const selectedStudentCount = computed(
  () => targetSelectData.value.targetIds.length,
);
const expectedFinishDate = computed(() =>
  basicInfoFormData.value.timeRange?.[1]
    ? dayjs(basicInfoFormData.value.timeRange[1]).format('YYYY-MM-DD')
    : '',
);
const notifySendText = computed(
  () => `${selectedStudentCount.value}/${selectedStudentCount.value}(100%成功)`,
);

async function handleNext() {
  if (props.step === 4) {
    isPublishOpen.value = true;
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
        canNext.value = targetSelectData.value.targetIds.length > 0;
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
  <div class="mx-auto w-full max-w-[1049px] rounded-xl bg-white p-8">
    <template v-if="!publishSucceeded">
      <div class="mb-6 text-center text-[20px] font-bold">
        {{ contentTitle[props.step] }}
      </div>

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
        @update:model-value="
          (v: AssessmentTarget) => (canNext = v.targetIds.length > 0)
        "
      />

      <!-- Step 4: 确认发布 -->
      <PublishConfirm
        v-else
        :basic="basicInfoFormData"
        :assessment="selectedAssessment"
        :target="targetSelectData"
      />
    </template>

    <!-- 发布成功页面 -->
    <template v-else>
      <div class="mb-6 flex flex-col items-center gap-4">
        <img
          src="../../../static/images/assessment/publish_success.svg"
          alt="发布成功"
          class="size-21"
        />
        <div class="text-[20px] font-bold text-black">测评任务发布成功</div>
      </div>

      <div class="mx-auto w-full max-w-[600px] rounded-xl bg-[#F7F8FB] p-6">
        <div class="flex flex-col space-y-3 text-[16px] text-[#959599]">
          <div>
            <span class="publish-success-detail-title">任务ID：</span>
            <span>{{ successTaskId }}</span>
          </div>
          <div>
            <span class="publish-success-detail-title">测评链接：</span>
            <span class="truncate">{{ successLink }}</span>
          </div>
          <div>
            <span class="publish-success-detail-title">通知发送：</span>
            <span>{{ notifySendText }}</span>
          </div>
          <div>
            <span class="publish-success-detail-title">预计完成时间：</span>
            <span>{{ expectedFinishDate }}</span>
          </div>
        </div>
      </div>
    </template>

    <div class="mt-8 flex justify-center gap-4">
      <template v-if="!publishSucceeded">
        <LyButton
          v-if="props.step > 1"
          type="default"
          size="middle"
          class="h-12 w-[120px] justify-center"
          @click="handlePrev"
        >
          上一步
        </LyButton>
        <LyButton
          :loading="loading"
          type="success"
          size="middle"
          class="h-12 justify-center"
          :class="{
            'w-[150px]': props.step === 1,
            'w-[120px]': props.step > 1,
          }"
          :disabled="!canNext"
          @click="handleNext"
        >
          {{ props.step === 4 ? '确认发布' : '下一步' }}
        </LyButton>
      </template>
      <template v-else>
        <LyButton
          type="default"
          size="middle"
          class="h-12 w-[120px] justify-center"
        >
          返回任务列表
        </LyButton>
        <LyButton
          type="success"
          size="middle"
          class="h-12 w-[120px] justify-center"
        >
          查看任务进度
        </LyButton>
      </template>
    </div>
  </div>

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
        targetSelectData.targetIds.length
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
<style lang="scss" scoped>
.publish-success-detail-title {
  @apply mr-2 font-semibold text-black;
}
</style>
