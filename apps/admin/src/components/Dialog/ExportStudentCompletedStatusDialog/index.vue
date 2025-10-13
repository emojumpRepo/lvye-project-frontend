<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Progress } from 'ant-design-vue';

type ExportStep =
  | 'completed'
  | 'error'
  | 'fetching'
  | 'generating'
  | 'packaging';
type FileType = 'pdf' | 'xlsx';

interface FailureItem {
  errorMessage: string;
  studentName: string;
  studentNo: string;
  className: string;
  failedStep: 'fetching' | 'generating' | 'packaging';
}

interface paramsType {
  currentStep?: ExportStep;
  fileType: FileType;
  exportFileName: string;
  // 第一步：数据获取
  totalCount?: number;
  fetchedCount?: number;
  // 第二步：文件生成
  generateProgress?: number;
  // 第三步：打包压缩（仅PDF）
  packagingProgress?: number;
  // 完成统计信息
  completedStatus?: {
    exportDuration?: number; // 导出用时（秒）
    failureList?: FailureItem[]; // 失败列表
    successCount?: number; // 成功条数
  };
}

const props = withDefaults(defineProps<paramsType>(), {
  currentStep: 'fetching',
  totalCount: 0,
  fetchedCount: 0,
  generateProgress: 0,
  packagingProgress: 0,
  completedStatus: () => ({
    exportDuration: 0,
    successCount: 0,
    failureList: [],
  }),
});

// 步骤条
const stepConfig = [
  { key: 'fetching', label: '准备工作' },
  { key: 'generating', label: '生成文件' },
  { key: 'packaging', label: '打包压缩' },
];

// 导出参数
const params = ref<paramsType>({
  fileType: 'pdf',
  exportFileName: '学生完成情况',
});

const [ExportProgressModal, exportProgressModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  closable: false,
  class: '!w-[560px]',
  contentClass: '!min-h-[430px] flex-center flex-col',
  onOpenChange: (open) => {
    if (open) {
      params.value = exportProgressModalApi.getData();
    }
  },
});

/** 当前步骤索引 */
const currentStepIndex = computed(() => {
  if (params.value.currentStep === 'completed') return 3;
  if (params.value.currentStep === 'error') return -1;
  return ['fetching', 'generating', 'packaging'].indexOf(
    params.value.currentStep ?? 'fetching',
  );
});

/** 第二步进度文本 */
const progressText = computed(() => {
  const fileType = params.value.fileType?.toUpperCase();
  return props.generateProgress === 100
    ? `学生${fileType === 'PDF' ? '测评报告PDF' : '完成情况XLSX'}文件生成成功`
    : `正在生成学生${fileType === 'PDF' ? '测评报告PDF' : '完成情况XLSX'}文件...`;
});
</script>

