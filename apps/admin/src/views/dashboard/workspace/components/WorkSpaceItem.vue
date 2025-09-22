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
    statusBadge?: null | {
      color: 'green' | 'grey' | 'orange' | 'red';
      text: string;
    };
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
  const base = 'rounded-lg p-3 sm:p-4 transition-all hover:shadow-sm';
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

// removed absolute-positioned action classes; use inline responsive layout instead

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
  const common =
    'px-1.5 py-0.5 sm:py-1 rounded-full text-white text-[10px] sm:text-xs leading-tight whitespace-nowrap border border-transparent';
  switch (props.statusBadge.color) {
    case 'green': {
      return `${common} bg-[#14E77E]`;
    }
    case 'grey': {
      return `${common} !text-[#0E1E42] bg-[#DAE4F8]`;
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
  const common = 'px-1.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs leading-tight whitespace-nowrap border';
  // Match figma swatches
  if (props.secondaryBadge.type === 'ai') {
    return `${common} text-[#01BE5F] bg-[#F2FFF6] border-[#00EC76]`;
  }
  if (props.secondaryBadge.type === 'teacher') {
    return `${common} text-[#0060FF] bg-[#EBF1FA] border-[#0060FF]`;
  }
  // system
  return `${common} text-[#0E1E42] bg-[#DDE8FF] border-[#98B4EE]`;
});
</script>

<template>
  <div
    class="flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
    :class="[containerClasses]"
  >
    <div class="flex flex-1 flex-col gap-1 min-w-0">
      <div class="flex flex-col gap-1.5">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span class="text-xs font-semibold text-black sm:text-sm truncate max-w-[120px] sm:max-w-none">
            {{ name }}
          </span>
          <span class="size-0.5 shrink-0 overflow-hidden rounded-full hidden sm:block">
            <span class="block size-0.5 rounded-full bg-black"></span>
          </span>
          <span class="text-xs font-semibold text-black sm:text-sm truncate max-w-[150px] sm:max-w-none">
            {{ className }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <div v-if="statusBadge" :class="statusBadgeClasses">
            {{ statusBadge!.text }}
          </div>
          <div v-if="secondaryBadge" :class="secondaryBadgeClasses">
            {{ secondaryBadge!.text }}
          </div>
        </div>
      </div>

      <div v-if="description" class="line-clamp-2 text-[10px] text-[#959599] sm:text-xs sm:line-clamp-1">
        {{ description }}
      </div>

      <div class="flex flex-wrap items-center gap-1 text-[10px] text-[#959599] sm:gap-1.5 sm:text-xs">
        <span v-if="date">{{ date }}</span>
        <span v-if="date && time" class="hidden sm:inline">·</span>
        <span v-if="time">{{ time }}</span>
        <span v-if="(date || time) && counselor" class="hidden sm:inline">·</span>
        <span v-if="counselor">咨询师：{{ counselor }}</span>
      </div>
    </div>

    <div class="mt-2 self-end sm:mt-0 sm:ml-3 sm:self-center shrink-0">
      <slot name="rightAction">
        <LyButton
          v-if="rightAction"
          size="small"
          font-size="small"
          ghost
          :type="rightActionType as any"
          class="px-2 py-1 sm:px-3"
        >
          {{ rightAction!.text }}
        </LyButton>
      </slot>
    </div>
  </div>
</template>

<style scoped></style>
