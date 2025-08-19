<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import LyUpload from '#/components/LyUpload/index.vue';
import downloadTemplate from '#/utils/downloadTemplate';

const [Drawer] = useVbenDrawer({
  class: 'w-[720px]',
  confirmText: '开始导入',
});

const fileList = ref<UploadProps['fileList']>([]);
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
          模板包含:学生名字、学号、性别、年级、班级、出生日期、联系电话、家庭住址等字段
        </div>
      </div>

      <!-- 上传模板 -->
      <div class="flex flex-col gap-3">
        <LyLabel has-indicator title="第二步：上传模板" />
        <LyUpload v-model:file-list="fileList" accept=".xlsx,.xls">
          <template #upload-text>
            <span>点击选择文件或拖拽文件到此区域</span>
          </template>
          <template #upload-text-desc>
            <span>支持 XLSX、XLS 格式，最大10MB</span>
          </template>
        </LyUpload>
      </div>
    </div>
  </Drawer>
</template>
