<script lang="ts" setup>
import type { QuestionnaireVO } from '@vben/types';

import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { h, provide, ref } from 'vue';

import { alert, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Result as AResult, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { createAssessmentTask } from '#/api/psychology/assessment';
import AssessmentSelect from '#/components/Dialog/CreateAssessmentDialog/components/AssessmentSelect.vue';
import BasicInfoForm from '#/components/Dialog/CreateAssessmentDialog/components/BasicInfoForm.vue';
import LyLabel from '#/components/LyLabel/index.vue';

interface Params {
  id: number;
  className: string;
  studentName: string;
  studentNo: string;
  studentUserId: number;
}

const emit = defineEmits(['reloadCrisisEvent']);

const [CreateSimpleAssessmentModal, createSimpleAssessmentModalApi] =
  useVbenModal({
    fullscreenButton: false,
    destroyOnClose: true,
    class: '!w-[1000px]',
    onOpenChange: () => {
      const data = createSimpleAssessmentModalApi.getData();
      if (data) {
        params.value = data as Params;
      }
    },
    onConfirm: async () => {
      const valid = await basicInfoFormRef.value?.validate();
      if (!valid) return;
      if (selectedAssessments.value.length === 0) {
        message.error('请选择测评量表');
        return;
      }

      try {
        createSimpleAssessmentModalApi.lock();
        const data = {
          eventId: params.value?.id,
          taskName: basicInfoFormData.value.name,
          startline:
            basicInfoFormData.value.timeRange?.[0]?.valueOf?.() ?? undefined,
          deadline:
            basicInfoFormData.value.timeRange?.[1]?.valueOf?.() ?? undefined,
          questionnaireIds: selectedAssessments.value.map((i) => i.id ?? 0),
          targetAudience: 0,
          deptIdList: [],
          userIdList: params.value?.studentUserId
            ? [params.value.studentUserId]
            : [],
          scenarioId: selectedScenarioId.value,
          isPublish: true,
        };

        const response = await createAssessmentTask(data);

        if (!response) {
          message.error('发布测评任务失败');
          return;
        }

        alert({
          buttonAlign: 'center',
          title: '',
          content: h(AResult, {
            status: 'success',
            subTitle: `测评任务ID：${response}，请通知学生完成测评`,
            title: '发布测评任务成功',
          }),
        }).then(() => {
          emit('reloadCrisisEvent');
          createSimpleAssessmentModalApi.close();
        });
      } catch (error) {
        console.error('创建测评任务失败', error);
        message.error('创建测评任务失败');
      } finally {
        createSimpleAssessmentModalApi.unlock();
      }
    },
  });

const params = ref<Params>();
const basicInfoFormRef = ref<InstanceType<typeof BasicInfoForm> | null>(null);

// 测评任务基本信息
const basicInfoFormData = ref<PsychologyAssessmentApi.BasicInfo>({
  name: '',
  timeRange: [dayjs().startOf('day'), dayjs().startOf('day').add(7, 'day')],
  description: '',
});

const selectedAssessments = ref<QuestionnaireVO[]>([]); // 量表选择
const selectedScenarioId = ref<number | undefined>(undefined); // 场景选择
const loading = ref(false);

/** 开始加载量表 */
function startContentLoading() {
  loading.value = true;
}

/** 停止加载量表 */
function stopContentLoading() {
  loading.value = false;
}

/** 设置加载状态 */
function setContentLoading(v: boolean) {
  loading.value = v;
}

// 提供注入，供 AssessmentSelect 等子组件使用
provide('CommonDialogContentLoading', {
  start: startContentLoading,
  stop: stopContentLoading,
  set: setContentLoading,
});
</script>

<template>
  <CreateSimpleAssessmentModal title="创建量表评估任务">
    <div class="flex flex-col gap-6 px-6 py-4">
      <!-- 测评对象 -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div class="mb-3 flex items-center gap-2">
          <IconifyIcon icon="ph:student" class="size-4" />
          <span class="text-sm font-medium text-gray-900">测评对象</span>
        </div>
        <div class="flex items-center gap-8 text-sm font-medium text-gray-700">
          <div>
            学生：<span>{{ params?.studentName }}</span>
          </div>
          <div>
            班级：<span>{{ params?.className }}</span>
          </div>
          <div>
            学号：<span>{{ params?.studentNo }}</span>
          </div>
        </div>
      </div>

      <!-- 测评任务信息 -->
      <div class="space-y-4">
        <LyLabel
          title="基本信息设置"
          has-indicator
          custom-title-class="text-sm font-medium text-gray-900"
        />
        <div class="rounded-lg border border-gray-200 p-4">
          <BasicInfoForm
            ref="basicInfoFormRef"
            v-model="basicInfoFormData"
            position="left"
          />
        </div>
      </div>

      <!-- 量表选择 -->
      <div class="space-y-4">
        <LyLabel
          title="选择测评量表"
          has-indicator
          custom-title-class="text-sm font-medium text-gray-900"
        />
        <div class="rounded-lg border border-gray-200 p-4">
          <AssessmentSelect
            v-model:assessments="selectedAssessments"
            v-model:scenario-id="selectedScenarioId"
          />
        </div>
      </div>
    </div>
  </CreateSimpleAssessmentModal>
</template>
