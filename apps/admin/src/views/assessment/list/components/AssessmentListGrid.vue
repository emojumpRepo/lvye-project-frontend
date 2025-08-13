<script setup lang="ts">
import { ref } from 'vue';

import AssessmentCard from './AssessmentCard.vue';

interface AssessmentCardData { completed: number; createTime: string; effectiveTime: string; id: string; progress: number; status: string; total: number }

const cards = ref<AssessmentCardData[]>([
  { id: '25211252', status: '进行中', createTime: '2025-01-01', effectiveTime: '2025-01-05', completed: 0, total: 1, progress: 0 },
  { id: '25211253', status: '已完成', createTime: '2024-12-28', effectiveTime: '2025-01-02', completed: 5, total: 5, progress: 100 },
  { id: '25211254', status: '待开始', createTime: '2025-01-03', effectiveTime: '2025-01-10', completed: 0, total: 3, progress: 0 },
]);
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
    <AssessmentCard v-for="card in cards" :key="card.id" :card="card" />
  </div>
</template>


