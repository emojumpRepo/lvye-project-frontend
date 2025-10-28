<script lang="ts" setup>
import type { CrisisEventRecord } from '@vben/types';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import CrisisAttachmentsDialog from '#/components/Dialog/CrisisAttachmentsDialog/index.vue';
import { getDictLabel } from '#/utils/dict';

const props = defineProps<{
  closed: boolean;
  crisisEventStatus: number;
  eventProcessingRecord: CrisisEventRecord;
}>();

const emits = defineEmits<{
  (e: 'edit', record: CrisisEventRecord): void;
  (e: 'viewAssessmentResult', taskResultId: number): void;
  (e: 'viewRecordAssessmentReport', recordId: number): void;
}>();

const [CrisisAttachmentsModal, crisisAttachmentsModalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: CrisisAttachmentsDialog,
});

/** 记录内容 */
const recordContent = computed(() => {
  if (
    ['CHOOSE_PROCESS', 'REASSIGN_HANDLER'].includes(
      props.eventProcessingRecord.action ?? '',
    )
  ) {
    return `${props.eventProcessingRecord.content}，原因：${props.eventProcessingRecord.reason}`;
  } else if (
    props.eventProcessingRecord.action === 'STAGE_ASSESSMENT' ||
    props.eventProcessingRecord.action === 'CLOSE' ||
    props.eventProcessingRecord.action === 'REPORT'
  ) {
    return `${props.eventProcessingRecord.reason}`;
  }
  if (props.eventProcessingRecord.reason) {
    return `${props.eventProcessingRecord.content}，${props.eventProcessingRecord.reason}`;
  }
  return props.eventProcessingRecord.content;
});

/** 查看附件 */
function handleViewAttachments() {
  crisisAttachmentsModalApi
    .setData({
      attachmentIds: props.eventProcessingRecord.attachmentIds,
    })
    .open();
}

/** 查看报告 */
function viewRecord() {
  const { action, taskResultId, assessmentId } = props.eventProcessingRecord;
  if (action === 'CREATE_ASSESSMENT' && taskResultId) {
    if (!taskResultId) {
      return message.error('暂无报告');
    }
    emits('viewAssessmentResult', taskResultId);
  } else if (action === 'CLOSE' || action === 'STAGE_ASSESSMENT') {
    if (!assessmentId) {
      return message.error('暂无报告');
    }
    emits('viewRecordAssessmentReport', assessmentId || 0);
  } else {
    return message.error('暂无报告');
  }
}
</script>

<template>
  <div class="mr-1 space-y-2 rounded-xl bg-[#F7F8FA] p-4 text-sm">
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
        <IconifyIcon
          v-if="
            !closed &&
            [
              'CHOOSE_PROCESS',
              'REASSIGN_HANDLER',
              'REPORT',
              'UPDATE_DESCRIPTION',
            ].includes(eventProcessingRecord!.action!) &&
            crisisEventStatus !== 6
          "
          icon="mynaui:edit"
          class="size-4 cursor-pointer text-[#666666] hover:text-[#1966FF]"
          @click="emits('edit', eventProcessingRecord)"
        />
      </div>
      <!-- 查看报告 -->
      <div
        v-if="
          (eventProcessingRecord.action === 'CREATE_ASSESSMENT' &&
            eventProcessingRecord.taskResultId) ||
          eventProcessingRecord.action === 'CLOSE' ||
          eventProcessingRecord.action === 'STAGE_ASSESSMENT'
        "
        class="flex cursor-pointer items-center gap-1"
        @click="viewRecord"
      >
        <IconifyIcon icon="mdi:eye" color="#1966FF" class="size-4" />
        <span class="text-[#1966FF]"> 报告 </span>
      </div>
      <!-- 上报附件 -->
      <div
        v-if="
          eventProcessingRecord.attachmentIds &&
          eventProcessingRecord.attachmentIds.length > 0 &&
          eventProcessingRecord.action === 'REPORT'
        "
        class="flex cursor-pointer items-center gap-1"
        @click="handleViewAttachments"
      >
        <IconifyIcon icon="si:attachment-line" color="#1966FF" class="size-4" />
        <span class="text-[#1966FF]"> 附件 </span>
      </div>
    </div>

    <div class="line-clamp-2 leading-6 text-[#17191A]">
      <span>
        {{ recordContent }}
      </span>
    </div>

    <div class="text-[#04DC70]">{{ eventProcessingRecord.operatorName }}</div>

    <CrisisAttachmentsModal />
  </div>
</template>
