<script lang="ts" setup>
import { ref } from 'vue';

import { Modal as AModal } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

import CreateAssessmentDialogContent from './CreateAssessmentDialogContent.vue';
import CreateAssessmentDialogHeader from './CreateAssessmentDialogHeader.vue';

const open = defineModel<boolean>('open', { default: false });

const openCancelModal = ref(false);
const hasPublished = ref(false);

const step = ref(1);
function handleClose() {
  open.value = false;
  step.value = 1;
  openCancelModal.value = false;
  resetKey.value++;
  hasPublished.value = false;
}

// 通过重建内容组件实例，达到清空内部所有子状态的目的
const resetKey = ref(0);

function onNext() {
  if (step.value < 4) step.value += 1;
}

function onPrev() {
  if (step.value > 1) step.value -= 1;
}

function onPublished() {
  hasPublished.value = true;
}
</script>

<template>
  <AModal
    v-model:open="open"
    :footer="false"
    :title="null"
    :closable="false"
    width="100%"
    wrap-class-name="full-modal"
    @cancel="openCancelModal = true"
  >
    <div
      class="to-[rgba(255, 255, 255, 0.8)] mb-12 flex w-full items-center gap-4 bg-gradient-to-r from-[#FFFFFF] px-6 py-3"
    >
      <LyButton
        type="default"
        size="middle"
        class="rounded-[4px] px-[12px]"
        @click="hasPublished ? handleClose() : (openCancelModal = true)"
      >
        返回
      </LyButton>
      <div class="text-[18px] font-bold">创建测评任务</div>
    </div>
    <CreateAssessmentDialogHeader
      :current-step="step"
      @change="(v: number) => (step = v)"
    />

    <div class="mt-6">
      <CreateAssessmentDialogContent
        :key="resetKey"
        :step="step"
        @next="onNext"
        @prev="onPrev"
        @publish="onPublished"
      />
    </div>
  </AModal>

  <AModal
    v-model:open="openCancelModal"
    :title="null"
    centered
    :closable="false"
  >
    <div>确定要放弃创建测评任务吗？已填写的信息将丢失</div>
    <template #footer>
      <div>
        <LyButton
          type="default"
          size="middle"
          class="rounded-[4px] px-[12px]"
          @click="openCancelModal = false"
        >
          取消
        </LyButton>
        <LyButton
          type="success"
          size="middle"
          class="rounded-[4px] px-[12px]"
          @click="handleClose"
        >
          确定
        </LyButton>
      </div>
    </template>
  </AModal>
</template>

<style lang="scss">
.full-modal {
  .ant-modal {
    top: 0;
    max-width: 100%;
    padding-bottom: 0;
    margin: 0;
  }

  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: calc(100vh);
    padding: 0;
  }

  .ant-modal-body {
    flex: 1;
    background: #f5f6f8; // 轻灰底与内容区域反差
  }
}
</style>
