<script lang="ts" setup>
import type { CrisisEventRecord } from '@vben/types';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

import { getDictLabel } from '#/utils/dict';

const props = defineProps<{
  eventProcessingRecord: CrisisEventRecord;
}>();

const emits = defineEmits<{
  (e: 'edit', record: CrisisEventRecord): void;
}>();

const isHover = ref(false);

const recordContent = computed(() => {
  if (props.eventProcessingRecord.action === 'REASSIGN_HANDLER') {
    return `${props.eventProcessingRecord.content}，原因：${props.eventProcessingRecord.reason}`;
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
            dayjs(eventProcessingRecord.createTime).format(
              'YYYY-MM-DD HH:mm:ss',
            )
          }}
        </span>
      </div>
      <IconifyIcon
        v-if="eventProcessingRecord.action !== 'ASSIGN_HANDLER'"
        icon="mynaui:edit"
        :color="isHover ? '#1966FF' : '#666666'"
        class="size-5 cursor-pointer"
        @mouseenter="isHover = true"
        @mouseleave="isHover = false"
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
