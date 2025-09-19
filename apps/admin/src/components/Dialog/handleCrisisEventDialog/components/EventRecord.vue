<script lang="ts" setup>
import type { CrisisEventRecord } from '@vben/types';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

defineProps<{
  eventProcessingRecord: CrisisEventRecord;
}>();

const emits = defineEmits<{
  (e: 'edit'): void;
}>();

const isHover = ref(false);
</script>

<template>
  <div class="mr-1 space-y-3 rounded-xl bg-[#F7F8FA] p-4 text-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-bold">{{ eventProcessingRecord.action }}</span>
        <span class="text-xs text-[#979899]">
          {{
            dayjs(eventProcessingRecord.createTime).format(
              'YYYY-MM-DD HH:mm:ss',
            )
          }}
        </span>
      </div>
      <IconifyIcon
        icon="mynaui:edit"
        :color="isHover ? '#1966FF' : '#666666'"
        class="size-5 cursor-pointer"
        @mouseenter="isHover = true"
        @mouseleave="isHover = false"
        @click="emits('edit')"
      />
    </div>

    <div class="line-clamp-2 text-[#17191A]">
      {{ eventProcessingRecord.content }}
    </div>
    <div class="text-[#04DC70]">{{ eventProcessingRecord.operatorName }}</div>
  </div>
</template>
