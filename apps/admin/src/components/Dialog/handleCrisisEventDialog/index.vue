<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Col as ACol, Row as ARow } from 'ant-design-vue';

import { CommonDialogSteps } from '#/components/Dialog/CommonDialog';
import EditEventRecord from '#/components/Dialog/EditEventRecord.vue/index.vue';
import LyButton from '#/components/LyButton/index.vue';

import EventReporting from './components/EventReporting.vue';
import StepEventCard from './components/StepEventCard.vue';

const [HandleCrisisEventModal, handleCrisisEventModalApi] = useVbenModal({
  fullscreenButton: false,
  fullscreen: true,
  closable: false,
  footer: false,
  contentClass: '!bg-[#F7F8FB] box-border py-10',
  destroyOnClose: true,
});

const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  connectedComponent: EditEventRecord,
  destroyOnClose: true,
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

/** 快速分配 */
function handleQuickAssign(index: number) {
  editEventRecordApi
    .setData({
      type: 'operator',
    })
    .open();
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
        class="to-[rgba(255, 255, 255, 0.8) flex w-full items-center gap-4 bg-gradient-to-r from-[#FFFFFF]"
      >
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
    </template>

    <ARow justify="center" :gutter="24" class="h-full overflow-hidden">
      <!-- 步骤条 -->
      <ACol :span="4" class="h-full">
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
              <div v-if="index === 3" class="flex w-full gap-1">
                <StepEventCard name="心理测评师" :time="1757562878000" />
                <IconifyIcon
                  icon="material-symbols-light:refresh-rounded"
                  color="#1966FF"
                  class="size-5 self-end"
                />
              </div>

              <!-- step4 -->
              <div v-if="index === 4" class="flex w-full gap-1">
                <StepEventCard name="心理测评师" :time="1757562878000" />
                <IconifyIcon
                  icon="material-symbols-light:refresh-rounded"
                  color="#1966FF"
                  class="size-5 self-end"
                />
              </div>
            </div>
          </template>
        </CommonDialogSteps>
      </ACol>

      <!-- 事件详情 -->
      <ACol :span="14" class="h-full">
        <div class="flex h-full flex-col rounded-xl bg-white">
          <div class="box-border flex-1 overflow-hidden p-8">
            <EventReporting />
          </div>

          <div
            class="flex justify-end bg-white px-4 py-5"
            style="box-shadow: 0 -4px 6px 0 #031a4108"
          >
            <LyButton type="error" size="large" @click="handleClose">
              关闭事件
            </LyButton>
          </div>
        </div>
      </ACol>
    </ARow>

    <EditEventRecordModal />
  </HandleCrisisEventModal>
</template>

<style lang="scss" scoped>
:deep(.ant-row) {
  height: 100% !important;
}
</style>
