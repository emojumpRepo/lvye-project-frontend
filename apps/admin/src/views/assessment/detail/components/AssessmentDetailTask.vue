<script setup lang="ts">
import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Collapse as ACollapse,
  Progress as AProgress,
  Spin as ASpin,
} from 'ant-design-vue';

import { getAssessmentStatistics } from '#/api/psychology/assessment';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

const props = defineProps<{
  loading: boolean;
  taskNo: string;
}>();

const activeKey = ref<number>();
const assessmentStatistics =
  ref<PsychologyAssessmentApi.AssessmentStatistics>();

watch(
  () => props.taskNo,
  (newTaskNo) => {
    if (newTaskNo) {
      getAssessmentStatistics({
        taskNo: newTaskNo,
        includeDeptTree: 1,
      }).then((res) => {
        assessmentStatistics.value = res;
        activeKey.value = res.deptTree?.[0]?.deptId;
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="box-border flex !h-[400px] flex-col gap-6 rounded-xl bg-white p-6"
  >
    <ASpin :spinning="props.loading" class="h-full">
      <div class="flex h-full flex-col gap-6">
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
            <span class="text-primary text-2xl font-bold">
              {{ assessmentStatistics?.completionRate }}%
            </span>
            <span class="text-xs text-[#979899]">总完成率</span>
          </div>
          <div
            class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
          >
            <span class="text-2xl font-bold text-[#4C4C4D]">
              {{ assessmentStatistics?.totalParticipants }}
            </span>
            <span class="text-xs text-[#979899]">总人数</span>
          </div>
          <div
            class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
          >
            <span class="text-primary text-2xl font-bold">
              {{ assessmentStatistics?.completedParticipants }}
            </span>
            <span class="text-xs text-[#979899]">已完成</span>
          </div>
          <div
            class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
          >
            <span class="text-2xl font-bold text-[#FF9C05]">
              {{ assessmentStatistics?.notStartedParticipants }}
            </span>
            <span class="text-xs text-[#979899]">未完成</span>
          </div>
        </div>

        <div class="scroll-area h-full overflow-y-auto">
          <ACollapse
            v-model:active-key="activeKey"
            accordion
            :bordered="false"
            style="background: #f7f8fa"
          >
            <template #expandIcon="scope">
              <IconifyIcon
                icon="bxs:right-arrow"
                :rotate="scope?.isActive ? 45 : 0"
                class="size-2.5"
              />
            </template>
            <ACollapse.Panel
              v-for="dept in assessmentStatistics?.deptTree"
              :key="dept.deptId"
              :header="dept.deptName"
            >
              <template #extra>
                <span class="text-sm text-[#979899]">
                  {{ dept.completedParticipants }}/{{ dept.totalParticipants }}
                </span>
              </template>
              <div class="flex flex-col gap-4">
                <div
                  v-for="child in dept.children"
                  :key="child.deptId"
                  class="flex items-center justify-between gap-4"
                >
                  <span class="whitespace-nowrap">
                    {{ child.deptName }}
                  </span>
                  <AProgress
                    :percent="child.completionRate"
                    :size="10"
                    :show-info="false"
                  />
                  <span class="whitespace-nowrap text-sm text-[#979899]">
                    {{ child.completedParticipants }}/{{
                      child.totalParticipants
                    }}
                  </span>
                </div>
              </div>
            </ACollapse.Panel>
          </ACollapse>
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

/* Page-local custom scrollbar */
.scroll-area {
  scrollbar-color: hsl(var(--muted-foreground) / 35%) transparent;
  scrollbar-width: thin;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 35%);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 999px;
}

.scroll-area:hover::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 55%);
}
</style>
