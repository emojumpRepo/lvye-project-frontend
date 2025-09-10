<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import CounselingSearch from './components/CounselSearch.vue';
import { mockQuery, useGridColumns } from './data';

defineOptions({ name: 'CounselingList' });

// 表格
const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: { query: mockQuery },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { refresh: true, search: false },
  } as VxeTableGridOptions,
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 overflow-hidden">
    <!-- 咨询记录搜索栏 -->
    <CounselingSearch :dept-list-loaded="true" />
    <!-- 表格 -->
    <div class="flex-1 overflow-hidden">
      <Grid />
    </div>
  </div>
</template>
