<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Copy } from '@vben/icons';
import { getStatusColor, getStatusLabel } from '@vben/types';

import { Divider, message, Progress, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import LyButton from '#/components/LyButton/index.vue';

const props = defineProps<{
  card: AssessmentTask;
}>();

const router = useRouter();

// 计算实际完成度百分比
const completionPercentage = computed(() => {
  if (props.card.totalNum === 0) return 0;
  return Math.round((props.card.finishNum ?? 0) / (props.card.totalNum ?? 0));
});

async function handleCopyTaskNo() {
  try {
    await navigator.clipboard.writeText(props.card.taskNo ?? '');
    message.success('复制成功');
  } catch (error) {
    console.error(error);
    message.error('复制失败');
  }
}

// 处理查看详情点击事件
function handleViewDetail() {
  router.push(`/assessment/detail/${props.card.taskNo}`);
}
</script>

<template>
  <div
    class="assessment-card rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
  >
    <!-- 卡片标题 -->
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2 text-gray-800">
        <span class="text-lg font-semibold">{{
          card.taskNo?.split('_')[1] ?? ''
        }}</span>
        <Copy
          class="size-3 cursor-pointer text-gray-300 transition-all duration-200 hover:text-gray-500"
          @click="handleCopyTaskNo"
        />
      </div>
      <Tag :color="getStatusColor(card.status, 'assessment')">
        {{ getStatusLabel(card.status, 'assessment') }}
      </Tag>
    </div>

    <!-- 时间信息 -->
    <div class="mb-4 text-xs text-gray-500">
      <span>创建时间：{{ dayjs(card.createTime).format('YYYY-MM-DD') }}</span>
      <Divider type="vertical" class="mx-2 bg-gray-200" />
      <span>有效期至{{ dayjs(card.deadline).format('YYYY-MM-DD') }}</span>
    </div>

    <!-- 进度条 -->
    <div class="mb-3">
      <Progress
        :percent="completionPercentage"
        stroke-color="#04DC70"
        :show-info="false"
        :size="6"
        class="mb-2"
      />
    </div>

    <!-- 完成度信息 -->
    <div class="mb-4 text-sm text-gray-600">
      已完成 {{ card.finishNum }} / {{ card.totalNum }} ({{
        completionPercentage
      }}%)
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-end">
      <LyButton type="success" size="middle" @click="handleViewDetail">
        查看详情
      </LyButton>
    </div>
  </div>
</template>

<style scoped>
.assessment-card {
  user-select: none;
  border: 1px solid #f0f0f0;
}

.assessment-card:hover {
  border-color: #d9d9d9;
}
</style>
