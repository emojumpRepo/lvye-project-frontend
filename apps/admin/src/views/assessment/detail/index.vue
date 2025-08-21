<script lang="ts" setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LyButton from '#/components/LyButton/index.vue';

import AssessmentDetailCompare from './components/AssessmentDetailCompare.vue';
import AssessmentDetailList from './components/AssessmentDetailList.vue';
import AssessmentDetailTask from './components/AssessmentDetailTask.vue';

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
const route = useRoute();
const router = useRouter();
const taskNo = String(route.params.taskNo || '');
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="mb-5 flex items-center justify-between">
      <div>
        <LyButton size="middle" type="default" @click="router.back()">
          返回
        </LyButton>
      </div>
      <div class="space-x-2">
        <LyButton
          v-for="item in actionButton"
          :key="item.value"
          size="middle"
          type="default"
          @click="activeButton = item.value"
        >
          {{ item.label }}
        </LyButton>
      </div>
    </div>

    <div class="mb-6 grid grid-cols-2 gap-5">
      <!-- 统计卡片区域 -->
      <AssessmentDetailTask :task-no="taskNo" />

      <!-- 年级班级对比区域 -->
      <AssessmentDetailCompare />
    </div>

    <!-- 年级管理区域 -->
    <AssessmentDetailList />
  </div>
</template>
