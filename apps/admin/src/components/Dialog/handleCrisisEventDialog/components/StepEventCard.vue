<script lang="ts" setup>
import dayjs from 'dayjs';

defineProps<{
  name: string;
  time: number;
}>();
</script>

<template>
  <div
    class="flex w-full flex-col items-center gap-0.5 rounded-lg bg-[#F7F8FA] p-2 text-sm"
  >
    <span class="whitespace-nowrap text-[#4C4C4D]">{{ name }}</span>
    <span class="whitespace-nowrap text-[#979899]">
      {{ dayjs(time).format('YYYY-MM-DD') || '-' }}
    </span>
  </div>
</template>
