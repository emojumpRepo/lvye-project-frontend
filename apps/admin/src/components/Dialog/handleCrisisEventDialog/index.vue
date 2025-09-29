<script lang="ts" setup>
import type { CrisisEvent, CrisisEventRecord } from '@vben/types';

import { computed, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import {
  getCrisisEventDetail,
  getCrisisEventProcessHistory,
} from '#/api/psychology/crisis';
import { CommonDialogSteps } from '#/components/Dialog/CommonDialog';
import EditEventRecordDialog from '#/components/Dialog/EditEventRecordDialog/index.vue';
import SelectHandleMethodDrawer from '#/components/Drawer/SelectHandleMethodDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyTag from '#/components/LyTag/index.vue';

import PsychologicalConsultDialog from '../PsychologicalConsultDialog/index.vue';
import EventReporting from './components/EventReporting.vue';
import StepEventCard from './components/StepEventCard.vue';

const crisisEventDetail = ref<CrisisEvent | null>(null);
const crisisEventProcessHistory = ref<CrisisEventRecord[]>([]);
const crisisEventTitle = ref('');
const psychologicalAssessmentModalOpen = ref(false);

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

// // 评估弹窗
// const [PsychologicalAssessmentModal, psychologicalAssessmentModalApi] =
//   useVbenModal({
//     connectedComponent: PsychologicalConsultDialog,
//     destroyOnClose: true,
//   });

const currentStep = ref(1); // 当前步骤

// 步骤条
const crisisEventHandlingSteps = computed(() => {
  const status = crisisEventDetail.value?.status ?? 1;

  return [
    {
      label: '事件上报',
      description: '已上报',
      color: '#04dc70',
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
      done: status >= 5,
      key: 4,
    },
    {
      label: '评估',
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
    currentStep.value = response.status + 1;
    crisisEventDetail.value = response;
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
function handleQuickAssign(type: 'assign' | 'update') {
  editEventRecordApi
    .setData({
      id: crisisEventDetail.value?.id,
      title: type === 'assign' ? '分配负责人' : '更改负责人',
      type,
    })
    .open();
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
  psychologicalAssessmentModalOpen.value = true;
}

/** 关闭弹窗 */
function handleClose() {
  handleCrisisEventModalApi.close();
}

/**
 * 重新加载危机事件数据
 * @param id 事件id
 */
async function reloadCrisisEvent(id: number) {
  await loadCrisisEventDetail(id);
  await loadCrisisEventProcessHistory(id);
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
            <div class="text-lg font-bold">{{ crisisEventTitle }}</div>
          </div>
        </div>
      </div>
    </template>

    <div class="h-full w-[1400px]">
      <div class="flex-center h-full w-full gap-8 overflow-hidden">
        <!-- 步骤条 -->
        <div class="h-full">
          <CommonDialogSteps
            :current-step="currentStep"
            :steps="crisisEventHandlingSteps"
            title-color="#04dc70"
            type="tag"
          >
            <template #event="{ index }">
              <!-- step1: 事件上报 -->
              <template v-if="index === 1">
                <div class="my-2">
                  <StepEventCard
                    v-if="
                      currentStep >= 2 &&
                      crisisEventDetail?.reporterName &&
                      crisisEventDetail?.reportedAt
                    "
                    :name="crisisEventDetail?.reporterName"
                    :time="crisisEventDetail?.reportedAt"
                  />
                </div>
              </template>

              <!-- step2: 分配负责人 -->
              <template v-if="index === 2">
                <div class="my-2 flex flex-col">
                  <div
                    v-if="
                      currentStep >= 3 &&
                      crisisEventDetail?.handlerName &&
                      crisisEventDetail?.updateTime
                    "
                    class="flex w-full gap-1"
                  >
                    <StepEventCard
                      :name="crisisEventDetail?.handlerName"
                      :time="crisisEventDetail?.updateTime"
                    />
                    <IconifyIcon
                      icon="material-symbols-light:refresh-rounded"
                      color="#1966FF"
                      class="size-5 self-end"
                      @click="handleQuickAssign('update')"
                    />
                  </div>

                  <LyButton
                    v-if="currentStep === 2"
                    type="primary"
                    ghost
                    size="small"
                    @click="handleQuickAssign"
                  >
                    快速分配
                  </LyButton>
                </div>
              </template>

              <!-- step3: 选择处理方式 -->
              <template v-if="index === 3">
                <div class="my-2 flex w-full flex-col">
                  <div
                    v-if="currentStep >= 4"
                    class="flex w-full flex-col gap-2"
                  >
                    <div class="flex-none text-center">
                      <LyTag
                        tag-category-key="intervention_process_method"
                        :dict-value="crisisEventDetail?.processMethod"
                      />
                    </div>
                    <StepEventCard
                      v-if="crisisEventDetail"
                      :name="crisisEventDetail.handlerName"
                      :time="crisisEventDetail.handleAt"
                    />
                    <!-- <IconifyIcon
                      icon="material-symbols-light:refresh-rounded"
                      color="#1966FF"
                      class="size-5 self-end"
                    /> -->
                  </div>
                  <LyButton
                    v-if="currentStep === 3"
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
              <template v-if="index === 4">
                <div class="my-2 flex w-full flex-col">
                  <div v-if="currentStep >= 5" class="flex w-full gap-1">
                    <StepEventCard name="心理测评师" :time="1757562878000" />
                    <IconifyIcon
                      icon="material-symbols-light:refresh-rounded"
                      color="#1966FF"
                      class="size-5 self-end"
                    />
                  </div>
                  <!-- 执行处理按钮可以在这里添加 -->
                  <LyButton
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
              <template v-if="index === 5">
                <div v-if="currentStep >= 6" class="my-2 flex w-full flex-col">
                  <div class="flex w-full gap-1">
                    <StepEventCard name="评估师" :time="1757562878000" />
                    <IconifyIcon
                      icon="material-symbols-light:refresh-rounded"
                      color="#1966FF"
                      class="size-5 self-end"
                    />
                  </div>
                  <!-- 评估按钮可以在这里添加 -->
                </div>
              </template>

              <!-- step6: 流程完成 -->
              <template v-if="index === 6">
                <div v-if="currentStep >= 7" class="my-2 flex w-full flex-col">
                  <div class="flex w-full gap-1">
                    <StepEventCard name="系统" :time="1757562878000" />
                  </div>
                  <!-- 完成状态显示 -->
                </div>
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
      v-model:open="psychologicalAssessmentModalOpen"
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
