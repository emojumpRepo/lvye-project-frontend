<script setup lang="ts">
import type { CrisisEvent, CrisisEventRecord } from '@vben/types';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Textarea as ATextarea, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { updateCrisisEventDescription } from '#/api/psychology/crisis';
import EditEventRecordDialog from '#/components/Dialog/EditEventRecordDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { getDictLabel } from '#/utils/dict';

import EventRecord from './EventRecord.vue';

const props = defineProps<{
  crisisEventDetail: CrisisEvent;
  crisisEventProcessHistory: CrisisEventRecord[];
}>();

const emit = defineEmits<{
  (e: 'loadCrisisEventDetail', id: number): void;
  (e: 'loadCrisisEventProcessHistory', id: number): void;
  (e: 'setLoading', loading: boolean): void;
}>();

const eventDescription = ref('');
const isEditingDescription = ref(false);

const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  connectedComponent: EditEventRecordDialog,
  destroyOnClose: true,
});

// 事件基本信息 - 合成一个 computed 处理
const eventBaseInfo = computed(() => {
  const detail = props.crisisEventDetail;
  if (!detail) return [];

  const formatValue = (key: string, value: any) => {
    switch (key) {
      case 'priority': {
        return value ? getDictLabel('crisis_event_priority', value) : '--';
      }
      case 'reportedAt': {
        return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
      }
      case 'status': {
        return value ? getDictLabel('crisis_event_status', value) : '--';
      }
      case 'urgencyLevel': {
        return value ? getDictLabel('crisis_event_priority', value) : '--';
      }
      default: {
        return value || '--';
      }
    }
  };

  // 事件基本信息配置
  const baseInfoConfig = [
    { label: '事件编号', key: 'eventId' },
    { label: '优先级别', key: 'priority' },
    { label: '学生姓名', key: 'studentName' },
    { label: '所在班级', key: 'className' },
    { label: '上报人员', key: 'reporterName' },
    { label: '上报时间', key: 'reportedAt' },
    { label: '当前状态', key: 'status' },
  ];

  return baseInfoConfig.map((item) => ({
    ...item,
    value: formatValue(item.key, detail[item.key as keyof CrisisEvent]),
  }));
});

/** 保存编辑描述 */
async function handleEditDescription() {
  if (!isEditingDescription.value) {
    isEditingDescription.value = true;
    return;
  }

  emit('setLoading', true);
  isEditingDescription.value = false;
  if (!props.crisisEventDetail?.id) {
    message.error('事件ID不存在');
    return;
  }
  try {
    const result = await updateCrisisEventDescription(
      props.crisisEventDetail.id,
      eventDescription.value,
    );
    if (result) {
      message.success('更新描述成功');
      emit('loadCrisisEventDetail', props.crisisEventDetail.id);
      emit('loadCrisisEventProcessHistory', props.crisisEventDetail.id);
    } else {
      message.error('更新描述失败');
    }
  } catch (error) {
    console.error('更新描述失败', error);
    message.error('更新描述失败');
  } finally {
    emit('setLoading', false);
  }
}

/** 取消编辑描述 */
function handleCancelEditDescription() {
  isEditingDescription.value = false;
  eventDescription.value = props.crisisEventDetail?.description ?? '';
}

// 监听描述信息变化
watch(
  () => props.crisisEventDetail?.description,
  (newDescription) => {
    if (newDescription) {
      eventDescription.value = newDescription;
    }
  },
  { immediate: true },
);

/** 修改处理记录 */
function handleEditEventRecord(record: CrisisEventRecord) {
  editEventRecordApi
    .setData({
      id: record.id,
      title: getDictLabel('crisis_event_action', record.action ?? '编辑记录'),
      type: record.action,
    })
    .open();
}
</script>

<template>
  <div class="grid h-full w-[1000px] grid-cols-2 grid-rows-2 gap-6">
    <!-- 事件基本信息 -->
    <div class="row-span-1">
      <div class="flex h-full flex-col justify-between gap-3">
        <LyLabel has-indicator title="事件基本信息" />
        <div
          class="flex flex-1 flex-col justify-between rounded-xl bg-[#F7F8FA] p-4"
        >
          <div v-for="item in eventBaseInfo" :key="item.key" class="text-sm">
            <span class="font-bold">{{ item.label }}：</span>
            <span>{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件处理记录 -->
    <div class="row-span-2 h-full">
      <div class="flex h-full flex-col justify-between gap-3">
        <LyLabel has-indicator title="处理记录" />
        <div class="scroll-area h-full space-y-4 overflow-y-auto">
          <template
            v-for="record in crisisEventProcessHistory"
            :key="record.id"
          >
            <EventRecord
              :event-processing-record="record"
              @edit="handleEditEventRecord"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- 事件描述 -->
    <div class="row-span-1">
      <div class="flex h-full flex-col gap-3">
        <div class="flex items-center justify-between">
          <LyLabel has-indicator title="事件描述" />
          <div class="flex items-center gap-1">
            <LyButton
              v-if="isEditingDescription"
              type="default"
              size="small"
              @click="handleCancelEditDescription"
            >
              取消
            </LyButton>
            <LyButton
              type="success"
              size="small"
              @click="handleEditDescription"
            >
              {{ isEditingDescription ? '保存' : '编辑' }}
            </LyButton>
          </div>
        </div>
        <div class="flex-1">
          <ATextarea
            v-model:value="eventDescription"
            placeholder="请输入事件描述"
            :disabled="!isEditingDescription"
          />
        </div>
      </div>
    </div>

    <EditEventRecordModal />
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-input) {
  height: 100%;
}

textarea {
  resize: none;
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
