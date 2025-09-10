<script setup lang="ts">
import { computed } from 'vue';

import { Button as AButton, Progress as AProgress } from 'ant-design-vue';

const props = defineProps<{
  pendingCount: number;
  successCount: number;
  total: number;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'complete'): void;
}>();

const percent = computed(() => {
  return Math.round((props.pendingCount / props.total) * 100);
});

const isCompleted = computed(() => {
  return props.pendingCount === props.total;
});

function handleAction() {
  if (isCompleted.value) {
    emit('complete');
  } else {
    emit('cancel');
  }
}
</script>

<template>
  <div
    class="flex w-[420px] flex-col rounded-xl border bg-white p-6 shadow-lg"
    style="z-index: 999"
  >
    <!-- 进度中状态 -->
    <div class="space-y-4">
      <span class="font-medium text-gray-800">正在导入学生信息</span>

      <div class="space-y-1">
        <AProgress
          :percent="percent"
          :show-info="false"
          :stroke-color="pendingCount === total ? '#04DC70' : '#1966FF'"
        />
        <div v-if="!isCompleted" class="text-center text-sm text-gray-600">
          <span>已处理 </span>
          <span class="font-semibold text-blue-600">{{ pendingCount }}</span>
          <span> / </span>
          <span class="font-semibold">{{ total }}</span>
          <span> 条记录</span>
          <span class="ml-2 text-blue-600">({{ percent }}%)</span>
        </div>
        <div v-else class="text-primary text-center text-sm">
          成功导入 {{ successCount }} 条
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="z-999 mt-6 flex justify-end">
      <AButton
        :type="isCompleted ? 'primary' : 'default'"
        @click="handleAction"
      >
        {{ isCompleted ? '完成' : '取消导入' }}
      </AButton>
    </div>
  </div>
</template>
