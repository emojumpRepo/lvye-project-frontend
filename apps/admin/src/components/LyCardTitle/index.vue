<script setup lang="ts">
import { IconifyIcon } from '@vben/icons';

defineProps<{
  icon: string;
  iconBg: string;
  pb?: number;
  title: string;
}>();
</script>

<template>
  <div
    class="mb-4 flex w-full items-center justify-between border-b border-gray-100"
    :class="pb ? `pb-${pb}` : 'pb-5'"
  >
    <div class="flex items-center gap-3">
      <div
        class="flex size-5 items-center justify-center rounded-full"
        :style="{ background: iconBg }"
      >
        <IconifyIcon :icon="icon" color="#fff" :size="10" />
      </div>
      <h3 class="font-bold">{{ title }}</h3>
    </div>
    <slot name="right"></slot>
  </div>
</template>
