<script setup lang="ts">
withDefaults(
  defineProps<{
    description?: string;
    marginBottom?: string;
    title?: string;
  }>(),
  {
    description: '',
    title: '',
    marginBottom: 'mb-6',
  },
);
</script>

<template>
  <div class="flex w-full items-center justify-between" :class="marginBottom">
    <!-- 标题区 -->
    <div class="flex flex-col gap-1">
      <h1 class="truncate text-[22px] font-bold text-black">
        {{ title }}
      </h1>
      <p v-if="description" class="text-sm text-[#979899]">{{ description }}</p>
    </div>
    <!-- 操作区 -->
    <slot name="action"></slot>
  </div>
</template>
<style scoped></style>
