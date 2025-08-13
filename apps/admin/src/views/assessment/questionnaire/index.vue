<script lang="ts" setup>
import { ref } from 'vue';

import Compare from './components/Compare.vue';
import List from './components/List.vue';
import Task from './components/Task.vue';

const actionButton = ref([
  {
    label: '发布提醒',
    value: 'publish',
  },
  {
    label: '延长时间',
    value: 'extend',
  },
  {
    label: '提前结束',
    value: 'end',
  },
  {
    label: '导出数据',
    value: 'export',
  },
]);

const activeButton = ref('');
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="mb-5 flex items-center justify-end gap-2">
      <button
        class="rounded-md px-5 py-2"
        :class="
          activeButton === button.value
            ? 'bg-[#04DC70] text-white'
            : 'bg-[#FFFFFFB2]'
        "
        v-for="button in actionButton"
        :key="button.value"
        @click="activeButton = button.value"
      >
        {{ button.label }}
      </button>
    </div>

    <div class="mb-6 grid grid-cols-2 gap-5">
      <!-- 统计卡片区域 -->
      <Task />

      <!-- 年级班级对比区域 -->
      <Compare />
    </div>

    <!-- 年级管理区域 -->
    <List />
  </div>
</template>
