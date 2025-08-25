<script setup lang="ts">
import { ref } from 'vue';

import {
  Pagination as APagination,
  Progress as AProgress,
  Spin as ASpin,
} from 'ant-design-vue';

import LyCardTitle from '#/components/LyCardTitle/index.vue';

const props = defineProps<{
  loading: boolean;
  taskInfo: any;
}>();

const currentPage = ref(1);
const pageSize = ref(5);
const totalPages = ref(20);

const goToPage = (p: number) => {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p;
};
</script>

<template>
  <div class="box-border flex flex-col gap-6 rounded-xl bg-white p-6">
    <ASpin :spinning="props.loading">
      <div class="flex h-full flex-col justify-between gap-6">
        <div class="space-y-6">
          <LyCardTitle
            icon="mingcute:task-2-fill"
            title="测评完成率"
            hide-line
            icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
          />

          <div class="grid grid-cols-4 gap-4">
            <div
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
            >
              <span class="text-primary text-2xl font-bold">80%</span>
              <span class="text-xs text-[#979899]">总完成率</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
            >
              <span class="text-2xl font-bold text-[#4C4C4D]">20</span>
              <span class="text-xs text-[#979899]">总人数</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
            >
              <span class="text-primary text-2xl font-bold">0</span>
              <span class="text-xs text-[#979899]">已完成</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
            >
              <span class="text-2xl font-bold text-[#FF9C05]">20</span>
              <span class="text-xs text-[#979899]">未完成</span>
            </div>
          </div>

          <div class="flex flex-col gap-2 rounded-2xl bg-[#F7F8FA] p-4">
            <div class="flex items-center justify-between gap-4">
              <span class="whitespace-nowrap font-bold">三年级 1 班</span>
              <AProgress :percent="80" :size="14" />
              <span class="whitespace-nowrap text-sm text-[#979899]">
                23/50
              </span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="whitespace-nowrap font-bold">三年级 1 班</span>
              <AProgress :percent="80" :size="14" />
              <span class="whitespace-nowrap text-sm text-[#979899]">
                23/50
              </span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="whitespace-nowrap font-bold">三年级 1 班</span>
              <AProgress :percent="80" :size="14" />
              <span class="whitespace-nowrap text-sm text-[#979899]">
                23/50
              </span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="whitespace-nowrap font-bold">三年级 1 班</span>
              <AProgress :percent="80" :size="14" />
              <span class="whitespace-nowrap text-sm text-[#979899]">
                23/50
              </span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="whitespace-nowrap font-bold">三年级 1 班</span>
              <AProgress :percent="80" :size="14" />
              <span class="whitespace-nowrap text-sm text-[#979899]">
                23/50
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <APagination
            :current="currentPage"
            :page-size="pageSize"
            :total="20"
            @change="goToPage"
          />
        </div>
      </div>
    </ASpin>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-progress-line) {
  margin-bottom: 5px !important;
}

:deep(.ant-spin-nested-loading) {
  height: 100% !important;
}

:deep(.ant-spin-container) {
  height: 100% !important;
}
</style>
