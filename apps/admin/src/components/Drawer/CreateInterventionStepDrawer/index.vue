<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { InterventionPlanStep } from '@vben/types';

// 导入 reactive
import { ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import {
  Form as AForm,
  Input as AInput,
  Select as ASelect,
  Spin as ASpin,
  Tabs as ATabs,
  message,
} from 'ant-design-vue';

import { getFileById } from '#/api/infra/file';
import {
  addInterventionPlanStep,
  updateInterventionPlanStep,
} from '#/api/psychology';
import StudentProfile from '#/components/Drawer/StudentDetailDrawer/main.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { FileUpload } from '#/components/upload';

interface FileUploadState {
  id: number;
  url: string;
}

const props = defineProps<{
  interventionId: number;
  status: number;
  step?: InterventionPlanStep;
  studentProfileId: number;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

interface StepFormState {
  id?: number;
  title: string;
  status: number;
  notes: string;
  fileList: FileUploadState[];
}

/** 创建默认表单状态 */
const createDefaultStepForm = (): StepFormState => ({
  id: undefined,
  title: '',
  status: 1,
  notes: '',
  fileList: [],
});

const activeKey = ref('1');
const isEditMode = ref(false);
const loading = ref(true);

const stepForm = ref<StepFormState>(createDefaultStepForm());
const originalStepForm = ref<StepFormState>(createDefaultStepForm()); // 保存原始数据用于对比

const stepFormRef = ref<FormInstance>();
const stepFormRules = ref({
  title: [{ required: true, message: '请填写步骤名称' }],
});

const statusOptions = ref([
  { label: '待处理', value: 1 },
  { label: '处理中', value: 2 },
  { label: '已完成', value: 3 },
]);

const [CreateInterventionStepDrawer, createInterventionStepDrawerApi] =
  useVbenDrawer({
    destroyOnClose: true,
    header: false,
    footer: false,
    modal: false,
    class: 'w-2/5',
  });

watch(
  () => props.step,
  async (newStep) => {
    isEditMode.value = !!newStep?.id;
    if (newStep) {
      await loadDrawerData(newStep);
    } else {
      stepForm.value = createDefaultStepForm();
      originalStepForm.value = createDefaultStepForm();
    }
  },
  {
    immediate: true,
  },
);

/** 加载抽屉数据 */
async function loadDrawerData(step: InterventionPlanStep) {
  try {
    loading.value = true;
    let fileList: FileUploadState[] = [];
    if (step.attachmentIds && step.attachmentIds.length > 0) {
      fileList = (await Promise.all(
        step.attachmentIds.map((id: number) => getFileById(id)),
      )) as FileUploadState[];
    }

    const formData: StepFormState = {
      id: step.id,
      title: step.title || '',
      status: step.status || 1,
      notes: step.notes || '',
      fileList,
    };

    stepForm.value = formData;
    originalStepForm.value = cloneDeep(stepForm.value);
  } catch (error) {
    console.error('加载抽屉数据失败', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 对比两个文件列表是否相等（基于 ID）
 */
function areFileListsEqual(arr1: FileUploadState[], arr2: FileUploadState[]) {
  if (arr1.length !== arr2.length) return false;
  if (arr1.length === 0) return true; // 两个都是空数组

  const ids1 = arr1.map((file) => file.id).sort();
  const ids2 = arr2.map((file) => file.id).sort();

  return ids1.every((id, index) => id === ids2[index]);
}

/** 获取变化的字段 */
function getChangedFields() {
  const changedFields: Partial<StepFormState & { attachmentIds?: number[] }> = {
    id: stepForm.value.id!,
  };
  const current = stepForm.value;
  const original = originalStepForm.value;

  // 对比普通字段
  if (current.title !== original.title) {
    changedFields.title = current.title;
  }
  if (current.status !== original.status) {
    changedFields.status = current.status;
  }
  if (current.notes !== original.notes) {
    changedFields.notes = current.notes;
  }

  if (!areFileListsEqual(current.fileList, original.fileList)) {
    changedFields.attachmentIds = current.fileList.map(
      (file) => Number(file.id)!,
    );
  }

  return changedFields;
}

/** 新增干预计划步骤 */
async function handleCreate() {
  if (!props.interventionId) {
    message.error('缺少干预计划ID');
    return;
  }

  try {
    loading.value = true;
    const payload = {
      interventionId: props.interventionId,
      title: stepForm.value.title,
      notes: stepForm.value.notes || undefined,
      status: stepForm.value.status || undefined,
      attachmentIds:
        stepForm.value.fileList.length > 0
          ? stepForm.value.fileList
              .map((file) => file.id)
              .filter((id): id is number => id !== undefined)
          : [],
    };

    const res = await addInterventionPlanStep(payload);
    if (!res) {
      message.error('添加失败');
      return;
    }

    stepForm.value = createDefaultStepForm();
    originalStepForm.value = createDefaultStepForm();

    message.success('添加成功');
    emit('refresh');
  } catch (error) {
    console.error('添加失败', error);
    message.error('添加失败');
  } finally {
    loading.value = false;
  }
}

/** 更新干预计划步骤详情 */
async function handleUpdate() {
  try {
    loading.value = true;
    const changedFields = getChangedFields();
    if (changedFields.id === undefined) {
      message.error('步骤ID不能为空');
      return;
    }

    if (Object.keys(changedFields).length <= 1) {
      message.info('没有变化');
      return;
    }

    const res = await updateInterventionPlanStep({
      ...changedFields,
      id: changedFields.id,
    });
    if (!res) {
      message.error('更新失败');
      return;
    }

    originalStepForm.value = cloneDeep(stepForm.value);

    message.success('更新成功');
    emit('refresh');
  } catch (error) {
    console.error('更新失败', error);
    message.error('更新失败');
  } finally {
    loading.value = false;
  }
}

/** 提交表单 */
function handleSubmit() {
  if (props.status === 2) return;

  stepFormRef.value
    ?.validate()
    .then(async () => {
      await (isEditMode.value ? handleUpdate() : handleCreate());
    })
    .catch((error) => {
      console.warn('表单验证失败:', error);
      message.warning('请检查表单必填项');
    });
}
</script>

<template>
  <CreateInterventionStepDrawer>
    <div class="h-full px-2">
      <ASpin :spinning="loading">
        <ATabs v-model:active-key="activeKey">
          <ATabs.TabPane key="1" :tab="isEditMode ? '步骤详情' : '新增步骤'">
            <div class="flex h-full flex-col justify-between">
              <div class="scroll-area flex-1 overflow-y-auto pr-1">
                <AForm
                  ref="stepFormRef"
                  :disabled="props.status === 2"
                  :model="stepForm"
                  :rules="stepFormRules"
                >
                  <AForm.Item name="title">
                    <LyLabel
                      title="步骤名称"
                      custom-title-class="text-sm font-bold"
                    />
                    <AInput
                      v-model:value="stepForm.title"
                      placeholder="请填写步骤名称"
                    />
                  </AForm.Item>
                  <AForm.Item name="status">
                    <LyLabel
                      title="状态"
                      custom-title-class="text-sm font-bold"
                    />
                    <ASelect
                      v-model:value="stepForm.status"
                      :options="statusOptions"
                    />
                  </AForm.Item>
                  <AForm.Item name="fileList">
                    <LyLabel
                      title="文件上传（报告/记录）"
                      custom-title-class="text-sm font-bold"
                    />
                    <FileUpload
                      v-model:value="stepForm.fileList"
                      :max-count="5"
                    />
                  </AForm.Item>
                  <AForm.Item name="notes">
                    <LyLabel
                      title="教师笔记/详情方案"
                      custom-title-class="text-sm font-bold"
                    />
                    <AInput.TextArea
                      v-model:value="stepForm.notes"
                      :rows="8"
                      placeholder="请填写教师笔记/详情方案"
                    />
                  </AForm.Item>
                </AForm>
              </div>

              <div
                class="flex justify-end gap-3 pt-4"
                style="border-top: 1px solid #e5e5e5"
              >
                <LyButton
                  type="default"
                  size="small"
                  @click="createInterventionStepDrawerApi.close()"
                >
                  取消
                </LyButton>
                <LyButton type="success" size="small" @click="handleSubmit">
                  确定
                </LyButton>
              </div>
            </div>
          </ATabs.TabPane>

          <ATabs.TabPane key="2" tab="学生360°档案">
            <div class="h-full">
              <StudentProfile
                :student-detail-drawer-api="createInterventionStepDrawerApi"
                :student-profile-id="studentProfileId"
                active-timeline-tab="intervention"
              />
            </div>
          </ATabs.TabPane>

          <template #rightExtra>
            <div
              class="cursor-pointer"
              @click="createInterventionStepDrawerApi.close()"
            >
              <IconifyIcon
                icon="lucide:x"
                class="size-4 hover:!text-gray-500"
              />
            </div>
          </template>
        </ATabs>
      </ASpin>
    </div>
  </CreateInterventionStepDrawer>
</template>

<style lang="scss" scoped>
:deep(.ant-tabs) {
  height: 100%;
}

:deep(.ant-tabs-content) {
  height: 100%;
}

:deep(.ant-spin-nested-loading) {
  height: 100% !important;
}

:deep(.ant-spin-container) {
  height: 100% !important;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 35%);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 999px;
}
</style>