<template>
  <ExportProgressModal title="导出学生完成情况">
    <div class="flex w-full flex-1 flex-col justify-between px-8 py-3">
      <div class="relative">
        <Transition name="fade" mode="out-in">
          <!-- 第一步：批量获取数据 -->
          <div
            v-if="currentStep === 'fetching'"
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
              <div class="text-sm text-[#1890ff]">
                已读取：{{ fetchedCount }} / {{ totalCount }} 条记录
              </div>
            </div>
          </div>

          <!-- 第二步：生成文件 -->
          <div
            v-else-if="currentStep === 'generating'"
            key="generating"
            class="text-center"
          >
            <!-- 动画图标 -->
            <div class="mb-6 flex justify-center">
              <div
                class="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-pink-100"
              >
                <IconifyIcon
                  :icon="
                    params.fileType === 'pdf'
                      ? 'mdi:file-pdf-box'
                      : 'mdi:file-excel'
                  "
                  color="#FF418D"
                  class="size-14"
                />
              </div>
            </div>

            <!-- 步骤标题 -->
            <h4 class="mb-2 text-xl font-semibold text-[#FF418D]">
              生成{{ params.fileType?.toUpperCase() }}文件
            </h4>
            <p class="mb-6 text-sm text-gray-600">
              这可能需要一点时间，请不要关闭页面
            </p>

            <!-- 进度条 -->
            <div class="mb-4">
              <Progress
                :percent="generateProgress"
                :stroke-color="generateProgress === 100 ? '#FF418D' : '#FF9C05'"
                :show-info="false"
                :stroke-width="8"
              />
            </div>

            <!-- 进度信息 -->
            <div class="rounded-lg bg-pink-50 p-4">
              <div class="mb-1 text-lg font-medium text-[#FF418D]">
                {{ generateProgress }}%
              </div>
              <div class="text-sm text-[#FF418D]">
                {{ progressText }}
              </div>
            </div>
          </div>

          <!-- 第三步：打包压缩 -->
          <div
            v-else-if="currentStep === 'packaging'"
            key="packaging"
            class="text-center"
          >
            <!-- 动画图标 -->
            <div class="mb-6 flex justify-center">
              <div
                class="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100"
              >
                <IconifyIcon
                  icon="mdi:archive"
                  color="#FF9C05"
                  class="size-14"
                />
              </div>
            </div>

            <!-- 步骤标题 -->
            <h4 class="mb-2 text-xl font-semibold text-[#FF9C05]">打包压缩</h4>
            <p class="mb-6 text-sm text-gray-600">请稍候，即将完成</p>

            <!-- 进度条 -->
            <div class="mb-4">
              <Progress
                :percent="packagingProgress"
                :stroke-color="
                  packagingProgress === 100 ? '#04DC70' : '#FF9C05'
                "
                :show-info="false"
                :stroke-width="8"
              />
            </div>

            <!-- 状态文字 -->
            <div class="rounded-lg bg-orange-50 p-4">
              <div class="text-lg font-medium text-[#FF9C05]">
                {{ packagingProgress }} %
              </div>
              <div class="text-sm text-[#FF9C05]">
                正在将所有PDF文件打包成ZIP压缩包...
              </div>
            </div>
          </div>

          <!-- 完成状态 -->
          <div
            v-else-if="currentStep === 'completed'"
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
            <div class="rounded-lg border border-green-200 bg-green-50 p-4">
              <div
                class="flex-center cursor-pointer gap-2 font-medium text-green-800 hover:underline"
              >
                <IconifyIcon
                  icon="mdi:zip-box"
                  color="#04DC70"
                  class="size-6"
                />
                {{ params.exportFileName }}.zip
              </div>

              <!-- 统计信息 -->
              <div class="text-primary mt-3 space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span>用时：</span>
                  <span class="font-medium">
                    {{ completedStatus.exportDuration }}秒
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span>成功：</span>
                  <span class="font-medium">
                    {{ completedStatus.successCount }}条
                  </span>
                </div>
                <div
                  v-if="
                    completedStatus.failureList &&
                    completedStatus.failureList.length > 0
                  "
                  class="flex items-center justify-between"
                >
                  <span class="text-[#FF0831]">失败：</span>
                  <span class="font-medium text-[#FF0831]">
                    {{ completedStatus.failureList.length }}条
                  </span>
                </div>
              </div>
            </div>

            <!-- 失败详情列表 -->
            <div
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
            </div>
          </div>

          <!-- 错误状态 -->
          <div
            v-else-if="currentStep === 'error'"
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
            <p class="mb-6 text-gray-600">导出过程中发生错误，请重试</p>

            <!-- 错误信息 -->
            <div class="rounded-lg border border-red-200 bg-red-50 p-4">
              <div class="font-medium text-[#FF0831]">错误信息</div>
              <div class="mt-1 text-sm text-[#FF0831]">
                {{ '未知错误，请联系管理员' }}
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 步骤指示器 -->
      <div
        v-if="currentStep !== 'completed' && currentStep !== 'error'"
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

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
