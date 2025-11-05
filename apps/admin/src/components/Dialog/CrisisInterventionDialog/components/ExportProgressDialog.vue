<script lang="ts" setup>
import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Progress as AProgress } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

export interface ExportProgress {
  percentage: number; // 0-100
  stage: 'completed' | 'downloading' | 'fetching' | 'generating' | 'packaging';
  message: string;
  currentFile?: string; // 当前处理的文件名
  totalFiles?: number; // 总文件数
  processedFiles?: number; // 已处理文件数
  downloadUrl?: string; // 下载链接
  fileName?: string; // ZIP文件名
}

const props = defineProps<{ progress: ExportProgress }>();

const [ExportProgressModal, ExportProgressModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  closable: false,
  closeOnClickModal: false,
  showCancelButton: false,
  showConfirmButton: false,
  class: '!w-[500px]',
});

/** 是否完成 */
const isCompleted = computed(() => props.progress.stage === 'completed');

/** 进度状态 */
const progressStatus = computed(() => {
  if (props.progress.percentage === 100) return 'success';
  return 'active';
});

/** 下载文件 */
const handleDownload = () => {
  if (props.progress.downloadUrl && props.progress.fileName) {
    const link = document.createElement('a');
    link.href = props.progress.downloadUrl;
    link.download = props.progress.fileName;
    document.body.append(link);
    link.click();
    link.remove();
  }
};
</script>

<template>
  <ExportProgressModal title="正在导出干预计划">
    <div class="py-6">
      <AProgress
        :percent="progress.percentage"
        :status="progressStatus"
        stroke-color="#04DC70"
      />

      <div v-if="!isCompleted" class="mt-4 text-center text-sm text-black/65">
        {{ progress.message }}
      </div>

      <div
        v-if="progress.stage === 'downloading' && progress.totalFiles"
        class="bg-#f5f5f5 mt-3 rounded p-3"
      >
        <div class="text-13px mb-1.5 font-medium text-black/85">
          附件下载进度: {{ progress.processedFiles || 0 }} /
          {{ progress.totalFiles }}
        </div>
        <div
          v-if="progress.currentFile"
          class="break-all text-xs text-black/45"
        >
          当前文件: {{ progress.currentFile }}
        </div>
      </div>

      <div v-if="isCompleted" class="flex-center mt-5 gap-2 text-sm">
        <IconifyIcon
          icon="mdi:check-circle"
          color="#04DC70"
          class="mt-0.5 size-4"
        />
        <span>导出完成！</span>
      </div>

      <div
        v-if="isCompleted && progress.fileName"
        class="mt-6 text-center text-sm text-black/65"
      >
        <span>点击下载：</span>
        <a
          class="ml-1 cursor-pointer text-[#1890ff] underline hover:text-[#40a9ff]/80"
          @click="handleDownload"
        >
          {{ progress.fileName }}
        </a>
      </div>
    </div>

    <template v-if="isCompleted" #footer>
      <LyButton type="success" @click="ExportProgressModalApi.close">
        关闭
      </LyButton>
    </template>
  </ExportProgressModal>
</template>
