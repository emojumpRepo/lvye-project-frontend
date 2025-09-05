<script lang="ts" setup>
import { computed } from 'vue';

import { RefreshCw } from '@vben/icons';

import { Pagination as APagination } from 'ant-design-vue';

import LyCardTitle from '#/components/LyCardTitle/index.vue';

const props = withDefaults(
  defineProps<{
    count?: null | number;
    iconBg?: string;
    // optional icon url (use Figma dev assets if passed)
    iconSrc?: string;
    // pagination config
    pagination?: null | {
      current?: number;
      pageSize?: number;
      showSizeChanger?: boolean;
      total: number;
    };
    // show top-right refresh button
    showRefresh?: boolean;
    title: string;
    // gradient border behind card per figma style
    withGradient?: boolean;
  }>(),
  {
    count: null,
    iconSrc: '',
    iconBg: '',
    withGradient: false,
    pagination: null,
    showRefresh: true,
  },
);

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'pageChange', page: number, pageSize: number): void;
}>();

const containerClasses = computed(() => {
  const base = 'rounded-2xl relative';
  return props.withGradient
    ? `${base} bg-gradient-to-b from-[#ffffff59] via-[#ffffff] to-[#ffffff]`
    : `${base} bg-white`;
});
</script>

<template>
  <div class="flex h-full flex-col" :class="containerClasses">
    <div
      class="pointer-events-none absolute inset-0 rounded-2xl border border-white"
    ></div>

    <button
      v-if="showRefresh"
      type="button"
      class="absolute right-4 top-4 inline-flex items-center gap-1.5 text-sm text-[#959599] sm:right-5 sm:top-7"
      @click="emit('refresh')"
    >
      <RefreshCw class="size-3" />
      <span>刷新</span>
    </button>

    <div class="ml-4 mt-4 flex items-center gap-2 sm:ml-5 sm:mt-5">
      <LyCardTitle
        :icon="iconSrc"
        :title="title"
        title-class="text-lg font-semibold text-black"
        hide-line
        :icon-bg="iconBg"
      >
        <template #extra>
          <div
            v-if="count !== null"
            class="relative rounded-2xl border border-[#FFC57B] bg-[#FFF1E0] px-3 text-[14px] font-semibold leading-[14px] text-[#FF8400]"
          >
            {{ count }}
          </div>
        </template>
      </LyCardTitle>
    </div>

    <div class="mt-4 flex-1 px-4 pb-5 sm:mt-6 sm:px-6">
      <slot></slot>
    </div>

    <div v-if="pagination" class="px-[70px] pb-5">
      <APagination
        size="small"
        :current="pagination.current ?? 1"
        :page-size="pagination.pageSize ?? 10"
        :total="pagination.total"
        :show-size-changer="pagination.showSizeChanger ?? false"
        @change="
          (page: number, pageSize: number) => emit('pageChange', page, pageSize)
        "
      />
    </div>
  </div>
</template>

<style scoped></style>
