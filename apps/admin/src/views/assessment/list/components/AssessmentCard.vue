<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Divider, Progress } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

// 评估卡片数据接口
interface AssessmentCardData {
  completed: number;
  createTime: string;
  effectiveTime: string;
  id: string;
  progress: number;
  status: string;
  total: number;
}

const props = defineProps<{
  card: AssessmentCardData;
}>();

const router = useRouter();

// 计算实际完成度百分比
const completionPercentage = computed(() => {
  if (props.card.total === 0) return 0;
  return Math.round((props.card.completed / props.card.total) * 100);
});

// 根据状态获取状态颜色
const statusColor = computed(() => {
  switch (props.card.status) {
    case '已完成': {
      return '#04DC70';
    }
    case '待开始': {
      return '#979899';
    }
    case '进行中': {
      return '#1966FF';
    }
    default: {
      return '#1966FF';
    }
  }
});

// 处理查看详情点击事件
const handleViewDetail = () => {
  router.push(`/assessment/detail/${props.card.id}`);
};
</script>

<template>
  <div
    class="assessment-card rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
  >
    <!-- 卡片标题 -->
    <div class="mb-3 flex items-center justify-between">
      <span class="text-lg font-semibold text-gray-800">{{ card.id }}</span>
      <span
        class="rounded-full px-2 py-1 text-xs font-medium"
        :style="{ color: statusColor, backgroundColor: `${statusColor}1A` }"
      >
        {{ card.status }}
      </span>
    </div>

    <!-- 时间信息 -->
    <div class="mb-4 text-xs text-gray-500">
      <span>创建时间：{{ card.createTime }}</span>
      <Divider type="vertical" class="mx-2 bg-gray-200" />
      <span>有效期至{{ card.effectiveTime }}</span>
      <Divider type="vertical" class="mx-2 bg-gray-200" />
      <span class="rounded bg-green-50 px-2 py-1 font-medium text-green-600">
        初测问卷
      </span>
    </div>

    <!-- 进度条 -->
    <div class="mb-3">
      <Progress
        :percent="card.progress"
        stroke-color="#04DC70"
        :show-info="false"
        :size="6"
        class="mb-2"
      />
    </div>

    <!-- 完成度信息 -->
    <div class="mb-4 text-sm text-gray-600">
      已完成 {{ card.completed }} / {{ card.total }} ({{
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
  border: 1px solid #f0f0f0;
}

.assessment-card:hover {
  border-color: #d9d9d9;
}
</style>
