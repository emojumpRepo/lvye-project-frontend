<script lang="ts" setup>
import type { AssessmentComfirmInfo, CrisisEvent } from '@vben/types';

import type { InterventionAssessmentReqVO } from '#/api/psychology';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  closeEvent,
  getCrisisEventDetail,
  submitStageAssessment,
} from '#/api/psychology';
import AssessmentReportDialog from '#/components/Dialog/AssessmentReportDialog/index.vue';
import { CommonDialogSteps } from '#/components/Dialog/CommonDialog';
import CreateEvaluationDialog from '#/components/Dialog/CreateEvaluationDialog/index.vue';
import EditEventRecordDialog from '#/components/Dialog/EditEventRecordDialog/index.vue';
import PsychologicalConsultDialog from '#/components/Dialog/PsychologicalConsultDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyTag from '#/components/LyTag/index.vue';

import EventReporting from './components/EventReporting.vue';
import StepEventCard from './components/StepEventCard.vue';

const emit = defineEmits(['refresh']);

const crisisEventDetail = ref<CrisisEvent | null>(null);
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
  contentClass: '!bg-[#F7F8FB] box-border py-6 flex-center',
  class: 'h-full overflow-hidden',
  destroyOnClose: true,
  onOpenChange: async (open) => {
    if (open) {
      try {
        const data = handleCrisisEventModalApi.getData();
        if (!data.id) return message.error('缺少事件ID');
        crisisEventTitle.value = data.title;
        await loadCrisisEventDetail(data.id);
      } catch (error) {
        console.error('加载危机事件详情失败', error);
        message.error('加载危机事件详情失败');
      } finally {
        handleCrisisEventModalApi.setState({ loading: false });
      }
    }
  },
});

// 负责人快速分配弹窗
const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  connectedComponent: EditEventRecordDialog,
});

// 评估报告
const [AssessmentReportModal, assessmentReportModalApi] = useVbenModal({
  connectedComponent: AssessmentReportDialog,
});

// 开始评估
const [CreateEvaluationModal, createEvaluationModalApi] = useVbenModal({
  connectedComponent: CreateEvaluationDialog,
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
      label: '最终评估',
      description: status >= 4 ? '已评估' : '待评估',
      done: status >= 4,
      key: 3,
    },
    {
      label: '流程完成',
      description: status >= 5 ? '已完成' : '未完成',
      done: status >= 5,
      key: 4,
    },
  ];

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
    crisisEventDetail.value.processHistory =
      response.processHistory.reverse() ?? [];
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

/** 快速分配 */
function handleQuickAssign(data: {
  content?: string;
  id?: number;
  recordId?: number;
  type: string;
}) {
  editEventRecordApi.setData(data).open();
}

/** 开始评估 */
function startAssessment() {
  createEvaluationModalApi
    .setData({
      confirmInfo: confirmInfo.value,
    })
    .open();
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
}

/** 创建危机干预评估 */
async function createInterventionAssessment(
  params: InterventionAssessmentReqVO,
): Promise<boolean> {
  return await closeInterventionAssessment(params);
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
    console.log('最终评估数据', {
      id: crisisEventDetail.value?.id,
      ...params,
      summary: params.consultRecord,
    });

    const response = await closeEvent({
      id: crisisEventDetail.value?.id,
      ...params,
      summary: params.consultRecord,
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

/** 查看记录评估报告 */
function viewRecordAssessmentReport(recordId: number) {
  const record = crisisEventDetail.value?.allAssessmentRecords.find(
    (record) => record.id === recordId,
  );
  if (!record) return message.error('暂无报告');

  assessmentReportModalApi
    .setData({
      assessmentReport: record,
    })
    .open();
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

    <div v-if="crisisEventDetail" class="h-full w-full">
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
                    v-if="currentStep >= 1"
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
                      :id="crisisEventDetail.id"
                      :name="crisisEventDetail.handlerName"
                      :time="crisisEventDetail.updateTime"
                      :status="crisisEventDetail.status"
                      @handle-quick-assign="handleQuickAssign"
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

              <!-- step4: 评估 -->
              <template v-if="key === 3">
                <div class="my-2 flex w-full flex-col gap-3">
                  <template v-if="currentStep >= 4">
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-1">
                        风险等级：
                        <LyTag
                          tag-category-key="risk_level"
                          :dict-value="
                            crisisEventDetail.latestAssessments[
                              crisisEventDetail.latestAssessments.length - 1
                            ]?.riskLevel
                          "
                        />
                      </div>
                      <!-- <div>
                        评估建议：
                        <LyTag
                          tag-category-key="follow_up_suggestion"
                          :dict-value="
                            crisisEventDetail.latestAssessments[
                              crisisEventDetail.latestAssessments.length - 1
                            ]?.followUpSuggestion
                          "
                        />
                      </div> -->
                    </div>
                  </template>
                  <div class="flex w-full flex-col gap-3">
                    <LyButton
                      v-if="currentStep === 2 && crisisEventDetail.status !== 5"
                      type="primary"
                      ghost
                      size="small"
                      @click="startAssessment"
                    >
                      开始评估
                    </LyButton>
                  </div>
                </div>
              </template>
            </template>
          </CommonDialogSteps>
        </div>

        <!-- 事件详情 -->
        <div class="h-full w-2/3">
          <div class="flex h-full w-full flex-col rounded-xl bg-white">
            <div class="box-border flex-1 overflow-hidden px-10 py-8">
              <EventReporting
                v-if="crisisEventDetail"
                :crisis-event-detail="crisisEventDetail"
                @set-loading="setLoading"
                @reload-crisis-event="reloadCrisisEvent"
                @handle-quick-assign="handleQuickAssign"
                @view-record-assessment-report="viewRecordAssessmentReport"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <EditEventRecordModal @reload-crisis-event="reloadCrisisEvent" />
    <PsychologicalConsultDialog
      v-model:open="isOpenPsychologicalConsultDialog"
      :comfirm-info="confirmInfo"
      :publish="createInterventionAssessment"
    />
    <AssessmentReportModal />
    <CreateEvaluationModal :publish="createInterventionAssessment" />
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
