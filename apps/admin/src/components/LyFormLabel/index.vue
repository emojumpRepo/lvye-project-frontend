<script setup lang="ts">
defineProps<{
  label: string;
  required?: boolean;
}>();
</script>

<template>
  <div class="mb-2 flex items-center gap-1 text-sm">
    <div class="text-black">{{ label }}</div>
    <div v-if="required" class="text-[#FF0831]">*</div>
  </div>
</template>
