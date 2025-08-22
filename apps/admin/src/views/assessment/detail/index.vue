<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Tag } from 'ant-design-vue';

import { getAssessmentTask } from '#/api/psychology/assessment';
import LyButton from '#/components/LyButton/index.vue';

import AssessmentDetailList from './components/AssessmentDetailList.vue';

const actionButton = ref([
  {
    label: '发布提醒',
    value: 'publish',
  },
  {
    label: '延长时间',
    value: 'extend',
  },
  {
    label: '提前结束',
    value: 'end',
  },
  {
    label: '导出数据',
    value: 'export',
  },
]);

const activeButton = ref('');
const route = useRoute();
const router = useRouter();
const taskNo = String(route.params.taskNo || '');

// 任务信息数据
const taskInfo = ref<TaskInfo>({
  task: {
    createTime: '',
    endTime: '',
    questionnaireName: '',
    status: '',
    taskNo: '',
  },
  participate: { completed: 0, completionRate: 0, total: 0 },
  riskDistribution: { attention: 0, highRisk: 0, normal: 0, warning: 0 },
});

const loading = ref(false);

const activeTabKey = ref('default');
const tabs = ref([
  {
    label: '测评任务',
    key: 'default',
  },
]);

// 加载任务数据
async function loadTaskData() {
  if (!taskNo) return;

  try {
    loading.value = true;

    // 获取任务基本信息
    const taskInfo = await getAssessmentTask(taskNo);
    if (taskInfo.questionnaires) {
      const questionnairesTabs = taskInfo.questionnaires.map((item) => ({
        label: item.title,
        key: item.id.toString(),
      }));
      tabs.value = [...tabs.value, ...questionnairesTabs];
    }
  } catch (error) {
    console.error('Failed to load task data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (taskNo) {
    loadTaskData();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <a-tabs v-model:active-key="activeTabKey">
      <a-tab-pane v-for="tab in tabs" :key="tab.key">
        <template #tab>
          <span v-if="tab.key === 'default'">
            <Tag color="green">整体</Tag>
            {{ tab.label }}
          </span>
          <span v-else>
            <Tag color="orange">问卷</Tag>
            {{ tab.label }}
          </span>
        </template>
        <template v-if="tab.key === 'default'">
          <div></div>
        </template>
        <template v-else> </template>
        <!-- 统计卡片区域 -->
        <!-- <AssessmentDetailTask :task-info="taskInfo" :loading="loading" /> -->

        <!-- 年级班级对比区域 -->
        <!-- <AssessmentDetailCompare /> -->
      </a-tab-pane>
      <template #leftExtra>
        <div class="mr-6">
          <LyButton size="middle" type="default" @click="router.back()">
            返回
          </LyButton>
        </div>
      </template>
      <template #rightExtra>
        <div class="space-x-2">
          <LyButton
            v-for="item in actionButton"
            :key="item.value"
            size="middle"
            type="default"
            @click="activeButton = item.value"
          >
            {{ item.label }}
          </LyButton>
        </div>
      </template>
    </a-tabs>

    <!-- 年级管理区域 -->
    <AssessmentDetailList />
  </div>
</template>
