<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Progress as AProgress, message } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

const props = defineProps<{
  downloadUrl: string;
  fileName: string;
  studentInfoFetched: number;
  studentInfoTotal: number;
  successCount: number;
  totalCount: number;
  type: 'answer' | 'completed';
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

    <div class="box-border flex flex-col items-center space-y-6 px-8 py-4">
      <div class="w-full space-y-6">
        <!-- 第一步：读取学生信息 -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white"
            >
              1
            </div>
            <div class="text-sm font-semibold text-gray-800">读取学生信息</div>
            <div
              v-if="
                studentInfoFetched === studentInfoTotal && studentInfoTotal > 0
              "
              class="flex h-4 w-4 items-center justify-center rounded-full bg-green-500"
            >
              <IconifyIcon icon="mdi:check" class="text-xs text-white" />
            </div>
          </div>

          <div class="box-border pl-8">
            <AProgress
              :percent="
                studentInfoTotal > 0
                  ? (studentInfoFetched / studentInfoTotal) * 100
                  : 0
              "
              :show-info="false"
            />

            <div class="text-sm text-gray-500">
              已读取 {{ studentInfoFetched }} /
              {{ studentInfoTotal }} 名学生信息
            </div>
          </div>
        </div>

        <!-- 第二步：导出答题记录 -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
              :class="[
                studentInfoFetched === studentInfoTotal
                  ? 'bg-blue-500'
                  : 'bg-gray-300',
              ]"
            >
              2
            </div>
            <div
              class="text-sm font-semibold"
              :class="[
                studentInfoFetched === studentInfoTotal
                  ? 'text-gray-800'
                  : 'text-gray-400',
              ]"
            >
              导出{{ type === 'answer' ? '答题记录' : '测评结果' }}
            </div>
            <div
              v-if="
                successCount === totalCount &&
                totalCount > 0 &&
                studentInfoFetched === studentInfoTotal
              "
              class="flex h-4 w-4 items-center justify-center rounded-full bg-green-500"
            >
              <IconifyIcon icon="mdi:check" class="text-xs text-white" />
            </div>
          </div>

          <div class="box-border pl-8">
            <AProgress
              :percent="
                studentInfoFetched === studentInfoTotal
                  ? totalCount > 0
                    ? (successCount / totalCount) * 100
                    : 0
                  : 0
              "
              :show-info="false"
              :class="{
                'opacity-50': studentInfoFetched !== studentInfoTotal,
              }"
            />

            <div
              class="text-sm"
              :class="[
                studentInfoFetched === studentInfoTotal
                  ? 'text-gray-500'
                  : 'text-gray-400',
              ]"
            >
              {{
                studentInfoFetched === studentInfoTotal
                  ? `已导出 ${successCount} / ${totalCount} 名已完成测评学生的${type === 'answer' ? '答题记录' : '测评结果'}`
                  : '等待第一步完成...'
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- 下载按钮 -->
      <LyButton
        type="default"
        :disabled="!downloadUrl"
        @click="downloadExcel"
        size="large"
        class="mt-8"
      >
        <div class="flex items-center space-x-2">
          <IconifyIcon
            icon="material-symbols:download-rounded"
            color="#04DC70"
            class="size-6"
          />
          <span class="font-medium">下载 {{ fileName }}.xlsx</span>
        </div>
      </LyButton>
    </div>
  </ExportExcelProgressModal>
</template>
