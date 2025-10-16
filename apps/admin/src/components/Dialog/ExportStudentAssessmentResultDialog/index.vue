<script lang="ts" setup>
import type { ExportProgress } from '@vben/types';

import { computed, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Progress } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

const props = withDefaults(
  defineProps<{ progress?: Partial<ExportProgress> }>(),
  {
    progress: () => ({
      fileType: 'pdf',
      exportFileName: '学生测评报告',
      currentStep: 'fetching',
      studentInfoTotal: 0,
      studentInfoFetched: 0,
      totalCount: 0,
      fetchedCount: 0,
      currentGenerateCount: 0,
      totalGenerateCount: 0,
      packagingProgress: 0,
      downloadUrl: '',
      startTime: 0,
      failureList: [],
      errorMessage: '',
    }),
  },
);

const emits = defineEmits<{
  (e: 'cancel'): void;
}>();

// 步骤条
const stepConfig = [
  { key: 'fetching', label: '准备工作' },
  { key: 'generating', label: '生成文件' },
  { key: 'packaging', label: '打包压缩' },
];

const [ExportProgressModal, exportProgressModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  closeOnClickModal: false,
  showCancelButton: true,
  showConfirmButton: true,
  cancelText: '取消导出',
  confirmText: '确定',
  closable: false,
  class: '!w-[560px]',
  contentClass: '!min-h-[430px] flex-center flex-col',
  onConfirm: () => exportProgressModalApi.close(),
  onCancel: () => {
    emits('cancel');
  },
});

/** 生成文件进度 */
const generateProgress = computed(() => {
  const current = props.progress.currentGenerateCount ?? 0;
  const total = props.progress.totalGenerateCount ?? 0;

  // 防止除零错误
  if (total === 0) {
    return 0;
  }

  const progress = (current / total) * 100;
  return Math.round(progress);
});

/** 当前步骤索引 */
const currentStepIndex = computed(() => {
  return ['fetching', 'generating', 'packaging'].indexOf(
    props.progress.currentStep ?? 'fetching',
  );
});

