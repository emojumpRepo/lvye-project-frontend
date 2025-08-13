<script lang="ts" setup>
import { useVbenDrawer } from '@vben/common-ui';
import { Upload, Divider } from 'ant-design-vue';

const [Drawer] = useVbenDrawer({
  class: 'w-[720px]',
  contentClass: 'bg-gray-50 p-0',
  showCancelButton: false,
  showConfirmButton: false,
});
</script>

<template>
  <Drawer title="批量导入学生">
    <div class="flex h-full flex-col gap-4 p-4">
      <div class="rounded-lg bg-white p-4">
        <div class="mb-3 flex items-center gap-2">
          <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
          <span class="text-sm font-bold">上传模板</span>
        </div>
        <div class="text-xs text-[#979899]">支持 Excel/CSV，后续将提供模板下载、校验与导入结果提示。</div>
      </div>
      <div class="flex-1 rounded-lg bg-white p-4">
        <Upload.Dragger>
          <div class="text-center text-xs text-[#979899]">拖拽文件到此或点击上传</div>
        </Upload.Dragger>
      </div>
    </div>
  </Drawer>
</template>


