<script lang="ts" setup>
import { computed } from 'vue';

import { Pagination as APagination } from 'ant-design-vue';

import LyCardTitle from '#/components/LyCardTitle/index.vue';

const props = withDefaults(
  defineProps<{
    class?: string;
    count?: null | number;
    iconBg?: string;
    iconSrc?: string;
    title: string;
    withGradient?: boolean;
  }>(),
  {
    count: null,
    iconSrc: '',
    iconBg: '',
    withGradient: false,
    pagination: null,
    showRefresh: true,
    class: '',
  },
);

const emit = defineEmits<{
  (e: 'pageChange', page: number, pageSize: number): void;
}>();

const containerClasses = computed(() => {
  const base = 'rounded-2xl relative overflow-hidden';
  return props.withGradient
    ? `${base} ${props.class} bg-gradient-to-b from-[#ffffff59] via-[#ffffff] to-[#ffffff]`
    : `${base} ${props.class} bg-white`;
});
</script>

<template>
  <div class="flex h-full flex-col" :class="containerClasses">
    <div
      class="pointer-events-none absolute inset-0 rounded-2xl border border-white"
    ></div>

    <button
      type="button"
      class="absolute right-3 top-3 inline-flex items-center gap-1 text-xs text-[#959599] transition-colors hover:text-[#6a6a6d] sm:right-4 sm:top-4 sm:gap-1.5 sm:text-sm md:right-5 md:top-5"
      @click="emit('refresh')"
    >
      <!-- <RefreshCw class="size-3 sm:size-3.5" />
      <span class="hidden sm:inline">刷新</span> -->
    </button>

    <div
      class="ml-3 mt-3 flex items-center gap-2 sm:ml-4 sm:mt-4 md:ml-5 md:mt-5"
    >
      <LyCardTitle
        :icon="iconSrc"
        :title="title"
        title-class="text-base font-semibold text-black sm:text-lg"
        hide-line
        :icon-bg="iconBg"
      >
        <template #extra>
          <div
            v-if="count !== null"
            class="relative rounded-xl border border-[#FFC57B] bg-[#FFF1E0] px-2 py-0.5 text-xs font-semibold text-[#FF8400] sm:rounded-2xl sm:px-3 sm:text-sm"
          >
            {{ count }}
          </div>
        </template>
      </LyCardTitle>
    </div>

    <div
      class="mt-3 flex-1 overflow-y-auto px-3 pb-3 sm:mt-4 sm:px-4 sm:pb-4 md:mt-5 md:px-5 md:pb-5"
    >
      <slot></slot>
    </div>

    <div class="flex justify-center px-3 pb-3 sm:px-5 sm:pb-4 md:pb-5">
      <APagination
        size="small"
        :current="1"
        :page-size="10"
        :total="12"
        :show-size-changer="false"
        @change="
          (page: number, pageSize: number) => emit('pageChange', page, pageSize)
        "
      />
    </div>
  </div>
</template>

<style scoped></style>
