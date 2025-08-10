<script lang="ts" setup>
import { computed } from 'vue';

import LyButton from '#/components/LyButton/index.vue';

type Severity = 'danger' | 'neutral' | 'warning';

interface RightAction {
  text: string;
  color: 'green' | 'orange' | 'red';
}

interface SecondaryBadge {
  text: string;
  // visual style token names mapped in component
  type: 'ai' | 'system' | 'teacher';
}

const props = withDefaults(
  defineProps<{
    className: string;
    counselor?: null | string;
    date?: null | string;
    description?: null | string;
    name: string;
    rightAction?: null | RightAction;
    secondaryBadge?: null | SecondaryBadge;
    // leading background & left-border accent
    severity?: Severity;
    statusBadge?: null | { color: 'green' | 'orange' | 'red'; text: string };
    time?: null | string;
  }>(),
  {
    severity: 'neutral',
    statusBadge: null,
    secondaryBadge: null,
    description: null,
    date: null,
    time: null,
    counselor: null,
    rightAction: null,
  },
);

const containerClasses = computed(() => {
  const base = 'relative rounded-lg p-5';
  switch (props.severity) {
    case 'danger': {
      return `${base} bg-[rgba(250,75,75,0.06)] border-l-4 border-[#FA4B4B]`;
    }
    case 'warning': {
      return `${base} bg-[#FFF9F0] border-l-4 border-[#FF9D00]`;
    }
    default: {
      return `${base} bg-[#F7F8FA]`;
    }
  }
});

const actionClasses = computed(() => {
  if (!props.rightAction) return '';
  const common =
    'absolute right-3 top-1/2 -translate-y-1/2 text-xs flex items-center';
  switch (props.rightAction.color) {
    default: {
      return common;
    }
  }
});

const rightActionType = computed(() => {
  if (!props.rightAction) return 'primary';
  switch (props.rightAction.color) {
    case 'green': {
      return 'success';
    }
    case 'orange': {
      return 'warning';
    }
    case 'red': {
      return 'error';
    }
    default: {
      return 'primary';
    }
  }
});

const statusBadgeClasses = computed(() => {
  if (!props.statusBadge) return '';
  const common = 'px-1.5 py-1 rounded-[19px] text-white text-[10px]';
  switch (props.statusBadge.color) {
    case 'green': {
      return `${common} bg-[#14E77E]`;
    }
    case 'orange': {
      return `${common} bg-[#FF9D00]`;
    }
    case 'red': {
      return `${common} bg-[#FF4800]`;
    }
    default: {
      return common;
    }
  }
});

const secondaryBadgeClasses = computed(() => {
  if (!props.secondaryBadge) return '';
  // Match figma swatches
  if (props.secondaryBadge.type === 'ai') {
    return 'px-1.5 py-1 rounded-[19px] text-[#01BE5F] text-[10px] bg-[#F2FFF6] border border-[#00EC76]';
  }
  if (props.secondaryBadge.type === 'teacher') {
    return 'px-1.5 py-1 rounded-[19px] text-[#0060FF] text-[10px] bg-[#EBF1FA] border border-[#0060FF]';
  }
  // system
  return 'px-1.5 py-1 rounded-[19px] text-[#0E1E42] text-[10px] bg-[#DDE8FF] border border-[#98B4EE]';
});
</script>

<template>
  <div :class="containerClasses">
    <div v-if="rightAction" :class="actionClasses">
      <LyButton
        size="middle"
        ghost
        :type="rightActionType as any"
        class="h-8 rounded-md border px-2.5"
      >
        {{ rightAction!.text }}
      </LyButton>
    </div>

    <div class="flex items-center gap-1.5 pr-24">
      <div class="text-[14px] font-semibold text-black">{{ name }}</div>
      <div class="size-0.5 overflow-hidden rounded-full">
        <span class="block size-0.5 bg-[#D9D9D9]"></span>
      </div>
      <div class="text-[14px] font-semibold text-black">{{ className }}</div>
      <div v-if="statusBadge" :class="statusBadgeClasses">
        {{ statusBadge!.text }}
      </div>
      <div v-if="secondaryBadge" :class="secondaryBadgeClasses">
        {{ secondaryBadge!.text }}
      </div>
    </div>

    <div v-if="description" class="mt-2 text-[12px] text-[#959599]">
      {{ description }}
    </div>

    <div class="mt-2 flex items-center gap-1.5 text-[12px] text-[#959599]">
      <span v-if="date">{{ date }}</span>
      <span v-if="time">{{ time }}</span>
    </div>

    <div v-if="counselor" class="mt-1 text-[12px] text-[#959599]">
      咨询师：{{ counselor }}
    </div>
  </div>
</template>

<style scoped></style>
