<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import type { StudentRecord, StudentRecordResult } from '#/utils/formatExcel';

import { onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import { importStudentProfileSingle } from '#/api/psychology/student-profile/index';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import LyUpload from '#/components/LyUpload/index.vue';
import { getDictOptions } from '#/utils/dict';
import { downloadTemplate } from '#/utils/export';
import { parseExcel } from '#/utils/formatExcel';

import ImportProgress from './components/ImportProgress.vue';
import ImportTable from './components/ImportTable.vue';
import {
  studentBulkImportColumns,
  studentBulkImportFailedColumns,
  studentBulkImportFailedDataColumns,
} from './data';

// 导入结果类型定义
interface ImportResult {
  success: StudentRecord[];
  failed: StudentRecord[];
  summary: {
    endTime?: number;
    failedCount: number;
    pendingCount: number;
    startTime: number;
    successCount: number;
    total: number;
  };
}

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const fileList = ref<UploadProps['fileList']>([]);
const parseData = ref<null | StudentRecordResult>(null);
const importCompleted = ref(false);
const openImportProgress = ref(false);
const userSexMap = ref<any[]>([]);
const isCancelled = ref(false);

const importResult = ref<ImportResult>({
  success: [],
  failed: [],
  summary: {
    total: 0,
    pendingCount: 0,
    successCount: 0,
    failedCount: 0,
    startTime: dayjs().valueOf(),
  },
});

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[720px]',
  confirmText: '开始导入',
  closeOnClickModal: false,
  confirmLoading: importCompleted.value,
  onConfirm: async () => {
    if (
      !parseData.value?.success ||
      parseData.value.success.length === 0 ||
      importCompleted.value
    ) {
      message.warning('没有可导入的数据');
      return;
    }
    drawerApi.lock();
    await startImport();
    emit('refresh');
    drawerApi.unlock();
  },
  onClosed: () => {
    handleFileRemove();
    fileList.value = [];
    drawerApi.close();
  },
});

