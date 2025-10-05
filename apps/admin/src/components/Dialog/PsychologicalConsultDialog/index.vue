<script lang="ts" setup>
import type { AssessmentComfirmInfo } from '@vben/types';

import type { InterventionAssessmentReqVO } from '#/api/psychology';

import { ref } from 'vue';

import { alert, useVbenModal } from '@vben/common-ui';

import { Modal as AModal, Spin as ASpin } from 'ant-design-vue';

import { CommonDialogHeader } from '#/components/Dialog/CommonDialog';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';

import PsychologicalConsultDialogContent from './PsychologicalConsultDialogContent.vue';

const props = defineProps<{
  comfirmInfo: AssessmentComfirmInfo;
  publish: (params: InterventionAssessmentReqVO) => Promise<boolean>;
}>();

const open = defineModel<boolean>('open', { default: false });

/** 返回确认弹窗 */
const [ConfirmModal, confirmModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

const hasPublished = ref(false);
const resetKey = ref(0); // 通过重建内容组件实例，达到清空内部所有子状态的目的
const step = ref(1);
const loading = ref(false);

/** 上一步 */
function onPrev() {
  if (step.value > 1) step.value -= 1;
}

/** 下一步 */
function onNext() {
  if (step.value < 3) step.value += 1;
}

/** 完成时触发 */
async function onPublished(params: InterventionAssessmentReqVO) {
  loading.value = true;
  await props.publish(params).then((response) => {
    hasPublished.value = response;
    if (hasPublished.value) {
      alert({
        content: '创建评估成功',
        icon: 'success',
      }).then(() => {
        open.value = false;
      });
    }
  });
  loading.value = false;
}

/** 打开返回确认弹窗 */
function handleOpenCancelConfirmModal() {
  confirmModalApi
    .setData({
      title: '确定要放弃填写心理咨询评估吗？已填写的信息将丢失',
    })
    .open();
}

/** 关闭弹窗 */
function handleClose() {
  open.value = false;
  step.value = 1;
  confirmModalApi.close();
  resetKey.value++;
  hasPublished.value = false;
  loading.value = false;
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
    <ASpin :spinning="loading" class="mt-20">
      <CommonDialogHeader
        title="心理咨询评估表单"
        description="为学生咨询记录填写专业评估"
        :steps="[
          { label: '信息确认', description: '确认学生和咨询信息' },
          { label: '核心评估结论', description: '风险等级和问题识别' },
          { label: '详细评估内容', description: '填写详细记录或上传模板' },
        ]"
        :current-step="step"
        step-wrapper-class="px-8 py-6"
        @change="(v: number) => (step = v)"
        @back="hasPublished ? handleClose() : handleOpenCancelConfirmModal()"
      />

      <div class="mt-6">
        <PsychologicalConsultDialogContent
          :key="resetKey"
          :step="step"
          :comfirm-info="comfirmInfo"
          :loading="loading"
          @next="onNext"
          @prev="onPrev"
          @publish="onPublished"
        />
      </div>
    </ASpin>
    <ConfirmModal @confirm="handleClose" />
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
