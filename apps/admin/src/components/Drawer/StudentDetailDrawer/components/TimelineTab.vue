<script setup lang="ts">
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Divider, Empty } from 'ant-design-vue';
import dayjs from 'dayjs';

import QuestionnaireResultDialog from '#/components/Dialog/QuestionnaireResultDialog/index.vue';
import { getDictLabel } from '#/utils/dict';

const props = defineProps<{
  studentProfileTimeline: PsychologyStudentProfileApi.StudentProfileTimeline[];
  timelineTabs: { key: number; title: string }[];
}>();

const [QuestionnaireResultDialogModal, questionnaireResultDialogModalApi] =
  useVbenModal({
    connectedComponent: QuestionnaireResultDialog,
  });

const activeTimelineKey = defineModel<number>('activeTimelineKey');

const timelineList = computed(() => {
  if (!activeTimelineKey.value) return props.studentProfileTimeline;
  return props.studentProfileTimeline.filter(
    (item) => item.eventType === activeTimelineKey.value,
  );
});
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4">
    <template v-if="timelineList.length > 0">
      <div class="flex items-center gap-2 px-4">
        <span
          v-for="tab in timelineTabs"
          :key="tab.key"
          class="cursor-pointer rounded-full px-3 py-1 text-xs"
          :class="
            activeTimelineKey === tab.key
              ? 'bg-[#04DC70] text-white'
              : 'text-[#979899]'
          "
          @click="activeTimelineKey = tab.key"
        >
          {{
            tab.key === 0
              ? '全部'
              : getDictLabel('student_timeline_event_type', tab.key)
          }}
        </span>
      </div>
      <div class="w-full flex-1 space-y-4 overflow-y-auto px-4">
        <div
          class="relative flex h-[85px] items-start"
          v-for="timeline in timelineList"
          :key="timeline.id"
        >
          <div class="absolute left-0 top-0 flex flex-col items-center gap-2">
            <span class="size-2 rounded-full bg-[#04DC70]"></span>
            <Divider type="vertical" class="h-[75px] bg-[#EAEBED]" />
          </div>
          <div
            class="ml-6 box-border flex h-full w-full flex-col justify-between overflow-hidden rounded-xl bg-[#F7F8FA] p-4"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="rounded bg-[#14E77E1F] p-1 text-[#04DC70]">
                {{ timeline.title }}
              </span>
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap text-[#B0B1B2]">
                  {{ dayjs(timeline.createTime).format('YYYY-MM-DD') }}
                </span>
                <span class="whitespace-nowrap text-xs text-[#B0B1B2]">
                  {{ timeline.operator || '未知操作人' }}
                </span>
              </div>
            </div>
            <div class="line-clamp-2 text-xs text-[#979899]">
              {{ timeline.content || '暂无内容' }}
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <Empty description="暂无数据" />
    </template>

    <QuestionnaireResultDialogModal />
  </div>
</template>
