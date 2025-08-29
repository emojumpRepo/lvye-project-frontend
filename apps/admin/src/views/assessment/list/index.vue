<script setup lang="ts">
import { ref, watch } from 'vue';

import { Button } from 'ant-design-vue';

import CreateAssessmentDialog from '#/components/Dialog/CreateAssessmentDialog/index.vue';

import AssessmentListGrid from './components/AssessmentListGrid.vue';
import AssessmentListSearch from './components/AssessmentListSearch.vue';

const isOpenCreateAssessmentDialog = ref(false);

// 创建测评
const handleCreateAssessment = () => {
  isOpenCreateAssessmentDialog.value = true;
};

// 处理搜索
const handleSearch = (params: any) => {
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

watch(
  isOpenCreateAssessmentDialog,
  (newVal) => {
    if (!newVal) {
      handleReset();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex min-h-screen flex-col gap-4 p-6">
    <AssessmentListSearch
      @search="handleSearch"
      @tab-change="handleTabChange"
      @reset="handleReset"
      @create-assessment="handleCreateAssessment"
    >
      <template #extra>
        <Button type="primary" @click="handleCreateAssessment">创建测评</Button>
      </template>
    </AssessmentListSearch>

    <AssessmentListGrid ref="gridRef" />
    <CreateAssessmentDialog v-model:open="isOpenCreateAssessmentDialog" />
  </div>
</template>

<style scoped></style>