/** 开始导入 */
async function startImport() {
  try {
    openImportProgress.value = true;

    if (parseData.value?.success.length === 0) {
      message.warning('没有可导入的数据');
      return;
    }

    // 逐个处理每条数据
    for (const item of parseData.value!.success) {
      if (isCancelled.value) {
        break;
      }
      try {
        importResult.value.summary.pendingCount++;

        const apiData = {
          ...item,
          sex: userSexMap.value?.find((s: any) => s?.label === item.sex)?.value,
          gradeDeptId: item.gradeDeptId ? Number(item.gradeDeptId) : undefined,
          classDeptId: item.classDeptId ? Number(item.classDeptId) : undefined,
          birthDate: dayjs(item.birthDate).valueOf().toString(),
        };

        const response = await importStudentProfileSingle(apiData);

        if (response?.success) {
          // 记录成功
          importResult.value.success.push(item);
          importResult.value.summary.successCount++;
        } else {
          importResult.value.failed.push({
            ...item,
            errorMessage: response?.message || '未知错误',
          });
          importResult.value.summary.failedCount++;
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || error?.message || '未知错误';

        importResult.value.failed.push({
          ...item,
          errorMessage,
        });
        importResult.value.summary.failedCount++;
      }
    }

    // 完成导入或中断
    importResult.value.summary.endTime = dayjs().valueOf();
  } catch (error) {
    console.error('导入过程发生错误:', error);
    message.error('导入过程发生错误，请稍后重试');
    openImportProgress.value = false;
  } finally {
    importCompleted.value = true;
  }
}

/** 取消导入 */
function cancelImport() {
  isCancelled.value = true;
  openImportProgress.value = false;
  importCompleted.value = true;
  parseData.value = null;
}

/** 完成导入 */
function completeImport() {
  openImportProgress.value = false;
  importCompleted.value = true;
}

/** 解析Excel文件 */
async function parseStudentProfileExcel() {
  try {
    // 重置状态
    importCompleted.value = false;
    handleFileRemove();

    // 解析Excel文件
    if (!fileList.value?.[0]?.originFileObj) {
      message.error('文件不存在');
      return;
    }

    parseData.value = await parseExcel(fileList.value[0].originFileObj);

    if (!parseData.value) {
      return message.error('文件读取失败');
    }

    importResult.value.summary.total = parseData.value?.success.length || 0;
  } catch (error) {
    console.error('文件读取失败', error);
    message.error('文件读取失败');
  }
}

/** 处理文件移除 */
function handleFileRemove() {
  isCancelled.value = false;
  importCompleted.value = false;
  openImportProgress.value = false;
  parseData.value = null;
  importResult.value = {
    success: [],
    failed: [],
    summary: {
      total: 0,
      pendingCount: 0,
      successCount: 0,
      failedCount: 0,
      startTime: dayjs().valueOf(),
    },
  };
}

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

/** 获取字典列表 */
async function getSystemUserSexDict(): Promise<void> {
  try {
    userSexMap.value = await getDictOptions('system_user_sex');
  } catch (error) {
    console.error('获取用户性别字典失败:', error);
  }
}

onMounted(async () => {
  await getSystemUserSexDict();
});
</script>

<template>
  <Drawer title="批量导入学生">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/import_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">批量导入学生</span>
      </div>
    </template>

    <Spin :spinning="openImportProgress">
      <div class="mx-1 mt-2 flex h-full flex-col gap-9">
        <!-- 下载模板 -->
        <div>
          <LyLabel has-indicator title="第一步：下载模板" />
          <div class="mb-4 mt-3 text-sm text-[#979899]">
            请下载标准模板，按要求填写学生信息
          </div>
          <LyButton type="success" size="large" @click="downloadTemplate">
            下载导入模板
          </LyButton>
          <div class="mt-3 text-sm text-[#979899]">
            模板包含：学生名字、学号、性别、年级、班级、出生日期、联系电话、家庭住址、备注等字段
          </div>
          <div class="mt-2 text-sm text-[#979899]">
            注意：上传文件时只需上传一张表
          </div>
        </div>

        <!-- 上传模板 -->
        <div class="flex flex-col gap-3">
          <LyLabel has-indicator title="第二步：上传模板" />
          <LyUpload
            v-model:file-list="fileList"
            accept=".xlsx,.xls"
            @parse="parseStudentProfileExcel"
            @remove="handleFileRemove"
          >
            <template #upload-text>
              <span>点击选择文件或拖拽文件到此区域</span>
            </template>
            <template #upload-text-desc>
              <span>支持 XLSX、XLS 格式，最大10MB</span>
            </template>
          </LyUpload>

          <!-- 校验结果 -->
          <div v-if="parseData?.failed.length" class="mt-8 space-y-4">
            <LyLabel has-indicator title="第三步：校验结果" />
            <div class="text-sm text-[#979899]">
              成功{{ parseData.success.length }}条，失败{{
                parseData.failed.length
              }}条，请根据提示修改后重新导入
            </div>
            <ImportTable
              :columns="studentBulkImportFailedColumns"
              :data-source="parseData.failed"
            />
          </div>

          <!-- 导入结果 -->
          <div
            v-if="
              importResult.summary.endTime &&
              (importResult.summary.successCount > 0 ||
                importResult.summary.failedCount > 0)
            "
            class="mt-6 space-y-6"
          >
            <LyLabel has-indicator title="第四步：导入结果" />

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
                  <h3 class="mb-4 text-lg font-semibold text-gray-800">
                    导入概况
                  </h3>

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
                <span class="text-sm font-medium text-gray-700">
                  成功导入详情
                </span>
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
                <span class="text-sm font-medium text-gray-700">
                  失败记录详情
                </span>
              </div>
              <ImportTable
                :columns="studentBulkImportFailedDataColumns"
                :data-source="importResult.failed"
              />
            </div>
          </div>
        </div>
      </div>
    </Spin>

    <ImportProgress
      v-if="openImportProgress"
      class="absolute right-1/2 top-40 translate-x-1/2"
      :pending-count="importResult.summary.pendingCount"
      :total="importResult.summary.total"
      :success-count="importResult.summary.successCount"
      @cancel="cancelImport"
      @complete="completeImport"
    />
  </Drawer>
</template>

<style lang="scss" scoped>
th.column-money,
td.column-money {
  text-align: right !important;
}

:deep(.ant-spin-dot) {
  display: none !important;
}
</style>
