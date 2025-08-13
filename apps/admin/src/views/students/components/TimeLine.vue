<script setup lang="ts">
import { ref } from 'vue';

import { Divider } from 'ant-design-vue';

const tabs = ref([
  {
    label: '全部',
    value: 'all',
  },
  {
    label: '测评记录',
    value: 'record',
  },
  {
    label: '咨询记录',
    value: 'consult',
  },
  {
    label: '干预事件',
    value: 'event',
  },
]);

const currentTab = ref('all');

const studentInfo = ref([
  {
    createTime: '2024-01-01',
    name: '李老师',
    content:
      '将学生状态从"严重"调整为"一般", 原因:经过干斤斤计较斤斤计较急急急斤斤计较斤斤计较急急急斤斤计较急急急急急急急急急斤斤计较急急急急急急斤斤计较斤斤计较',
  },
  {
    createTime: '2024-01-01',
    name: '李老师',
    content:
      '将学生状态从"严重"调整为"一般", 原因:经过干斤斤计较斤斤计较急急急斤斤计较斤斤计较急急急斤斤计较急急急急急急急急急斤斤计较急急急急急急斤斤计较斤斤计较',
  },
  {
    createTime: '2024-01-01',
    name: '李老师',
    content:
      '将学生状态从"严重"调整为"一般", 原因:经过干斤斤计较斤斤计较急急急斤斤计较斤斤计较急急急斤斤计较急急急急急急急急急斤斤计较急急急急急急斤斤计较斤斤计较',
  },
  {
    createTime: '2024-01-01',
    name: '李老师',
    content:
      '将学生状态从"严重"调整为"一般", 原因:经过干斤斤计较斤斤计较急急急斤斤计较斤斤计较急急急斤斤计较急急急急急急急急急斤斤计较急急急急急急斤斤计较斤斤计较',
  },
  {
    createTime: '2024-01-01',
    name: '李老师',
    content:
      '将学生状态从"严重"调整为"一般", 原因:经过干斤斤计较斤斤计较急急急斤斤计较斤斤计较急急急斤斤计较急急急急急急急急急斤斤计较急急急急急急斤斤计较斤斤计较',
  },
]);
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4">
    <!-- tab栏 -->
    <div class="flex items-center gap-2 px-4">
      <span
        v-for="tab in tabs"
        :key="tab.value"
        class="cursor-pointer rounded-full px-3 py-1 text-xs"
        :class="
          currentTab === tab.value
            ? 'bg-[#04DC70] text-white'
            : 'text-[#979899]'
        "
        @click="currentTab = tab.value"
      >
        {{ tab.label }}
      </span>
    </div>

    <!-- 时间线 -->
    <div class="w-full flex-1 space-y-4 overflow-y-auto px-4">
      <div
        class="relative flex items-start"
        v-for="student in studentInfo"
        :key="student.createTime"
      >
        <div class="absolute left-0 top-0 flex flex-col items-center gap-2">
          <span class="size-2 rounded-full bg-[#04DC70]"></span>
          <Divider type="vertical" class="h-[130px] bg-[#EAEBED]" />
        </div>
        <div
          class="ml-6 box-border flex w-full flex-col gap-3 overflow-hidden rounded-xl bg-[#F7F8FA] p-4"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="rounded bg-[#14E77E1F] p-1 text-[#04DC70]">
              沟通记录
            </span>
            <span class="text-[#B0B1B2]"> {{ student.createTime }} </span>
          </div>
          <div class="text-bold text-sm">{{ student.name }}</div>
          <div class="truncate text-xs text-[#979899]">
            {{ student.content }}
          </div>
          <div class="cursor-pointer text-xs text-[#1966FF]">查看详情</div>
        </div>
      </div>
    </div>
  </div>
</template>
