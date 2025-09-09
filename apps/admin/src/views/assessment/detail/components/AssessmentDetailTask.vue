<script setup lang="ts">
import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Collapse as ACollapse,
  Empty as AEmpty,
  Progress as AProgress,
  Spin as ASpin,
} from 'ant-design-vue';

import { getAssessmentStatistics } from '#/api/psychology/assessment';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

const props = defineProps<{
  taskNo: string;
}>();

const activeKey = ref<number>();
const loading = ref(true);
const assessmentStatistics =
  ref<PsychologyAssessmentApi.AssessmentStatistics>();

watch(
  () => props.taskNo,
  (newTaskNo) => {
    if (newTaskNo) {
      loading.value = true;
      getAssessmentStatistics({
        taskNo: newTaskNo,
        includeDeptTree: 1,
      })
        .then((response) => {
          assessmentStatistics.value = response;
          activeKey.value = response.deptTree?.[0]?.deptId;
        })
        .finally(() => {
          loading.value = false;
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
    <ASpin :spinning="loading" class="h-full">
      <div class="flex h-full flex-col justify-between gap-6 overflow-hidden">
        <LyCardTitle
          icon="mingcute:task-2-fill"
          title="测评完成率"
          hide-line
          icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
        >
          <template #right>
            <span class="text-xs text-[#979899]">
              总参与人数: {{ assessmentStatistics?.totalParticipants }}人
            </span>
          </template>
        </LyCardTitle>

        <template v-if="!loading">
          <div v-if="assessmentStatistics" class="flex flex-1 flex-col gap-6">
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
                <span class="text-2xl font-bold text-[#1966FF]">
                  {{ assessmentStatistics?.completedParticipants }}
                </span>
                <span class="text-xs text-[#979899]">已完成</span>
              </div>
              <div
                class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
              >
                <span class="text-primary text-2xl font-bold">
                  {{ assessmentStatistics?.inProgressParticipants }}
                </span>
                <span class="text-xs text-[#979899]">进行中</span>
              </div>
              <div
                class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
              >
                <span class="text-2xl font-bold text-[#FF9C05]">
                  {{ assessmentStatistics?.notStartedParticipants }}
                </span>
                <span class="text-xs text-[#979899]">未开始</span>
              </div>
            </div>

            <div class="scroll-area h-[200px] overflow-y-scroll">
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
                      {{ dept.completedParticipants }}/{{
                        dept.totalParticipants
                      }}
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

          <div v-else class="flex-center flex-1">
            <AEmpty />
          </div>
        </template>
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

:deep(.ant-progress-bg) {
  background-color: #04dc70 !important;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 35%);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 999px;
}
</style>
