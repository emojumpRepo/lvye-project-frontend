<script setup lang="ts">
withDefaults(
  defineProps<{
    description?: string;
    title?: string;
  }>(),
  {
    description: '',
    title: '',
  },
);
</script>

<template>
  <div class="mb-6">
    <!-- 标题区 -->
    <div class="flex flex-col">
      <h1 class="truncate text-2xl font-bold text-black">
        {{ title }}
      </h1>
      <p v-if="description" class="text-sm text-gray-500">{{ description }}</p>
    </div>
  </div>
</template>
<style scoped></style>
