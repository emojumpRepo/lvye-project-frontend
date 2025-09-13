<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import type { StudentRecord, StudentRecordResult } from '#/utils/formatExcel';

import { onMounted, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { message, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import { importStudentProfileSingle } from '#/api/psychology/student-profile/index';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import LyUpload from '#/components/LyUpload/index.vue';
import { getDictOptions } from '#/utils/dict';
import { downloadTemplate } from '#/utils/export';
import { parseExcel } from '#/utils/formatExcel';

import ImportStudentProfileResultDialog from '../../Dialog/ImportStudentProfileResultDialog/index.vue';
import ImportProgress from './components/ImportProgress.vue';
import ImportTable from './components/ImportTable.vue';
import { studentBulkImportFailedColumns } from './data';

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

const [
  ImportStudentProfileResultDialogModal,
  ImportStudentProfileResultDialogModalApi,
] = useVbenModal({
  connectedComponent: ImportStudentProfileResultDialog,
});

const [Drawer] = useVbenDrawer({
  class: 'w-[720px]',
  confirmText: '开始导入',
  destroyOnClose: true,
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
    // drawerApi.lock();
    await startImport();
    emit('refresh');
    // drawerApi.unlock();
  },
});

/** 开始导入 */
async function startImport() {
  try {
    if (openImportProgress.value) {
      message.warning('请先等待导入完成');
      return;
    }

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
    importCompleted.value = true;
  } catch (error) {
    console.error('导入过程发生错误:', error);
    message.error('导入过程发生错误，请稍后重试');
    openImportProgress.value = false;
    importCompleted.value = true;
  }
}

/** 取消导入 */
function cancelImport() {
  isCancelled.value = true;
  openImportProgress.value = false;
  importCompleted.value = true;
  ImportStudentProfileResultDialogModalApi.setData({
    importResult: importResult.value,
    parseData: parseData.value,
  }).open();
}

/** 完成导入 */
function completeImport() {
  openImportProgress.value = false;
  importCompleted.value = true;
  ImportStudentProfileResultDialogModalApi.setData({
    importResult: importResult.value,
    parseData: parseData.value,
  }).open();
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

function resetUploadFile() {
  fileList.value = [];
  handleFileRemove();
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

    <ImportStudentProfileResultDialogModal @reset="resetUploadFile" />
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
