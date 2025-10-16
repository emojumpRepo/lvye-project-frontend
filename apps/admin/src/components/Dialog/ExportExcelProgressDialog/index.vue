<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Progress as AProgress, message } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

const props = defineProps<{
  downloadUrl: string;
  fileName: string;
  successCount: number;
  totalCount: number;
}>();

const [ExportExcelProgressModal, ExportExcelProgressModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  closable: false,
  closeOnClickModal: false,
  showCancelButton: false,
  showConfirmButton: true,
  confirmDisabled: true,
  confirmText: '关闭',
  onConfirm: () => {
    ExportExcelProgressModalApi.close();
  },
});

/** 下载Excel文件 */
function downloadExcel() {
  if (!props.downloadUrl) return message.error('下载失败');
  const link = document.createElement('a');
  link.href = props.downloadUrl;
  link.download = `${props.fileName}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(props.downloadUrl);
}
</script>

<template>
  <ExportExcelProgressModal>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon
          icon="vscode-icons:file-type-excel2"
          color="#04DC70"
          class="size-6"
        />
        <span>导出进度</span>
      </div>
    </template>

    <div class="flex-center mt-5 flex-col px-10 py-2">
      <AProgress
        :percent="(successCount / totalCount) * 100"
        :show-info="false"
      />

      <div class="text-sm text-[#979899]">
        已导出 {{ successCount }} / {{ totalCount }} 条记录
      </div>

      <LyButton
        type="default"
        :disabled="!downloadUrl"
        @click="downloadExcel"
        size="large"
        class="mt-8"
      >
        <div class="flex items-center gap-2">
          <IconifyIcon
            icon="material-symbols:download-rounded"
            color="#04DC70"
            class="size-5"
          />
          <span>下载{{ fileName }}.xlsx </span>
        </div>
      </LyButton>
    </div>
  </ExportExcelProgressModal>
</template>
