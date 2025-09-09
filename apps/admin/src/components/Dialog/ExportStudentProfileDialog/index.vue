<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Spin } from 'ant-design-vue';

import ImportTable from '../../Drawer/StudentBulkImportDrawer/components/ImportTable.vue';
import {
  studentBulkImportColumns,
  studentBulkImportFailedDataColumns,
} from './data';

const emit = defineEmits<{
  (e: 'reset'): void;
}>();

const importResult = ref();
const parseData = ref();
const loading = ref(false);

const [ExportStudentProfileModal, ExportStudentProfileModalApi] = useVbenModal({
  title: '导入学生档案结果',
  fullscreenButton: false,
  class: 'w-[800px]',
  confirmText: '完成',
  onOpenChange: async (open) => {
    if (open) {
      loading.value = true;
      const data = await ExportStudentProfileModalApi.getData();
      importResult.value = data.importResult;
      parseData.value = data.parseData;
      loading.value = false;
    }
  },
  onConfirm: () => {
    emit('reset');
    ExportStudentProfileModalApi.close();
  },
  onCancel: () => {
    emit('reset');
    ExportStudentProfileModalApi.close();
  },
});

/** 格式化处理时间 */
function formatProcessTime(startTime: number, endTime?: number) {
  if (!endTime) return '处理中...';

  const duration = endTime - startTime;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return minutes > 0
    ? `${minutes}分${remainingSeconds}秒`
    : `${remainingSeconds}秒`;
}
</script>

<template>
  <ExportStudentProfileModal>
    <Spin :spinning="loading" />
    <!-- 导入结果 -->
    <div v-if="!loading" class="mt-2 space-y-6 px-2">
      <!-- 导入概况卡片 -->
      <div
        class="import-summary-card rounded-lg border p-6 shadow-sm transition-all duration-200"
        :class="[
          importResult.summary.failedCount === 0
            ? 'border-green-200 bg-green-50'
            : 'border-orange-200 bg-orange-50',
        ]"
      >
        <div class="flex items-start gap-4">
          <!-- 状态图标 -->
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF9C0514]"
          >
            <IconifyIcon icon="material-symbols:error" color="#FF9C05" />
          </div>

          <!-- 导入概况内容 -->
          <div class="flex-1">
            <h3 class="mb-4 text-lg font-semibold text-gray-800">导入概况</h3>

            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="w-20 text-gray-600">• 成功导入：</span>
                <span class="font-semibold text-green-600">
                  {{ importResult.summary.successCount }} 名学生
                </span>
              </div>

              <div
                v-if="importResult.summary.failedCount > 0"
                class="flex items-center gap-2"
              >
                <span class="w-20 text-gray-600">• 导入失败：</span>
                <span class="font-semibold text-red-600">
                  {{ importResult.summary.failedCount }} 名学生
                </span>
              </div>

              <div
                v-if="parseData && parseData.failed.length > 0"
                class="flex items-center gap-2"
              >
                <span class="w-20 text-gray-600">• 错误数据：</span>
                <span class="font-semibold text-red-600">
                  {{ parseData.failed.length }} 条记录
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span class="w-20 text-gray-600">• 处理时间：</span>
                <span class="font-semibold text-gray-800">
                  {{
                    formatProcessTime(
                      importResult.summary.startTime,
                      importResult.summary.endTime,
                    )
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细结果表格 -->
      <div v-if="importResult.success.length > 0" class="space-y-3">
        <div class="flex items-center gap-2">
          <div class="h-1 w-1 rounded-full bg-green-500"></div>
          <span class="text-sm font-medium text-gray-700"> 成功导入详情 </span>
        </div>
        <ImportTable
          :columns="studentBulkImportColumns"
          :data-source="importResult.success"
        />
      </div>

      <!-- 失败结果表格 -->
      <div v-if="importResult.failed.length > 0" class="space-y-3">
        <div class="flex items-center gap-2">
          <div class="h-1 w-1 rounded-full bg-red-500"></div>
          <span class="text-sm font-medium text-gray-700"> 失败记录详情 </span>
        </div>
        <ImportTable
          :columns="studentBulkImportFailedDataColumns"
          :data-source="importResult.failed"
        />
      </div>
    </div>
  </ExportStudentProfileModal>
</template>
