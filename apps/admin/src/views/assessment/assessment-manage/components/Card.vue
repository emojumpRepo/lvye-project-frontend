<script lang="ts" setup>
import { Divider, Progress } from 'ant-design-vue';

defineProps<{
  assessment: {
    completed: number;
    createTime: string;
    effectiveTime: string;
    id: string;
    progress: number;
    status: string;
    total: number;
  };
}>();
</script>

<template>
  <div class="rounded-xl bg-white p-4">
    <!-- 卡片标题 -->
    <div class="mb-2 flex items-center justify-between">
      <span class="font-bold">{{ assessment.id }}</span>
      <span class="text-sm text-[#1966FF]">{{ assessment.status }}</span>
    </div>

    <!-- 有效期 -->
    <div class="text-xs text-[#979899]">
      <span>创建时间：{{ assessment.createTime }}</span>
      <Divider type="vertical" class="mx-2 bg-[#EAEBED]" />
      <span>有效期至{{ assessment.effectiveTime }}</span>
      <Divider type="vertical" class="mx-2 bg-[#EAEBED]" />
      <span class="rounded bg-[#14E77E1F] p-1 text-[#04DC70]"> 初测问卷 </span>
    </div>

    <!-- 进度条 -->
    <div class="my-4">
      <Progress
        :percent="assessment.progress"
        stroke-color="#04DC70"
        :show-info="false"
        :size="5"
      />
    </div>

    <!-- 完成度 -->
    <div class="text-xs text-[#4C4C4D]">
      已完成 {{ assessment.completed }} / {{ assessment.total }} (0%)
    </div>

    <!-- 查看详情 -->
    <div class="mt-5 flex justify-end">
      <button
        class="rounded-lg bg-[#04DC70] px-5 py-2 text-white hover:bg-[#04DC70]/80"
      >
        查看详情
      </button>
    </div>
  </div>
</template>
