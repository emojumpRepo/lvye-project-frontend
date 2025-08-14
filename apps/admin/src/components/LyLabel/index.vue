<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    customGapClass?: string;
    customTitleClass?: string;
    hasIndicator?: boolean;
    marginBottomClass?: string;
    required?: boolean;
    size?: 'default' | 'large' | 'small';
    title: string;
  }>(),
  {
    customTitleClass: '',
    hasIndicator: false,
    required: false,
    size: 'default',
    customGapClass: '',
    marginBottomClass: 'mb-2',
  },
);

const titleClass = computed(() => {
  if (props.customTitleClass) {
    return props.customTitleClass;
  }
  switch (props.size) {
    case 'large': {
      return 'text-[18px] font-bold';
    }
    case 'small': {
      return 'text-[14px] font-medium';
    }
    default: {
      return 'text-[16px] font-bold';
    }
  }
});

const indicatorClass = computed(() => {
  switch (props.size) {
    case 'large': {
      return 'h-[18px] w-[4px]';
    }
    case 'small': {
      return 'h-[14px] w-[2px]';
    }
    default: {
      return 'h-[16px] w-[3px]';
    }
  }
});

const gapClass = computed(() => {
  if (props.customGapClass) {
    return props.customGapClass;
  }
  switch (props.size) {
    case 'large': {
      return 'gap-3';
    }
    case 'small': {
      return 'gap-1';
    }
    default: {
      return 'gap-2';
    }
  }
});
</script>

<template>
  <div class="flex items-center" :class="[marginBottomClass, gapClass]">
    <span
      v-if="hasIndicator"
      class="bg-[#04DC70]"
      :class="indicatorClass"
    ></span>
    <div :class="titleClass">{{ title }}</div>
    <div v-if="required" class="text-[#FF0831]">*</div>
  </div>
</template>
