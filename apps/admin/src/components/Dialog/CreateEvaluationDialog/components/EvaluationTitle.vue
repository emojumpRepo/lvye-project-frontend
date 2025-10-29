<script lang="ts" setup>
withDefaults(
  defineProps<{
    required?: boolean;
    title: string;
    value: number;
  }>(),
  {
    required: true,
  },
);
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      class="text-primary flex h-7 w-7 items-center justify-center rounded-full bg-[#04DC7014] text-xs font-medium"
    >
      {{ value }}
    </div>
    <span class="text-base font-semibold text-gray-900">{{ title }}</span>
    <span v-if="required" class="font-medium text-red-500">*</span>
  </div>
</template>
