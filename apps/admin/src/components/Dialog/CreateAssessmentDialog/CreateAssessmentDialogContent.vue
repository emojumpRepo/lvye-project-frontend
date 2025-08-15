<script lang="ts" setup>
import type {
  AssessmentTarget,
  AssessmentType,
  BasicInfo,
} from '#/api/assessment/task';

import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue';

import { Modal as AModal, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { createAssessmentTask } from '#/api/assessment/task';
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
  (e: 'publish', data: any): void;
}>();

// 数据缓存类型定义
type Student = { id: number; name: string; sno: string };
type ClassGroup = {
  count: number;
  id: number;
  loaded?: boolean;
  loading?: boolean;
  name: string;
  students?: Student[];
};

// 全局数据缓存 - 在弹窗打开期间保持
const classCache = ref<Map<number, ClassGroup>>(new Map());
const classesLoaded = ref(false);

// 缓存班级列表
function cacheClassList(classes: ClassGroup[]) {
  classes.forEach((cls) => {
    classCache.value.set(cls.id, { ...cls });
  });
  classesLoaded.value = true;
}

// 缓存班级的学生数据
function cacheStudentsForClass(
  classId: number,
  students: Student[],
  count: number,
) {
  const cachedClass = classCache.value.get(classId);
  if (cachedClass) {
    cachedClass.students = students;
    cachedClass.count = count;
    cachedClass.loaded = true;
  }
}

// 获取缓存的班级列表
function getCachedClassList(): ClassGroup[] {
  return [...classCache.value.values()];
}

// 获取缓存的班级数据
function getCachedClass(classId: number): ClassGroup | undefined {
  return classCache.value.get(classId);
}

// 清空缓存（弹窗关闭时调用）
function clearCache() {
  classCache.value.clear();
  classesLoaded.value = false;
}

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
  type: 1,
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
        // 初次进入第1步不触发校验；仅在"从其他步骤返回到第1步"时才重校验
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

// 创建测评任务
async function createTask() {
  try {
    const res = await createAssessmentTask({
      taskName: basicInfoFormData.value.name,
      startline: basicInfoFormData.value.timeRange?.[0].toISOString(),
      deadline: basicInfoFormData.value.timeRange?.[1].toISOString(),
      scaleCode: selectedAssessment.value?.id || '',
      targetAudience: targetSelectData.value.type,
      userIdList: targetSelectData.value.selected.flatMap((i) => i.studentIds),
    });
    message.success('创建测评任务成功');
    publishSucceeded.value = true;
    emit('publish', res);
  } catch (error) {
    console.error('createTask', error);
    message.error('创建测评任务失败');
  } finally {
    isPublishOpen.value = false;
  }
}

// 发布测评任务
async function handlePublish() {
  await createTask();
}

// 暴露缓存方法给子组件
defineExpose({
  cacheClassList,
  cacheStudentsForClass,
  getCachedClassList,
  getCachedClass,
  clearCache,
});

// 通过 provide 传递缓存方法给子组件
provide('parentRef', {
  cacheClassList,
  cacheStudentsForClass,
  getCachedClassList,
  getCachedClass,
});

// 组件卸载时清空缓存
onBeforeUnmount(() => {
  clearCache();
});
</script>

<template>
  <CommonDialogContent
    :title="!publishSucceeded ? contentTitle[props.step] : ''"
    :show-prev="props.step > 1"
    :show-next="true"
    :show-save="props.step === 4"
    save-text="保存为草稿"
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
    @save="handleNext"
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
