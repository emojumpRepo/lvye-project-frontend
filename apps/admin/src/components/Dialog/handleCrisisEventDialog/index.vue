<script lang="ts" setup>
import type {
  AssessmentComfirmInfo,
  CrisisEvent,
  CrisisEventRecord,
} from '@vben/types';

import type { InterventionAssessmentReqVO } from '#/api/psychology';

import { computed, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  closeEvent,
  getCrisisEventDetail,
  getCrisisEventProcessHistory,
  submitStageAssessment,
} from '#/api/psychology';
import { CommonDialogSteps } from '#/components/Dialog/CommonDialog';
import EditEventRecordDialog from '#/components/Dialog/EditEventRecordDialog/index.vue';
import PsychologicalConsultDialog from '#/components/Dialog/PsychologicalConsultDialog/index.vue';
import SelectHandleMethodDrawer from '#/components/Drawer/SelectHandleMethodDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyTag from '#/components/LyTag/index.vue';

import EventReporting from './components/EventReporting.vue';
import StepEventCard from './components/StepEventCard.vue';

const emit = defineEmits(['refresh']);

const crisisEventDetail = ref<CrisisEvent | null>(null);
const crisisEventProcessHistory = ref<CrisisEventRecord[]>([]);
const isOpenPsychologicalConsultDialog = ref(false);
const crisisEventTitle = ref('');
const currentStep = ref(1); // 当前步骤
// 评估确认信息
const confirmInfo = ref<AssessmentComfirmInfo>({
  studentInfo: {
    studentName: '',
    className: '',
    studentNo: '',
  },
  consultInfo: {
    consultant: '',
    consultType: '',
    consultTime: '',
  },
});

// 危机事件处理弹窗
const [HandleCrisisEventModal, handleCrisisEventModalApi] = useVbenModal({
  fullscreenButton: false,
  fullscreen: true,
  closable: false,
  footer: false,
  loading: true,
  contentClass: '!bg-[#F7F8FB] box-border py-10 flex-center',
  class: 'h-full overflow-hidden',
  destroyOnClose: true,
  onOpenChange: async () => {
    const data = handleCrisisEventModalApi.getData();
    if (!data.id) return message.error('缺少事件ID');
    crisisEventTitle.value = data.title;
    await loadCrisisEventDetail(data.id);
    await loadCrisisEventProcessHistory(data.id);
    handleCrisisEventModalApi.setState({ loading: false });
  },
});

// 负责人快速分配弹窗
const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  connectedComponent: EditEventRecordDialog,
  destroyOnClose: true,
});

// 选择处理方式弹窗
const [HandleMethodDrawer, HandleMethodDrawerApi] = useVbenDrawer({
  connectedComponent: SelectHandleMethodDrawer,
});

// 跳过处理方式
const skipedHandler = computed(() => {
  return (
    crisisEventDetail.value?.processStatus === 3 ||
    crisisEventDetail.value?.processStatus === 4
  );
});

// 步骤条
const crisisEventHandlingSteps = computed(() => {
  if (!crisisEventDetail.value) return [];

  const status = crisisEventDetail.value.status;

  const steps = [
    {
      label: '事件上报',
      description: '已上报',
      done: status >= 1,
      key: 1,
    },
    {
      label: '分配负责人',
      description: status >= 2 ? '已分配' : '待分配',
      done: status >= 2,
      key: 2,
    },
    {
      label: '选择处理方式',
      description: status >= 3 ? '已选择' : '待选择',
      done: status >= 3,
      key: 3,
    },
    {
      label: '执行处理',
      description: status >= 4 ? '已处理' : '待处理',
      done: status >= 4,
      key: 4,
    },
    {
      label: '最终评估',
      description: status >= 5 ? '已评估' : '待评估',
      done: status >= 5,
      key: 5,
    },
    {
      label: '流程完成',
      description: status >= 6 ? '已完成' : '未完成',
      done: status >= 6,
      key: 6,
    },
  ];

  // 移除"执行处理"步骤
  if (skipedHandler.value) {
    return steps.filter((step) => step.key !== 4);
  }

  return steps;
});

/**
 * 设置加载状态
 * @param loading 加载状态
 */
const setLoading = (loading: boolean) => {
  handleCrisisEventModalApi.setState({ loading });
};

/**
 * 获取危机事件详情
 * @param id 事件id
 */
