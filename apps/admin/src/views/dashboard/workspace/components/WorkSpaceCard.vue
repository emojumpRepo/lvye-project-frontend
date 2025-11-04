<script lang="ts" setup>
import type { ViewData } from '@vben/types';

import { computed, onMounted, ref } from 'vue';

import { RefreshCw } from '@vben/icons';

import {
  Pagination as APagination,
  Spin as ASpin,
  Empty,
} from 'ant-design-vue';

import LyCardTitle from '#/components/LyCardTitle/index.vue';
import WorkSpaceItem from '#/views/dashboard/workspace/components/WorkSpaceItem.vue';

const props = withDefaults(
  defineProps<{
    class?: string;
    iconBg?: string;
    iconSrc?: string;
    items?: null | ViewData[];
    loading?: boolean;
    title: string;
    total?: number;
    withGradient?: boolean;
  }>(),
  {
    iconSrc: '',
    iconBg: '',
    withGradient: false,
    pagination: null,
    total: 0,
    showRefresh: true,
    class: '',
    items: () => [],
  },
);

const emit = defineEmits<{
  (e: 'load', params: { pageNo: number; pageSize: number }): void;
  (e: 'detail', id: number | string): void;
}>();

const currentPage = ref(1);
const pageSize = ref(5);

/** 容器类 */
const containerClasses = computed(() => {
  const base = 'rounded-2xl relative overflow-hidden';
  return props.withGradient
    ? `${base} ${props.class} bg-gradient-to-b from-[#ffffff59] via-[#ffffff] to-[#ffffff]`
    : `${base} ${props.class} bg-white`;
});

/** 分页变化 */
async function handlePageChange(pageNo: number) {
  currentPage.value = pageNo;
  if (props.items && props.items.length > 0) {
    await emit('load', { pageNo, pageSize: pageSize.value });
  }
}

/** 查看详情 */
function handleDetail(item: ViewData) {
  if (item.id) {
    emit('detail', item.id);
  }
}

onMounted(() => {
  emit('load', { pageNo: 1, pageSize: pageSize.value });
});
</script>

<template>
  <div class="flex h-full flex-col" :class="containerClasses">
    <div
      class="pointer-events-none absolute inset-0 rounded-2xl border border-white"
    ></div>

    <button
      type="button"
      class="absolute right-2 top-2 inline-flex items-center gap-1 text-xs text-[#959599] transition-colors hover:text-[#6a6a6d]"
      @click="emit('load', { pageNo: 1, pageSize })"
    >
      <RefreshCw class="size-3 sm:size-3.5" />
      <span class="hidden sm:inline">刷新</span>
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
            v-if="items && items.length > 0"
            class="relative rounded-xl border border-[#FFC57B] bg-[#FFF1E0] px-2 text-xs font-semibold text-[#FF8400] sm:rounded-2xl sm:px-3 sm:text-sm"
          >
            {{ items?.length }}
          </div>
        </template>
      </LyCardTitle>
    </div>

    <div
      class="mt-3 flex-1 overflow-y-auto px-3 pb-3 sm:mt-4 sm:px-4 sm:pb-4 md:mt-5 md:px-5 md:pb-5"
    >
      <ASpin :spinning="loading">
        <div class="flex h-full max-w-full flex-col gap-3 sm:gap-4">
          <template v-if="items && items.length > 0">
            <WorkSpaceItem
              v-for="(item, idx) in items"
              :key="idx"
              :view-data="item"
              @detail="handleDetail"
            />
          </template>
          <div v-else class="flex-center h-full">
            <Empty />
          </div>
        </div>
      </ASpin>
    </div>

    <div class="flex justify-center px-2 pb-4 pt-3">
      <APagination
        size="small"
        :current="currentPage"
        :page-size="pageSize"
        :total="total"
        :show-size-changer="false"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped></style>
