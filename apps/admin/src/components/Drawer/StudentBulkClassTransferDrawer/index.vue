<script lang="ts" setup>
import { useVbenDrawer } from '@vben/common-ui';
import { Divider } from 'ant-design-vue';

const [Drawer] = useVbenDrawer({
  class: 'w-[720px]',
  contentClass: 'bg-gray-50 p-0',
  showCancelButton: false,
  showConfirmButton: false,
});
</script>

<template>
  <Drawer title="批量换班学生">
    <div class="flex h-full flex-col gap-4 p-4">
      <div class="rounded-lg bg-white p-4">
        <div class="mb-3 flex items-center gap-2">
          <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
          <span class="text-sm font-bold">条件筛选</span>
        </div>
        <div class="text-xs text-[#979899]">选择年级/班级/学院等，后续接入实际数据与表单。</div>
      </div>
      <div class="flex-1 rounded-lg bg-white p-4">
        <div class="text-xs text-[#979899]">展示可换班的学生列表与批量操作。</div>
      </div>
    </div>
  </Drawer>
</template>


