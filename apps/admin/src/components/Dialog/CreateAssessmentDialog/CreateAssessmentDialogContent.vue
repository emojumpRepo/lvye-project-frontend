<script lang="ts" setup>
import type { QuestionnaireVO } from '@vben/types';

import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Modal as AModal, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { createAssessmentTask } from '#/api/psychology/assessment';
import { CommonDialogContent } from '#/components/Dialog/CommonDialog';
import LyButton from '#/components/LyButton/index.vue';

import AssessmentSelect from './components/AssessmentSelect.vue';
import BasicInfoForm from './components/BasicInfoForm.vue';
import PublishConfirm from './components/PublishConfirm.vue';
import PublishSuccess from './components/PublishSuccess.vue';
import TargetSelect from './components/TargetSelect.vue';

const props = withDefaults(
  defineProps<{
    step?: number; // 1-4
  }>(),
  {
    step: 1,
  },
);

const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'back'): void;
  (e: 'close'): void;
  (e: 'publish', data: any): void;
}>();

const router = useRouter();

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

const basicInfoFormData = ref<PsychologyAssessmentApi.BasicInfo>({
  name: '',
  timeRange: [dayjs().startOf('day'), dayjs().startOf('day').add(7, 'day')],
  description: '',
});
const selectedAssessments = ref<QuestionnaireVO[]>([]);
const targetSelectData = ref<PsychologyAssessmentApi.AssessmentTarget>({
  type: 1,
  selected: [],
});
const canNext = ref(false);

const isPublishOpen = ref(false);
const publishSucceeded = ref(false);

const isPublish = ref(false); // 是否发布

const isCommiting = ref(false); // 是否正在提交

// 发布成功页面信息
const taskId = ref<null | number>(null);
const selectedStudentCount = computed(() =>
  targetSelectData.value.selected.reduce(
    (acc, cur) => acc + (cur.studentIds?.length || 0),
    0,
  ),
);

function onTargetUpdate(v: PsychologyAssessmentApi.AssessmentTarget) {
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
    router.push({
      name: 'AssessmentDetail',
      params: {
        taskNo: taskId.value?.toString() ?? '',
      },
    });
  } else if (props.step === 4 && !publishSucceeded.value) {
    isPublishOpen.value = true;
  } else {
    emit('next');
  }
}

function handlePrev() {
  if (publishSucceeded.value) {
    emit('close');
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
          // 使用轮询方式等待组件挂载完成
          let retryCount = 0;
          const maxRetries = 10;

          const waitForComponent = async () => {
            await nextTick();

            if (
              basicInfoFormRef.value &&
              typeof basicInfoFormRef.value.validate === 'function'
            ) {
              try {
                const valid = await basicInfoFormRef.value.validate();
                canNext.value = !!valid;
                return true;
              } catch (error) {
                console.error('Validation error:', error);
                canNext.value = false;
                return true;
              }
            } else if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(waitForComponent, 50); // 50ms 延迟
              return false;
            } else {
              console.warn(
                'basicInfoFormRef is not available after maximum retries',
              );
              canNext.value = false;
              return true;
            }
          };

          await waitForComponent();
        } else {
          canNext.value = false;
        }
        break;
      }
      case 2: {
        canNext.value = selectedAssessments.value.length > 0;
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
  selectedAssessments,
  (v) => {
    if (props.step === 2) {
      canNext.value = v.length > 0;
    }
  },
  { deep: true },
);

// 创建测评任务
async function handleCommit(publish: boolean) {
  try {
    isCommiting.value = true;
    isPublish.value = publish;
    const res = await createAssessmentTask({
      taskName: basicInfoFormData.value.name,
      startline: basicInfoFormData.value.timeRange?.[0].toISOString(),
      deadline: basicInfoFormData.value.timeRange?.[1].toISOString(),
      questionnaireIds: selectedAssessments.value.map((i) => i.id ?? 0),
      targetAudience: targetSelectData.value.type,
      userIdList: targetSelectData.value.selected.flatMap((i) => i.studentIds),
      isPublish: publish,
    });

    taskId.value = res;
    emit('publish', res);
    message.success(isPublish.value ? '发布测评任务成功' : '创建测评任务成功');
    publishSucceeded.value = true;
  } catch (error: any) {
    console.error('createTask', error);
    if (error.code === 1_003_002_004) {
      emit('back');
      return;
    }
    message.error(isPublish.value ? '发布测评任务失败' : '创建测评任务失败');
  } finally {
    isPublishOpen.value = false;
    isCommiting.value = false;
  }
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
    :show-save="props.step === 4 && !publishSucceeded"
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
    :loading="isCommiting"
    @prev="handlePrev"
    @next="handleNext"
    @save="handleCommit(false)"
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
      v-model:assessments="selectedAssessments"
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
      :assessments="selectedAssessments"
      :target="targetSelectData"
    />

    <!-- 保存/发布成功页面 -->
    <PublishSuccess
      v-else
      :is-publish="isPublish"
      :task-id="taskId"
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
      <LyButton
        type="default"
        size="middle"
        @click="isPublishOpen = false"
        :loading="isCommiting"
      >
        取消
      </LyButton>
      <LyButton
        type="success"
        size="middle"
        @click="handleCommit(true)"
        :loading="isCommiting"
      >
        确认发布
      </LyButton>
    </template>
  </AModal>
</template>