async function loadCrisisEventDetail(id: number) {
  try {
    const response = await getCrisisEventDetail(id);
    if (!response) return message.error('获取危机事件详情失败');
    crisisEventDetail.value = response;
    currentStep.value = response.status; // 进入下一个步骤
    confirmInfo.value = {
      studentInfo: {
        studentName: response.studentName,
        className: response.className,
        studentNo: response.studentNumber,
      },
      consultInfo: {
        consultant: response.handlerName,
        consultType: '',
        consultTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    };
  } catch (error) {
    console.error('加载危机事件详情失败', error);
    message.error('加载危机事件详情失败');
  }
}

/**
 * 获取危机事件处理历史记录
 * @param id 事件id
 */
async function loadCrisisEventProcessHistory(id: number) {
  try {
    const response = await getCrisisEventProcessHistory({ id });
    if (response.total === 0) return;
    crisisEventProcessHistory.value = response.list.reverse();
    // 重新加载步骤条
  } catch (error) {
    console.error('加载事件历史记录失败', error);
    message.error('加载事件历史记录失败');
  }
}

/** 快速分配 */
function handleQuickAssign(data: {
  content?: string;
  id?: number;
  recordId?: number;
  type: string;
}) {
  editEventRecordApi.setData(data).open();
}

/** 选择处理方式 */
function handleSelectHandleMethod() {
  HandleMethodDrawerApi.setData({
    id: crisisEventDetail.value?.id,
  }).open();
}

/** 开始处理 */
function startProcess() {
  // TODO: 开始处理
  // console.log('开始处理');
  // psychologicalAssessmentModalOpen.value = true;
}

/** 开始评估 */
function startAssessment() {
  isOpenPsychologicalConsultDialog.value = true;
}

/** 关闭弹窗 */
function handleClose() {
  emit('refresh');
  handleCrisisEventModalApi.close();
}

/**
 * 重新加载危机事件数据
 * @param id 事件id
 */
async function reloadCrisisEvent() {
  const id = crisisEventDetail.value?.id;
  if (!id) return;
  await loadCrisisEventDetail(id);
  await loadCrisisEventProcessHistory(id);
}

/** 创建干预评估 */
async function createInterventionAssessment(
  params: InterventionAssessmentReqVO,
): Promise<boolean> {
  return await (params.followUpSuggestion === 3 ||
  params.followUpSuggestion === 4
    ? closeInterventionAssessment(params)
    : createStageAssessment(params));
}

/** 创建阶段性评估 */
async function createStageAssessment(
  params: InterventionAssessmentReqVO,
): Promise<boolean> {
  try {
    const response = await submitStageAssessment({
      id: crisisEventDetail.value?.id,
      ...params,
    });
    if (!response) {
      message.error('创建评估失败');
      return false;
    }
    await reloadCrisisEvent();
    return true;
  } catch (error) {
    console.error('创建评估失败', error);
    message.error('创建评估失败');
    return false;
  }
}

/** 最终评估完成 */
async function closeInterventionAssessment(
  params: InterventionAssessmentReqVO,
): Promise<boolean> {
  try {
    const response = await closeEvent({
      id: crisisEventDetail.value?.id,
      ...params,
      summary: params.content,
    });
    if (!response) {
      message.error('创建评估失败');
      return false;
    }
    await reloadCrisisEvent();
    return true;
  } catch (error) {
    console.error('创建评估失败', error);
    message.error('创建评估失败');
    return false;
  }
}
</script>

<template>
  <HandleCrisisEventModal>
    <template #title>
      <!-- 顶部返回与标题 -->
      <div
        class="to-[rgba(255, 255, 255, 0.8) flex w-full items-center justify-between bg-gradient-to-r from-[#FFFFFF]"
      >
        <div class="flex items-center gap-4">
          <LyButton
            type="default"
            size="middle"
            class="rounded-[4px] px-[12px]"
            @click="handleClose"
          >
            返回
          </LyButton>
          <div class="flex flex-col">
            <div class="text-lg font-bold">{{ crisisEventTitle }}事件</div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="crisisEventDetail" class="h-full w-[1400px]">
      <div class="flex-center h-full w-full gap-8 overflow-hidden">
        <!-- 步骤条 -->
        <div class="h-full">
          <CommonDialogSteps
            :current-step="currentStep"
            :steps="crisisEventHandlingSteps"
            title-color="#04dc70"
            type="tag"
          >
            <template #event="{ key }">
              <!-- step1: 事件上报 -->
              <template v-if="key === 1">
                <div class="my-2">
                  <StepEventCard
                    v-if="currentStep >= 2"
                    :name="crisisEventDetail.reporterName"
                    :time="crisisEventDetail.reportedAt"
                  />
                </div>
              </template>

              <!-- step2: 分配负责人 -->
              <template v-if="key === 2">
                <div class="my-2 flex flex-col">
                  <div v-if="currentStep >= 2" class="flex w-full gap-1">
                    <StepEventCard
                      :name="crisisEventDetail.handlerName"
                      :time="crisisEventDetail.updateTime"
                    />
                    <IconifyIcon
                      icon="material-symbols-light:refresh-rounded"
                      color="#1966FF"
                      class="size-5 self-end"
                      @click="
                        handleQuickAssign({
                          id: crisisEventDetail.id,
                          type: 'REASSIGN_HANDLER',
                        })
                      "
                    />
                  </div>

                  <LyButton
                    v-if="currentStep === 1"
                    type="primary"
                    ghost
                    size="small"
                    @click="
                      handleQuickAssign({
                        id: crisisEventDetail.id,
                        type: 'ASSIGN_HANDLER',
                      })
                    "
                  >
                    快速分配
                  </LyButton>
                </div>
              </template>

              <!-- step3: 选择处理方式 -->
              <template v-if="key === 3">
                <div class="my-2 flex w-full flex-col">
                  <div
                    v-if="currentStep >= 3"
                    class="flex w-full flex-col gap-2"
                  >
                    <div class="flex-none">
                      <LyTag
                        tag-category-key="intervention_process_method"
                        :dict-value="crisisEventDetail.processMethod"
                        size="middle"
                      />
                    </div>
                    <!-- <IconifyIcon
                      icon="material-symbols-light:refresh-rounded"
                      color="#1966FF"
                      class="size-5 self-end"
                    /> -->
                  </div>
                  <LyButton
                    v-if="currentStep === 2"
                    type="primary"
                    ghost
                    size="small"
                    @click="handleSelectHandleMethod"
                  >
                    开始选择
                  </LyButton>
                </div>
              </template>

              <!-- step4: 执行处理 -->
              <template v-if="key === 4">
                <div v-if="!skipedHandler" class="my-2 flex w-full flex-col">
                  <div
                    v-if="crisisEventDetail.status >= 4"
                    class="flex w-full flex-col gap-3"
                  >
                    <StepEventCard name="心理测评师" :time="1757562878000" />

                    <LyButton type="primary" ghost size="small">
                      处理记录
                    </LyButton>
                  </div>
                  <!-- 执行处理按钮可以在这里添加 -->
                  <LyButton
                    v-if="currentStep === 3"
                    type="primary"
                    ghost
                    size="small"
                    @click="startProcess"
                  >
                    开始处理
                  </LyButton>
                </div>
              </template>

              <!-- step5: 评估 -->
              <template v-if="key === 5">
                <div class="my-2 flex w-full flex-col">
                  <div
                    v-if="crisisEventDetail.status >= 5"
                    class="flex w-full flex-col gap-3"
                  >
                    <StepEventCard
                      :name="crisisEventDetail.handlerName"
                      :time="crisisEventDetail.handleAt"
                    />
                    <LyButton type="primary" ghost size="small">
                      评估记录
                    </LyButton>
                  </div>

                  <!-- 评估按钮可以在这里添加 -->
                  <LyButton
                    v-if="
                      crisisEventDetail.processStatus === 3 ||
                      crisisEventDetail.processStatus === 4 ||
                      crisisEventDetail.status === 4
                    "
                    type="primary"
                    ghost
                    size="small"
                    @click="startAssessment"
                  >
                    开始评估
                  </LyButton>
                </div>
              </template>

              <!-- step6: 流程完成 -->
              <template v-if="key === 6">
                <LyButton
                  class="mt-2"
                  v-if="crisisEventDetail.status === 6"
                  type="primary"
                  ghost
                  size="small"
                  @click="startProcess"
                >
                  查看报告
                </LyButton>
              </template>
            </template>
          </CommonDialogSteps>
        </div>

        <!-- 事件详情 -->
        <div class="h-full flex-1">
          <div class="flex h-full flex-col rounded-xl bg-white">
            <div class="box-border flex-1 overflow-hidden px-10 py-8">
              <EventReporting
                v-if="crisisEventDetail"
                :crisis-event-detail="crisisEventDetail"
                :crisis-event-process-history="crisisEventProcessHistory"
                @set-loading="setLoading"
                @reload-crisis-event="reloadCrisisEvent"
                @handle-quick-assign="handleQuickAssign"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <EditEventRecordModal @reload-crisis-event="reloadCrisisEvent" />
    <HandleMethodDrawer
      @set-loading="setLoading"
      @reload-crisis-event="reloadCrisisEvent"
    />
    <PsychologicalConsultDialog
      v-model:open="isOpenPsychologicalConsultDialog"
      :comfirm-info="confirmInfo"
      :publish="createInterventionAssessment"
    />
  </HandleCrisisEventModal>
</template>

<style lang="scss" scoped>
:deep(.ant-row) {
  height: 100% !important;
}

:deep(.ant-spin) {
  height: 100% !important;
}

:deep(.ant-spin-nested-loading) {
  height: 100% !important;
}

:deep(.ant-spin-container) {
  height: 100% !important;
}

// :deep(.ant-steps-item) {
//   flex: none !important;
// }
</style>
