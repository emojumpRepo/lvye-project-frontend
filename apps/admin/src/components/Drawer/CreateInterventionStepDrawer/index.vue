<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Form as AForm,
  Input as AInput,
  Select as ASelect,
  Tabs as ATabs,
  message,
} from 'ant-design-vue';

import {
  addInterventionPlanStep,
  updateInterventionPlanStep,
} from '#/api/psychology';
import StudentProfile from '#/components/Drawer/StudentDetailDrawer/main.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { FileUpload } from '#/components/upload';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const activeKey = ref('1');
const studentProfileId = ref<number>(0);
const interventionId = ref<number>();
const isEditMode = ref(false); // 是否为编辑模式
const stepForm = ref({
  id: undefined,
  title: '',
  status: undefined,
  notes: '',
  fileList: [],
});

// 保存原始数据用于对比
const originalStepForm = ref({
  id: undefined,
  title: '',
  status: undefined,
  notes: '',
  fileList: [],
});

const stepFormRef = ref();
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
    class: 'w-[800px]',
    onOpenChange: async (open) => {
      if (open) {
        const data = await createInterventionStepDrawerApi.getData();
        studentProfileId.value = data.studentProfileId;
        interventionId.value = data.interventionId;
        isEditMode.value = !!data.step?.id; // 有id就是编辑模式

        const formData = {
          id: data.step?.id || undefined,
          title: data.step?.title || '',
          status: data.step?.status || 1,
          notes: data.step?.notes || '',
          fileList: data.step?.attachmentIds || [],
        };
        stepForm.value = { ...formData };
        // 深拷贝原始数据用于对比
        originalStepForm.value = structuredClone(formData);
      }
    },
  });

/** 对比两个数组是否相等 */
function isArrayEqual(arr1: any[], arr2: any[]) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((item, index) => item === arr2[index]);
}

/** 获取变化的字段 */
function getChangedFields() {
  const changedFields: any = { id: stepForm.value.id };

  // 对比普通字段
  if (stepForm.value.title !== originalStepForm.value.title) {
    changedFields.title = stepForm.value.title;
  }
  if (stepForm.value.status !== originalStepForm.value.status) {
    changedFields.status = stepForm.value.status;
  }
  if (stepForm.value.notes !== originalStepForm.value.notes) {
    changedFields.notes = stepForm.value.notes;
  }

  // 对比文件列表
  if (!isArrayEqual(stepForm.value.fileList, originalStepForm.value.fileList)) {
    changedFields.fileList = stepForm.value.fileList;
  }

  return changedFields;
}

/** 新增干预计划步骤 */
async function handleCreate() {
  if (!interventionId.value) {
    message.error('缺少干预计划ID');
    return;
  }

  try {
    createInterventionStepDrawerApi.lock();
    const res = await addInterventionPlanStep({
      interventionId: interventionId.value,
      title: stepForm.value.title,
      notes: stepForm.value.notes || undefined,
      status: stepForm.value.status || undefined,
      attachmentIds:
        stepForm.value.fileList.length > 0
          ? stepForm.value.fileList.map((file: any) => file.id)
          : undefined,
    });
    if (!res) {
      message.error('添加失败');
      return;
    }
    message.success('添加成功');
    emit('refresh');
    createInterventionStepDrawerApi.close();
  } catch (error) {
    console.error('添加失败', error);
    message.error('添加失败');
  } finally {
    createInterventionStepDrawerApi.unlock();
  }
}

/** 更新干预计划步骤详情 */
async function handleUpdate() {
  try {
    const changedFields = getChangedFields();

    // 如果除了id外没有其他变化，直接返回
    if (Object.keys(changedFields).length === 1) {
      message.info('没有变化');
      return;
    }
    createInterventionStepDrawerApi.lock();
    const res = await updateInterventionPlanStep(changedFields);
    if (!res) {
      message.error('更新失败');
      return;
    }
    message.success('更新成功');
    emit('refresh');
    createInterventionStepDrawerApi.close();
  } catch (error) {
    console.error('更新失败', error);
    message.error('更新失败');
  } finally {
    createInterventionStepDrawerApi.unlock();
  }
}

/** 提交表单 */
async function handleSubmit() {
  stepFormRef.value.validate().then(async () => {
    return isEditMode.value ? await handleUpdate() : await handleCreate();
  });
}
</script>

<template>
  <CreateInterventionStepDrawer>
    <div class="h-full px-2">
      <ATabs v-model:active-key="activeKey">
        <ATabs.TabPane key="1" :tab="isEditMode ? '步骤详情' : '新增步骤'">
          <div class="flex h-full flex-col justify-between">
            <div class="scroll-area flex-1 overflow-y-auto pr-1">
              <AForm ref="stepFormRef" :model="stepForm" :rules="stepFormRules">
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
                  <FileUpload v-model:value="stepForm.fileList" />
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
            />
          </div>
        </ATabs.TabPane>

        <template #rightExtra>
          <div
            class="cursor-pointer"
            @click="createInterventionStepDrawerApi.close()"
          >
            <IconifyIcon icon="lucide:x" class="size-4 hover:!text-gray-500" />
          </div>
        </template>
      </ATabs>
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
