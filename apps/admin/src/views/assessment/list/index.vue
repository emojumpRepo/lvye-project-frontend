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
</script>

<template>
  <CreateAssessmentDialog v-model:open="isOpenCreateAssessmentDialog" />
  <div class="flex min-h-screen flex-col gap-4 p-6">
    <div class="flex items-center justify-between">
      <div class="text-xl font-bold">测评中心</div>
      <LyButton type="success" size="large" @click="handleCreateAssessment">
        创建测评
      </LyButton>
    </div>
    <AssessmentListSearch @open-create="handleCreateAssessment" />
    <AssessmentListGrid />
  </div>
</template>

<style scoped></style>
