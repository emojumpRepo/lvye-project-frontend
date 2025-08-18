<script setup lang="ts">
import AssessmentListGrid from './components/AssessmentListGrid.vue';
import AssessmentListSearch from './components/AssessmentListSearch.vue';
</script>

<template>
  <div class="flex min-h-screen flex-col gap-4 p-6">
    <AssessmentListSearch />
    <AssessmentListGrid />
  </div>
</template>

<style scoped></style>
