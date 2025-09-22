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
  titleClass?: string;
}>();

const containerClasses = computed(() => {
  const baseClasses = 'flex w-full items-center justify-between';

  if (props.hideLine) {
    return `${baseClasses} pb-0 mb-0`;
  } else {
    const borderClass = 'border-b border-gray-100';
    const pbClass = props.pb !== undefined ? `pb-${props.pb}` : 'pb-3 sm:pb-4 md:pb-5';
    const mbClass = props.mb !== undefined ? `mb-${props.mb}` : 'mb-3 sm:mb-4';
    return `${baseClasses} ${borderClass} ${pbClass} ${mbClass}`;
  }
});
</script>

<template>
  <div :class="containerClasses">
    <div class="flex items-center gap-2 sm:gap-3">
      <div
        class="flex size-4 items-center justify-center rounded-full sm:size-5"
        :style="{ background: iconBg }"
      >
        <IconifyIcon :icon="icon" color="#fff" :size="8" class="sm:size-2.5" />
      </div>
      <h3 :class="titleClass || 'text-sm font-bold sm:text-base'">{{ title }}</h3>
      <slot name="extra"></slot>
    </div>
    <slot name="right"></slot>
  </div>
</template>
