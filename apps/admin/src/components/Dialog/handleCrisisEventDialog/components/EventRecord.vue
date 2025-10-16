<script lang="ts" setup>
import type { CrisisEventRecord } from '@vben/types';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

import LyButton from '#/components/LyButton/index.vue';
import { getDictLabel } from '#/utils/dict';

const props = defineProps<{
  crisisEventStatus: number;
  eventProcessingRecord: CrisisEventRecord;
}>();

const emits = defineEmits<{
  (e: 'edit', record: CrisisEventRecord): void;
  (e: 'viewAssessmentResult', taskResultId: number): void;
}>();

const recordContent = computed(() => {
  if (
    ['CHOOSE_PROCESS', 'REASSIGN_HANDLER'].includes(
      props.eventProcessingRecord.action ?? '',
    )
  ) {
    return `${props.eventProcessingRecord.content}，原因：${props.eventProcessingRecord.reason}`;
  } else if (
    props.eventProcessingRecord.action === 'STAGE_ASSESSMENT' ||
    props.eventProcessingRecord.action === 'CLOSE'
  ) {
    return `${props.eventProcessingRecord.reason}`;
  }
  if (props.eventProcessingRecord.reason) {
    return `${props.eventProcessingRecord.content}，${props.eventProcessingRecord.reason}`;
  }
  return props.eventProcessingRecord.content;
});
</script>

<template>
  <div class="mr-1 space-y-3 rounded-xl bg-[#F7F8FA] p-4 text-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-bold">
          {{
            getDictLabel('crisis_event_action', eventProcessingRecord.action)
          }}
        </span>
        <span class="text-xs text-[#979899]">
          {{
            dayjs(eventProcessingRecord.operateTime).format(
              'YYYY-MM-DD HH:mm:ss',
            )
          }}
        </span>
      </div>
      <!-- 查看报告 -->
      <LyButton
        v-if="
          eventProcessingRecord.action === 'CREATE_ASSESSMENT' &&
          eventProcessingRecord.taskResultId
        "
        type="success"
        ghost
        size="small"
        @click="
          emits('viewAssessmentResult', eventProcessingRecord.taskResultId)
        "
      >
        查看报告
      </LyButton>
      <IconifyIcon
        v-if="
          [
            'CHOOSE_PROCESS',
            'REASSIGN_HANDLER',
            'REPORT',
            'UPDATE_DESCRIPTION',
          ].includes(eventProcessingRecord!.action!) && crisisEventStatus !== 6
        "
        icon="mynaui:edit"
        class="size-5 cursor-pointer text-[#666666] hover:text-[#1966FF]"
        @click="emits('edit', eventProcessingRecord)"
      />
    </div>

    <div class="line-clamp-2 text-[#17191A]">
      <span>
        {{ recordContent }}
      </span>
    </div>
    <div class="text-[#04DC70]">{{ eventProcessingRecord.operatorName }}</div>
  </div>
</template>
