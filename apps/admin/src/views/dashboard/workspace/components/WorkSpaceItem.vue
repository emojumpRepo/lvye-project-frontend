<script setup lang="ts">
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { ref } from 'vue';

import dayjs from 'dayjs';

// 通过 props 接收学生信息数据
const props = defineProps<{
  studentInfo?: PsychologyStudentProfileApi.StudentProfile;
}>();

// 定义事件
const emit = defineEmits<{
  click: [studentInfo: PsychologyStudentProfileApi.StudentProfile];
}>();

// 格式化时间显示
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 悬停状态
const isHovered = ref(false);

// 处理卡片点击
const handleClick = () => {
  emit('click', props.studentInfo);
};
</script>

<template>
  <div
    class="rounded-3 min-w-75 max-w-85 ease relative cursor-pointer overflow-hidden bg-white p-5 transition-all duration-300"
    :class="[
      isHovered
        ? '-translate-y-0.5 border border-blue-200 shadow-xl'
        : 'border border-gray-200 shadow-sm',
    ]"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 顶部装饰条 -->
    <div
      class="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-400 to-purple-500"
    ></div>

    <!-- 卡片头部 -->
    <div class="mb-4 flex items-start justify-between">
      <div class="flex-1">
        <div class="text-5 mb-2 font-bold text-gray-900">
          {{ props.studentInfo.name }}
        </div>
        <div
          class="text-3.5 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-medium text-blue-700"
        >
          {{ props.studentInfo.className }}
        </div>
      </div>
      <div class="flex items-center">
        <div
          class="ease h-3 w-3 rounded-full transition-all duration-300"
          :class="[
            isHovered
              ? 'bg-green-500 shadow-lg shadow-green-500/30'
              : 'bg-green-400 shadow-md shadow-green-500/20',
          ]"
        ></div>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center">
        <div class="flex w-full items-center gap-3">
          <div
            class="rounded-2 ease flex h-8 w-8 flex-shrink-0 items-center justify-center transition-colors duration-300"
            :class="[isHovered ? 'bg-blue-50' : 'bg-gray-50']"
          >
            <div class="h-4 w-4 text-gray-400">👤</div>
          </div>
          <div class="flex-1">
            <span
              class="text-3 mb-1 block font-medium uppercase tracking-wider text-gray-500"
            >
              负责人
            </span>
            <span class="text-3.5 block font-semibold text-gray-800">
              {{ props.studentInfo?.updater }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center">
        <div class="flex w-full items-center gap-3">
          <div
            class="rounded-2 ease flex h-8 w-8 flex-shrink-0 items-center justify-center transition-colors duration-300"
            :class="[isHovered ? 'bg-blue-50' : 'bg-gray-50']"
          >
            <div class="h-4 w-4 text-gray-400">🕒</div>
          </div>
          <div class="flex-1">
            <span class="text-3.5 font-mono text-gray-500">
              {{
                dayjs(props.studentInfo?.createTime).format(
                  'YYYY-MM-DD HH:mm:ss',
                )
              }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