/** 格式化时间显示 (计算当前时间与开始时间的时间差) */
const formatDuration = (startTime?: number): string => {
  // 1. 检查输入
  if (!startTime || startTime <= 0) {
    return '0秒';
  }

  // 2. 统一转换为毫秒级时间戳，并计算时间差
  let startTimestamp = startTime;
  // 简单判断：如果时间戳小于 10,000,000,000，则假设是秒级时间戳，乘以 1000 转换为毫秒级。
  if (startTime < 10_000_000_000) {
    startTimestamp = startTime * 1000;
  }

  const nowTimestamp = Date.now();

  // 检查开始时间是否在未来
  if (startTimestamp > nowTimestamp) {
    return '0秒';
  }

  // 持续时间（以秒为单位，并向下取整）
  const totalSeconds = Math.floor((nowTimestamp - startTimestamp) / 1000);

  // 如果时间差小于等于 0
  if (totalSeconds <= 0) {
    return '0秒';
  }

  const seconds = totalSeconds;

  // 3. 计算时、分、剩余秒数
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60; // 这里的 remainingSeconds 必然在 0-59 之间

  const parts: string[] = [];

  // 4. 构建结果数组：小时和分钟继续隐藏零值
  if (hours > 0) {
    parts.push(`${hours}小时`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}分钟`);
  }

  // 5. 处理秒数：
  if (parts.length > 0 || remainingSeconds > 0) {
    parts.push(`${remainingSeconds}秒`);
  }

  // 6. 拼接结果
  return parts.join('');
};

/** 下载ZIP压缩包 */
function downloadZip() {
  if (!props.progress.downloadUrl) return message.error('下载失败');
  const link = document.createElement('a');
  link.href = props.progress.downloadUrl;
  link.download = `${props.progress.exportFileName}.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(props.progress.downloadUrl);
}

// 监听步骤变化，动态控制按钮显示
watch(
  () => props.progress.currentStep,
  (newStep) => {
    if (
      newStep === 'completed' ||
      newStep === 'error' ||
      newStep === 'cancelled'
    ) {
      // 完成、错误或取消状态：只显示确认按钮
      exportProgressModalApi.setState({
        showCancelButton: false,
        showConfirmButton: true,
      });
    } else {
      // 进行中：只显示取消按钮
      exportProgressModalApi.setState({
        showCancelButton: true,
        showConfirmButton: false,
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <ExportProgressModal>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon icon="mdi:zip-box" color="#04DC70" class="size-6" />
        <span>导出测评报告进度</span>
      </div>
    </template>

    <div class="flex w-full flex-1 flex-col justify-between px-8 py-3">
      <div class="relative">
        <Transition name="fade" mode="out-in" :duration="1">
          <!-- 第一步：批量获取数据 -->
          <div
            v-if="progress.currentStep === 'fetching'"
            key="fetching"
            class="text-center"
          >
            <!-- 动画图标 -->
            <div class="mb-6 flex justify-center">
              <div
                class="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-blue-100"
              >
                <IconifyIcon
                  icon="mdi:database-search"
                  color="#1890ff"
                  class="size-14"
                />
              </div>
            </div>

            <!-- 步骤标题 -->
            <h4 class="mb-2 text-xl font-semibold text-[#1890ff]">准备工作</h4>
            <p class="mb-10 text-sm text-gray-600">正在读取学生数据...</p>

            <!-- GIF效果动画 -->
            <div class="mb-6 flex justify-center space-x-2">
              <div
                class="h-3 w-3 animate-bounce rounded-full bg-[#1890ff]"
              ></div>
              <div
                class="h-3 w-3 animate-bounce rounded-full bg-[#1890ff]"
                style="animation-delay: 0.1s"
              ></div>
              <div
                class="h-3 w-3 animate-bounce rounded-full bg-[#1890ff]"
                style="animation-delay: 0.2s"
              ></div>
            </div>

            <!-- 进度文字 -->
            <div class="w-full rounded-lg bg-blue-50 p-4">
              <div
                v-if="progress.studentInfoFetched !== progress.studentInfoTotal"
                class="text-sm text-[#1890ff]"
              >
                正在读取：{{ progress.studentInfoFetched }} /
                {{ progress.studentInfoTotal }} 条学生信息数据
              </div>
              <div v-else>
                <div class="text-sm text-[#1890ff]">
                  正在读取：{{ progress.fetchedCount }} /
                  {{ progress.totalCount }} 条学生测评结果数据
                </div>
              </div>
            </div>
          </div>

          <!-- 第二步：生成文件 -->
          <div
            v-else-if="progress.currentStep === 'generating'"
            key="generating"
            class="text-center"
          >
            <!-- 动画图标 -->
            <div class="mb-6 flex justify-center">
              <div
                class="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-blue-100"
              >
                <IconifyIcon
                  icon="mdi:file-pdf-box"
                  color="#1890ff"
                  class="size-14"
                />
              </div>
            </div>

            <!-- 步骤标题 -->
            <h4 class="mb-2 text-xl font-semibold text-[#1890ff]">
              生成{{ progress.fileType?.toUpperCase() }}文件
            </h4>
            <p class="mb-6 text-sm text-gray-600">
              这可能需要一点时间，请不要关闭页面
            </p>

            <!-- 进度条 -->
            <div class="mb-4">
              <Progress
                :percent="
                  ((progress.currentGenerateCount ?? 0) /
                    (progress.totalGenerateCount ?? 0)) *
                  100
                "
                :stroke-color="generateProgress === 100 ? '#04DC70' : '#1890ff'"
                :show-info="false"
                :stroke-width="8"
              />
            </div>

            <!-- 进度信息 -->
            <div class="rounded-lg bg-blue-50 p-4">
              <div class="mb-1 text-lg font-medium text-[#1890ff]">
                {{ generateProgress }}%
              </div>
              <div class="text-sm text-[#1890ff]">
                正在生成已完成测评学生的测评报告...
              </div>
            </div>
          </div>

          <!-- 第三步：打包压缩 -->
          <div
            v-else-if="progress.currentStep === 'packaging'"
            key="packaging"
            class="text-center"
          >
            <!-- 动画图标 -->
            <div class="mb-6 flex justify-center">
              <div
                class="bg-blur-100 flex h-20 w-20 items-center justify-center rounded-full"
              >
                <IconifyIcon
                  icon="mdi:archive"
                  color="#1890ff"
                  class="size-14"
                />
              </div>
            </div>

            <!-- 步骤标题 -->
            <h4 class="mb-2 text-xl font-semibold text-[#1890ff]">打包压缩</h4>
            <p class="mb-6 text-sm text-gray-600">请稍候，即将完成</p>

            <!-- 进度条 -->
            <div class="mb-4">
              <Progress
                :percent="progress.packagingProgress"
                :stroke-color="
                  progress.packagingProgress === 100 ? '#04DC70' : '#1890ff'
                "
                :show-info="false"
                :stroke-width="8"
              />
            </div>

            <!-- 状态文字 -->
            <div class="rounded-lg bg-blue-50 p-4">
              <div class="text-lg font-medium text-[#1890ff]">
                {{ progress.packagingProgress }} %
              </div>
              <div class="text-sm text-[#1890ff]">
                正在将所有PDF文件打包成ZIP压缩包...
              </div>
            </div>
          </div>

          <!-- 完成状态 -->
          <div
            v-else-if="progress.currentStep === 'completed'"
            key="completed"
            class="text-center"
          >
            <!-- 成功图标 -->
            <div class="mb-6 flex justify-center">
              <IconifyIcon
                icon="mdi:check-circle"
                color="#04DC70"
                class="size-20"
              />
            </div>

            <!-- 成功标题 -->
            <h4 class="mb-2 text-xl font-semibold text-green-600">
              打包完成！
            </h4>
            <p class="mb-6 text-sm text-gray-600">
              请点击下方链接下载ZIP压缩包
            </p>

            <!-- 成功提示 -->
            <div
              class="mx-auto w-[300px] rounded-lg border border-green-200 bg-green-50 p-4"
            >
              <!-- 统计信息 -->
              <div class="text-primary space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span>用时：</span>
                  <span class="font-medium">
                    {{ formatDuration(progress.startTime) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span>成功：</span>
                  <span class="font-medium">
                    {{ progress.currentGenerateCount }}条
                  </span>
                </div>
                <div
                  v-if="progress.failureList && progress.failureList.length > 0"
                  class="flex items-center justify-between"
                >
                  <span class="text-[#FF0831]">失败：</span>
                  <span class="font-medium text-[#FF0831]">
                    {{ progress.failureList.length }}条
                  </span>
                </div>
              </div>
            </div>

            <LyButton
              type="default"
              :disabled="!progress.downloadUrl"
              @click="downloadZip"
              size="large"
              class="mt-10"
            >
              <div class="flex items-center gap-2">
                <IconifyIcon
                  icon="material-symbols:download-rounded"
                  color="#04DC70"
                  class="size-6"
                />
                <span>下载{{ progress.exportFileName }}.zip </span>
              </div>
            </LyButton>

            <!-- 失败详情列表 -->
            <!-- <div
              v-if="
                completedStatus.failureList &&
                completedStatus.failureList.length > 0
              "
              class="mt-4 max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3"
            >
              <div class="mb-2 text-sm font-medium text-[#FF0831]">
                失败详情：
              </div>
              <div class="space-y-1">
                <div
                  v-for="(item, index) in completedStatus.failureList"
                  :key="index"
                  class="rounded bg-white p-2 text-xs text-gray-700"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium">
                      {{ item.studentName }} ({{ item.studentNo }})
                    </span>
                    <span class="text-gray-500">{{ item.className }}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-2 text-gray-600">
                    <span
                      class="rounded bg-red-100 px-1.5 py-0.5 text-[#FF0831]"
                    >
                      {{
                        item.failedStep === 'fetching'
                          ? '准备工作'
                          : item.failedStep === 'generating'
                            ? '生成文件'
                            : '打包压缩'
                      }}
                    </span>
                    <span>{{ item.errorMessage }}</span>
                  </div>
                </div>
              </div>
            </div> -->
          </div>

          <!-- 错误状态 -->
          <div
            v-else-if="progress.currentStep === 'error'"
            key="error"
            class="text-center"
          >
            <!-- 错误图标 -->
            <div class="mb-6 flex justify-center">
              <IconifyIcon
                icon="mdi:alert-circle"
                color="#FF0831"
                class="size-20"
              />
            </div>

            <!-- 错误标题 -->
            <h4 class="mb-2 text-xl font-semibold text-[#FF0831]">导出失败</h4>
            <p class="mb-10 text-gray-600">导出过程中发生错误，请重试</p>

            <!-- 错误信息 -->
            <div class="rounded-lg border border-red-200 bg-red-50 p-4">
              <div class="mt-1 text-sm text-[#FF0831]">
                {{ progress.errorMessage || '未知错误' }}
              </div>
            </div>
          </div>

          <!-- 取消状态 -->
          <div
            v-else-if="progress.currentStep === 'cancelled'"
            key="cancelled"
            class="text-center"
          >
            <!-- 取消图标 -->
            <div class="mb-6 flex justify-center">
              <IconifyIcon icon="mdi:cancel" color="#FF9C05" class="size-20" />
            </div>

            <!-- 取消标题 -->
            <h4 class="mb-2 text-xl font-semibold text-[#FF9C05]">
              导出已取消
            </h4>
            <p class="mb-10 text-gray-600">您已取消导出操作</p>

            <!-- 取消信息 -->
            <div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div class="mt-1 text-sm text-[#FF9C05]">
                导出已中断，未生成任何文件
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 步骤指示器 -->
      <div
        v-if="
          progress.currentStep !== 'completed' &&
          progress.currentStep !== 'error' &&
          progress.currentStep !== 'cancelled'
        "
        class="flex flex-col items-center"
      >
        <div class="flex items-center space-x-2">
          <div
            v-for="(step, index) in stepConfig"
            :key="step.key"
            class="h-2 w-8 rounded-full transition-all duration-300"
            :class="[
              index < currentStepIndex
                ? 'bg-green-400'
                : index === currentStepIndex
                  ? 'bg-blue-400'
                  : 'bg-gray-200',
            ]"
          ></div>
        </div>
        <!-- <div class="mt-2 text-center text-sm text-gray-500">
          步骤 {{ currentStepIndex + 1 }} / {{ stepConfig.length }}
        </div> -->
      </div>
    </div>
  </ExportProgressModal>
</template>

<style scoped>
.animate-bounce {
  animation: bounce 1.5s infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
