<script setup lang="ts">
import { ref } from 'vue';

import CreateAssessmentDialog from '#/components/Dialog/CreateAssessmentDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';

import AssessmentListGrid from './components/AssessmentListGrid.vue';
import AssessmentListSearch from './components/AssessmentListSearch.vue';

const isOpenCreateAssessmentDialog = ref(false);
const handleCreateAssessment = () => {
  isOpenCreateAssessmentDialog.value = true;
};

// 处理搜索
const handleSearch = (params: any) => {
  // 将搜索参数传递给网格组件
  if (gridRef.value) {
    gridRef.value.search(params);
  }
};

// 处理tab切换
const handleTabChange = (status: number | undefined) => {
  if (gridRef.value) {
    gridRef.value.filterByStatus(status);
  }
};

// 处理重置
const handleReset = () => {
  if (gridRef.value) {
    gridRef.value.resetSearch();
  }
};

const gridRef = ref();
</script>

<template>
  <div class="flex min-h-screen flex-col gap-4 p-6">
    <div class="flex items-center justify-between">
      <div class="text-xl font-bold">测评中心</div>
      <LyButton type="success" size="large" @click="handleCreateAssessment">
        创建测评
      </LyButton>
    </div>
    <AssessmentListSearch
      @search="handleSearch"
      @tab-change="handleTabChange"
      @reset="handleReset"
    />
    <AssessmentListGrid ref="gridRef" />
    <CreateAssessmentDialog v-model:open="isOpenCreateAssessmentDialog" />
  </div>
</template>

<style scoped></style>
