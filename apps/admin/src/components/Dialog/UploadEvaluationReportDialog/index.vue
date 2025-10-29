<script lang="ts" setup>
import { ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';

import { Textarea as ATextarea, message } from 'ant-design-vue';

import { uploadConsultationRecord } from '#/api/psychology';
import { FileUpload } from '#/components/upload';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const summary = ref<string>('');
const fileList = ref([]);
const params = ref();

const accept = ref([
  'png',
  'jpg',
  'jpeg',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
  'zip',
  'rar',
  '7z',
]);

const [UploadEvaluationReportModal, uploadEvaluationReportModalApi] =
  useVbenModal({
    fullscreenButton: false,
    destroyOnClose: true,
    confirmText: '开始上传纪要',
    cancelText: '稍后再来',
    class: 'w-[700px]',
    onOpenChange: async (open) => {
      if (open) {
        params.value = await uploadEvaluationReportModalApi.getData();
      }
    },
    onConfirm: async () => {
      if (!params.value.id) return message.error('咨询记录不存在');
      if (!summary.value) return message.error('咨询概要记录不能为空');

      confirm({
        title: '确认上传',
        content: '请核对咨询纪要信息，确认无误后点击确认上传',
        icon: 'warning',
      })
        .then(async () => {
          try {
            uploadEvaluationReportModalApi.lock();
            const response = await uploadConsultationRecord({
              id: params.value.id,
              summary: summary.value,
              attachmentIds: fileList.value.map((item: any) => item.id),
            });
            if (!response) return message.error('上传失败');
            emit('refresh');
            uploadEvaluationReportModalApi.close();
            message.success('上传成功');
          } catch (error) {
            console.error('上传失败', error);
            message.error('上传失败');
          } finally {
            uploadEvaluationReportModalApi.unlock();
          }
        })
        .catch(() => {
          return true;
        });
    },
  });
</script>

<template>
  <UploadEvaluationReportModal title="进行咨询纪要上传">
    <div class="space-y-6 px-3 py-2">
      <!-- 咨询概要记录 -->
      <div class="space-y-2">
        <div class="text-sm font-bold text-[#333]">咨询概要记录</div>
        <ATextarea
          v-model:value="summary"
          placeholder="请输入咨询概要记录"
          :rows="6"
        />
      </div>

      <!-- 上传附件 -->
      <div class="space-y-2">
        <div class="text-sm font-bold text-[#333]">上传附件（可多选）</div>
        <FileUpload
          v-model:value="fileList"
          :max-number="10"
          :accept="accept"
          multiple
        >
          <template #upload-text-desc>
            <span>
              最多上传10个文件，支持上传图片、文档、压缩包，最大10MB
            </span>
          </template>
        </FileUpload>
      </div>
    </div>
  </UploadEvaluationReportModal>
</template>
