<script lang="ts" setup>
import { useVbenDrawer } from '@vben/common-ui';

import ArchivesDraw from './components/ArchivesDraw.vue';
import Search from './components/Search.vue';

defineOptions({ name: 'StudentArchive' });

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: ArchivesDraw,
});

const handleViewDetail = (id: string) => {
  // 查看详情功能
  // TODO: 实现详情页面导航
  drawerApi.open();
  console.warn('查看详情：', id);
};
</script>

<template>
  <div class="p-4">
    <Search />
    <Drawer />
  </div>
</template>

<style scoped></style>
