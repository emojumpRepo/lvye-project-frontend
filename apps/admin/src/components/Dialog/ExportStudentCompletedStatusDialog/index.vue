<script lang="ts" setup>
import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Progress } from 'ant-design-vue';

interface Props {
  progress?: number;
  status?: 'active' | 'exception' | 'normal' | 'success';
  exportFileName?: string;
  totalCount?: number;
  completedCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  status: 'active',
  exportFileName: '学生完成情况.xlsx',
  totalCount: 0,
  completedCount: 0,
});

const [ExportProgressModal] = useVbenModal();

const progressText = computed(() => {
  if (props.status === 'success') {
    return '导出完成';
  }
  if (props.status === 'exception') {
    return '导出失败';
  }
  return `正在导出... ${props.completedCount}/${props.totalCount}`;
});

const progressColor = computed(() => {
  if (props.status === 'exception') {
    return '#ff4d4f';
  }
  if (props.status === 'success') {
    return '#52c41a';
  }
  return '#1890ff';
});
</script>

<template>
  <ExportProgressModal
    title="导出学生完成情况进度"
    class="export-progress-modal"
  >
    <div class="space-y-6 p-6">
      <!-- 文件信息 -->
      <div class="flex items-center space-x-3">
        <div class="i-mdi:file-excel text-2xl text-green-600"></div>
        <div>
          <div class="text-base font-medium text-gray-900">
            {{ exportFileName }}
          </div>
          <div class="text-sm text-gray-500">Excel 文件</div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="space-y-3">
        <Progress
          :percent="progress"
          :status="status"
          :stroke-color="progressColor"
          :show-info="false"
          :size="8"
          class="mb-2"
        />

        <!-- 进度信息 -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">{{ progressText }}</span>
          <span
            class="font-medium"
            :class="{
              'text-blue-600': status === 'active',
              'text-green-600': status === 'success',
              'text-red-600': status === 'exception',
            }"
          >
            {{ progress }}%
          </span>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="space-y-2 rounded-lg bg-gray-50 p-4">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">总记录数：</span>
          <span class="font-medium">{{ totalCount }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">已处理：</span>
          <span class="font-medium">{{ completedCount }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">剩余：</span>
          <span class="font-medium">{{ totalCount - completedCount }}</span>
        </div>
      </div>

      <!-- 状态提示 -->
      <div
        v-if="status === 'success'"
        class="flex items-center space-x-2 rounded-lg bg-green-50 p-3 text-green-600"
      >
        <div class="i-mdi:check-circle text-lg"></div>
        <span class="text-sm font-medium">导出成功！文件已保存到下载目录</span>
      </div>

      <div
        v-if="status === 'exception'"
        class="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-red-600"
      >
        <div class="i-mdi:alert-circle text-lg"></div>
        <span class="text-sm font-medium">导出失败，请重试或联系管理员</span>
      </div>
    </div>
  </ExportProgressModal>
</template>

<style scoped>
.export-progress-modal :deep(.ant-progress-bg) {
  transition: all 0.3s ease;
}
</style>
