<script lang="ts" setup>
import type { CrisisEvent, CrisisEventRecord } from '@vben/types';

import { ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Flex as AFlex, message } from 'ant-design-vue';

import {
  getCrisisEventDetail,
  getCrisisEventProcessHistory,
} from '#/api/psychology/crisis';
import { CommonDialogSteps } from '#/components/Dialog/CommonDialog';
import EditEventRecord from '#/components/Dialog/EditEventRecord.vue/index.vue';
import SelectHandleMethodDrawer from '#/components/Drawer/SelectHandleMethodDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';

import EventReporting from './components/EventReporting.vue';
import StepEventCard from './components/StepEventCard.vue';

const crisisEventDetail = ref<CrisisEvent | null>(null);
const crisisEventProcessHistory = ref<CrisisEventRecord[]>([]);

// 危机事件处理弹窗
const [HandleCrisisEventModal, handleCrisisEventModalApi] = useVbenModal({
  fullscreenButton: false,
  fullscreen: true,
  closable: false,
  footer: false,
  contentClass: '!bg-[#F7F8FB] box-border py-10',
  destroyOnClose: true,
  onOpenChange: async () => {
    const data = handleCrisisEventModalApi.getData();
    if (!data.id) return message.error('缺少事件ID');
    await loadCrisisEventDetail(data.id);
    await loadCrisisEventProcessHistory(data.id);
  },
});

// 负责人快速分配弹窗
const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  connectedComponent: EditEventRecord,
  destroyOnClose: true,
});

// 选择处理方式弹窗
const [HandleMethodDrawer, HandleMethodDrawerApi] = useVbenDrawer({
  connectedComponent: SelectHandleMethodDrawer,
});

const currentStep = ref(1); // 当前步骤

const crisisEventHandlingSteps = ref([
  {
    label: '事件上报',
    description: '已完成',
    key: 1,
  },
  {
    label: '分配负责人',
    description: '待分配', // 已分配
    key: 2,
  },
  {
    label: '选择处理方式',
    description: '待选择', // 心理咨询
    key: 3,
  },
  {
    label: '执行处理',
    description: '等待中', // 处理中
    key: 4,
  },
  {
    label: '流程完成',
    description: '未完成',
    key: 5,
  },
]);

/**
 * 获取危机事件详情
 * @param id 事件id
 */
async function loadCrisisEventDetail(id: number) {
  try {
    const response = await getCrisisEventDetail(id);
    if (!response) return message.error('获取危机事件详情失败');
    crisisEventDetail.value = response;
  } catch (error) {
    console.error('加载危机事件详情失败', error);
    message.error('加载危机事件详情失败');
  }
}

async function loadCrisisEventProcessHistory(id: number) {
  try {
    const response = await getCrisisEventProcessHistory({
      pageNo: 1,
      pageSize: 10,
      id,
    });
    if (response.total === 0) return;
    crisisEventProcessHistory.value = response.list;
  } catch (error) {
    console.error('加载事件历史记录失败', error);
    message.error('加载事件历史记录失败');
  }
}

/** 快速分配 */
function handleQuickAssign(index: number) {
  editEventRecordApi
    .setData({
      type: 'allocate',
    })
    .open();
}

/** 选择处理方式 */
function handleSelectHandleMethod() {
  HandleMethodDrawerApi.open();
}

/** 关闭弹窗 */
function handleClose() {
  handleCrisisEventModalApi.close();
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
            <div class="text-lg font-bold">危机事件处理-xxx</div>
          </div>
        </div>
      </div>
    </template>

    <AFlex justify="center" gap="large" class="h-full overflow-hidden">
      <!-- 步骤条 -->
      <div class="h-full">
        <CommonDialogSteps
          :current-step="currentStep"
          :steps="crisisEventHandlingSteps"
          title-color="#04dc70"
          type="tag"
        >
          <template #event="{ index }">
            <div class="my-2">
              <!-- step1 -->
              <StepEventCard
                v-if="index === 1"
                name="李数学老师"
                :time="1757562878000"
              />

              <!-- step2 -->
              <div v-if="index === 2" class="flex flex-col">
                <div class="mb-2 flex w-full gap-1">
                  <StepEventCard name="心理测评师" :time="1757562878000" />
                  <IconifyIcon
                    icon="material-symbols-light:refresh-rounded"
                    color="#1966FF"
                    class="size-5 self-end"
                  />
                </div>
                <button
                  class="solid rounded-lg border border-[#1966FF] px-4 py-2 text-sm text-[#1966FF] hover:bg-[#1966FF]/10"
                  @click="handleQuickAssign(index)"
                >
                  <span class="whitespace-nowrap">快速分配</span>
                </button>
              </div>

              <!-- step3 -->
              <div v-if="index === 3" class="flex w-full flex-col gap-1">
                <div class="mb-2 flex w-full gap-1">
                  <StepEventCard name="心理测评师" :time="1757562878000" />
                  <IconifyIcon
                    icon="material-symbols-light:refresh-rounded"
                    color="#1966FF"
                    class="size-5 self-end"
                  />
                </div>
                <button
                  class="solid rounded-lg border border-[#1966FF] px-4 py-2 text-sm text-[#1966FF] hover:bg-[#1966FF]/10"
                  @click="handleSelectHandleMethod()"
                >
                  <span class="whitespace-nowrap">开始选择</span>
                </button>
              </div>

              <!-- step4 -->
              <div v-if="index === 4" class="flex w-full flex-col gap-1">
                <div class="mb-2 flex w-full gap-1">
                  <StepEventCard name="心理测评师" :time="1757562878000" />
                  <IconifyIcon
                    icon="material-symbols-light:refresh-rounded"
                    color="#1966FF"
                    class="size-5 self-end"
                  />
                </div>
                <!-- <button
                  class="solid rounded-lg border border-[#1966FF] px-4 py-2 text-sm text-[#1966FF] hover:bg-[#1966FF]/10"
                  @click="handleSelectHandleMethod()"
                >
                  <span class="whitespace-nowrap">开始选择</span>
                </button> -->
              </div>
            </div>
          </template>
        </CommonDialogSteps>
      </div>

      <!-- 事件详情 -->
      <div class="h-full">
        <div class="flex h-full flex-col rounded-xl bg-white">
          <div class="box-border flex-1 overflow-hidden px-10 py-8">
            <EventReporting
              :crisis-event-detail="crisisEventDetail"
              :crisis-event-process-history="crisisEventProcessHistory"
            />
          </div>
        </div>
      </div>
    </AFlex>

    <EditEventRecordModal />
    <HandleMethodDrawer />
  </HandleCrisisEventModal>
</template>

<style lang="scss" scoped>
:deep(.ant-row) {
  height: 100% !important;
}
</style>
