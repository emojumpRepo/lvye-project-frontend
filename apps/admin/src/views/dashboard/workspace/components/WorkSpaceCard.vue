<script lang="ts" setup>
import { computed } from 'vue';

import { Pagination as APagination } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    count?: null | number;
    // optional icon url (use Figma dev assets if passed)
    iconSrc?: null | string;
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
    iconSrc: null,
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

// Figma Dev asset: refresh icon
const figmaRefreshIcon =
  'http://localhost:3845/assets/8a4d347f5db81198ab1fea13bbf9ab4ebf9d829f.svg';
</script>

<template>
  <div :class="containerClasses">
    <div
      class="pointer-events-none absolute inset-0 rounded-2xl border border-white"
    ></div>

    <button
      v-if="showRefresh"
      type="button"
      class="absolute right-4 top-4 inline-flex items-center gap-1.5 text-sm text-[#959599] sm:right-5 sm:top-7"
      @click="emit('refresh')"
    >
      <img :src="figmaRefreshIcon" alt="" class="size-4" />
      <span>刷新</span>
    </button>

    <div class="mt-4 ml-4 flex items-center gap-2 sm:mt-5 sm:ml-5">
      <img v-if="iconSrc" :src="iconSrc!" alt="" class="size-6" />
      <div class="text-lg font-semibold text-black sm:text-xl">{{ title }}</div>
      <div
        v-if="count !== null"
        class="relative rounded-2xl bg-[#FFF1E0] px-4 py-0.5"
      >
        <div
          class="pointer-events-none absolute inset-0 rounded-2xl border border-[#FFC57B]"
        ></div>
        <span class="text-sm font-semibold text-[#FF8400]">{{
          count
        }}</span>
      </div>
    </div>

    <div class="mt-4 px-4 pb-5 sm:mt-6 sm:px-6">
      <slot></slot>
    </div>

    <div v-if="pagination" class="px-4 pb-5 sm:px-6">
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
