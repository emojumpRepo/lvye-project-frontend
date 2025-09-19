<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Modal as AModal } from 'ant-design-vue';

import { CommonDialogHeader } from '#/components/Dialog/CommonDialog';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';

import CreateAssessmentDialogContent from './CreateAssessmentDialogContent.vue';

const open = defineModel<boolean>('open', { default: false });

const hasPublished = ref(false);

// 使用useVbenModal管理确认框
const [CancelConfirmModal, cancelConfirmModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

const step = ref(1);
function handleClose() {
  open.value = false;
  step.value = 1;
  cancelConfirmModalApi.close();
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

function onBack() {
  step.value = 1;
}

function onPublished() {
  hasPublished.value = true;
}

function handleOpenCancelConfirmModal() {
  cancelConfirmModalApi
    .setData({
      title: '确定要放弃创建测评任务吗？已填写的信息将丢失',
    })
    .open();
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
    @cancel="handleOpenCancelConfirmModal"
  >
    <CommonDialogHeader
      title="创建测评任务"
      :steps="[
        { label: '基本信息' },
        { label: '选择量表' },
        { label: '选择对象' },
        { label: '确认发布' },
      ]"
      :current-step="step"
      @change="(v: number) => (step = v)"
      @back="hasPublished ? handleClose() : handleOpenCancelConfirmModal()"
    />

    <div class="mt-6">
      <CreateAssessmentDialogContent
        :key="resetKey"
        :step="step"
        @next="onNext"
        @prev="onPrev"
        @back="onBack"
        @publish="onPublished"
        @close="handleClose"
      />
    </div>
    <CancelConfirmModal @confirm="handleClose" />
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
