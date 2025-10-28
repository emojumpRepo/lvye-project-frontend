<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

defineProps<{
  closed: boolean;
  id?: number;
  name: string;
  status?: number;
  time: number;
}>();

const emits = defineEmits<{
  (e: 'handleQuickAssign', data: { id: number; type: string }): void;
}>();
</script>

<template>
  <div
    class="flex w-full flex-col items-center gap-0.5 rounded-lg bg-[#F7F8FA] p-2 text-sm"
  >
    <div class="flex items-center gap-1 whitespace-nowrap text-[#4C4C4D]">
      {{ name }}
      <IconifyIcon
        v-if="id && status !== 5 && !closed"
        icon="mynaui:edit"
        class="size-4 self-end text-[#4C4C4D] hover:text-[#1966FF]"
        @click="
          emits('handleQuickAssign', {
            id,
            type: 'REASSIGN_HANDLER',
          })
        "
      />
    </div>
    <span class="whitespace-nowrap text-[#979899]">
      {{ dayjs(time).format('YYYY-MM-DD') || '-' }}
    </span>
  </div>
</template>
