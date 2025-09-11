<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Textarea as ATextarea } from 'ant-design-vue';

import EditEventRecord from '#/components/Dialog/EditEventRecord.vue/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

import EventRecord from './EventRecord.vue';

const eventDescription = ref('');

const [EditEventRecordModal, editEventRecordApi] = useVbenModal({
  connectedComponent: EditEventRecord,
  destroyOnClose: true,
});

// 事件基本信息
const eventBaseInfo = ref([
  {
    label: '事件编号',
    value: 'CRI-2024-001',
    key: 'eventId',
  },
  {
    label: '优先级别',
    value: '高',
    key: 'priority',
  },
  {
    label: '学生姓名',
    value: '张晓明',
    key: 'studentName',
  },
  {
    label: '所在班级',
    value: '高一（3）班',
    key: 'className',
  },
  {
    label: '上报人员',
    value: '李数学老师',
    key: 'operator',
  },
  {
    label: '上报时间',
    value: 1_757_579_007_000,
    key: 'reportTime',
  },
  {
    label: '当前状态',
    value: '处理中',
    key: 'status',
  },
]);

// 事件处理记录
const eventProcessingRecords = ref([
  {
    id: 1,
    title: '事件上报',
    time: 1_757_579_007_000,
    content: '学生在数学课上突然情绪激动，用笔划伤手臂，立即上报',
    operator: '李数学老师',
  },
  {
    id: 1,
    title: '事件上报',
    time: 1_757_579_007_000,
    content: '学生在数学课上突然情绪激动，用笔划伤手臂，立即上报',
    operator: '李数学老师',
  },
  {
    id: 1,
    title: '事件上报',
    time: 1_757_579_007_000,
    content: '学生在数学课上突然情绪激动，用笔划伤手臂，立即上报',
    operator: '李数学老师',
  },
  {
    id: 1,
    title: '事件上报',
    time: 1_757_579_007_000,
    content: '学生在数学课上突然情绪激动，用笔划伤手臂，立即上报',
    operator: '李数学老师',
  },
  {
    id: 1,
    title: '事件上报',
    time: 1_757_579_007_000,
    content: '学生在数学课上突然情绪激动，用笔划伤手臂，立即上报',
    operator: '李数学老师',
  },
]);

/** 快速分配 */
function handleEditEventRecord() {
  editEventRecordApi
    .setData({
      type: 'edit',
    })
    .open();
}
</script>

<template>
  <div class="grid h-full grid-cols-2 grid-rows-2 gap-6">
    <!-- 事件基本信息 -->
    <div class="row-span-1">
      <div class="flex h-full flex-col justify-between gap-3">
        <LyLabel has-indicator title="事件基本信息" />
        <div
          class="flex flex-1 flex-col justify-between rounded-xl bg-[#F7F8FA] p-4"
        >
          <div v-for="item in eventBaseInfo" :key="item.key">
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
        <div class="flex-1 overflow-hidden">
          <div class="h-full space-y-4 overflow-y-auto">
            <template v-for="record in eventProcessingRecords" :key="record.id">
              <EventRecord
                :event-processing-record="record"
                @edit="handleEditEventRecord"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件描述 -->
    <div class="row-span-1">
      <div class="flex h-full flex-col gap-3">
        <LyLabel has-indicator title="事件描述" />
        <!-- <div class="flex-1 rounded-xl bg-[#F7F8FA] p-4 leading-normal">
          学生在课堂上情绪异常激动,出现自伤倾向,老师观察到其用笔划伤手
          臂,需要立即关注和专业处理
        </div> -->
        <div class="flex-1">
          <ATextarea
            v-model:value="eventDescription"
            placeholder="请输入事件描述"
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
</style>
