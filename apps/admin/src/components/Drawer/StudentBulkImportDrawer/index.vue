<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import LyUpload from '#/components/LyUpload/index.vue';
import { downloadTemplate, parseExcel } from '#/utils/export';

const fileList = ref<UploadProps['fileList']>([]);
const parseData = ref<null | {
  data: any[][];
  headers: string[];
  sheetName: string;
  totalRows: number;
}>(null);
const isLoading = ref(false);

const [Drawer] = useVbenDrawer({
  class: 'w-[720px]',
  confirmText: '开始导入',
  onConfirm: async () => {
    if (!fileList.value || fileList.value.length === 0) {
      message.warning('请先选择要导入的模板文件');
      return;
    }

    if (!parseData.value || parseData.value.data.length === 0) {
      message.warning('请先选择有效的Excel文件');
      return;
    }

    console.warn('fileList', fileList.value);
    console.warn('parseData', parseData.value);

    // try {
    //   const data = await importStudentProfile(
    //     fileList.value[0]?.originFileObj as File,
    //   );
    //   console.warn('data', data);

    //   // fileList.value = [];
    //   // Drawer.close();
    // } catch (error) {
    //   console.error(error);
    //   message.error('导入失败，请检查模板或稍后重试');
    // }
  },
});

// 处理文件上传
async function handleFileUpload() {
  try {
    isLoading.value = true;

    // 解析Excel文件
    if (!fileList.value?.[0]?.originFileObj) {
      message.error('文件对象不存在');
      return;
    }

    const data = await parseExcel(fileList.value[0].originFileObj);
    parseData.value = data;
    console.warn('parseData', parseData.value);

    message.success(`文件读取成功，共 ${data.data.length} 条数据`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    message.error(`文件读取失败：${errorMessage}`);
  } finally {
    isLoading.value = false;
  }
}

// 处理文件移除
function handleFileRemove() {
  parseData.value = null;
}
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
          模板包含：学生名字、学号、性别、年级、班级、出生日期、联系电话、家庭住址等字段
        </div>
      </div>

      <!-- 上传模板 -->
      <div class="flex flex-col gap-3">
        <LyLabel has-indicator title="第二步：上传模板" />
        <LyUpload
          v-model:file-list="fileList"
          accept=".xlsx,.xls"
          @file-ready="handleFileUpload"
          @remove="handleFileRemove"
        >
          <template #upload-text>
            <span>点击选择文件或拖拽文件到此区域</span>
          </template>
          <template #upload-text-desc>
            <span>支持 XLSX、XLS 格式，最大10MB</span>
          </template>
        </LyUpload>

        <!-- 数据预览 -->
        <div v-if="parseData && parseData.data.length > 0" class="mt-12">
          <LyLabel has-indicator title="第三步：数据预览" />
          <div class="mt-2 rounded border bg-gray-50 p-3">
            <div class="text-xs text-gray-600">
              <div v-if="parseData.headers.length > 0" class="mb-2">
                <strong>表头：</strong>{{ parseData.headers.join(' | ') }}
              </div>
              <div v-if="parseData.data.length > 0">
                <strong>数据预览（前3条）：</strong>
                <div
                  v-for="(row, index) in parseData.data.slice(0, 3)"
                  :key="index"
                  class="mt-1 text-gray-500"
                >
                  {{ row.join(' | ') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>
