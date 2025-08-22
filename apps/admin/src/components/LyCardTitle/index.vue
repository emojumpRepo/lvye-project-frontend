<script setup lang="ts">
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

const props = defineProps<{
  hideLine?: boolean;
  icon: string;
  iconBg: string;
  mb?: number;
  pb?: number;
  title: string;
}>();

const containerClasses = computed(() => {
  const baseClasses = 'flex w-full items-center justify-between';

  if (props.hideLine) {
    return `${baseClasses} pb-0 mb-0`;
  } else {
    const borderClass = 'border-b border-gray-100';
    const pbClass = props.pb ? `pb-${props.pb}` : 'pb-5';
    const mbClass = props.mb ? `mb-${props.mb}` : 'mb-4';
    return `${baseClasses} ${borderClass} ${pbClass} ${mbClass}`;
  }
});
</script>

<template>
  <div :class="containerClasses">
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
