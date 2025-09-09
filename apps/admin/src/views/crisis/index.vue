<script lang="ts" setup>
import { Button as AButton } from 'ant-design-vue';

import CrisisSearch from './components/CrisisSearch.vue';

defineOptions({ name: 'CrisisIntervention' });
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="text-lg font-bold">危机干预管理系统</div>
        <div class="text-xs text-[#979899]">
          事件上报来源 → 处理流程分配 → 进度跟踪管理
        </div>
      </div>

      <div class="flex items-center gap-2">
        <AButton type="default">系统设置</AButton>
        <AButton type="primary">快速上报</AButton>
      </div>
    </div>

    <!-- 搜索表单 -->
    <CrisisSearch />

    <!-- 列表 -->
  </div>
</template>
