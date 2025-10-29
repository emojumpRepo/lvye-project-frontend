<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Textarea as ATextarea } from 'ant-design-vue';

import { FileUpload } from '#/components/upload';

const [UploadEvaluationReportModal, uploadEvaluationReportModalApi] =
  useVbenModal({
    fullscreenButton: false,
    destroyOnClose: true,
    confirmText: '开始上传纪要',
    cancelText: '稍后再来',
    class: 'w-[700px]',
  });

const record = ref<string>('');
const fileList = ref([]);
</script>

<template>
  <UploadEvaluationReportModal title="进行咨询纪要上传">
    <div class="space-y-4">
      <div class="space-y-2">
        <div class="text-sm font-bold text-[#333]">咨询概要记录</div>
        <ATextarea
          v-model:value="record"
          placeholder="请输入咨询概要记录"
          :rows="4"
        />
      </div>

      <!-- 上传附件 -->
      <div class="space-y-2">
        <div class="text-sm font-bold text-[#333]">上传附件（可多选）</div>
        <FileUpload v-model:value="fileList" :max-number="10">
          <template #upload-text-desc></template>
        </FileUpload>
      </div>
    </div>
  </UploadEvaluationReportModal>
</template>
