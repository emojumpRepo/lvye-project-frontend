<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import {
  Divider as ADivider,
  Radio as ARadio,
  Tabs as ATabs,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getTagByCategory } from '#/api/constants';
import { getAssessmentTask } from '#/api/psychology/assessment';
import LyButton from '#/components/LyButton/index.vue';

import AssessmentDetailCompare from './components/AssessmentDetailCompare.vue';
import AssessmentDetailList from './components/AssessmentDetailList.vue';
import AssessmentDetailTask from './components/AssessmentDetailTask.vue';

interface TabItem {
  key: string;
  label: string;
}

interface TaskInfo {
  taskNo: string;
  taskName: string;
  status: number;
  startline: number;
  deadline: number;
  questionnairesTabs: TabItem[];
}

const classType = ref<TabItem[]>([
  { label: '全部', key: 'all' },
  { label: '年级', key: 'grade' },
  { label: '班级', key: 'class' },
]);

const actionButtons = ref([
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
const activeType = ref('all');
const route = useRoute();
const router = useRouter();
const taskNo = String(route.params.taskNo || '');

const loading = ref(false);

const currentTaskInfo = ref<TaskInfo>();
const activeTabKey = ref<TabItem>({
  key: '',
  label: '',
});

const taskStatusTag = computed(() => {
  if (!currentTaskInfo.value) {
    return null;
  }
  const tag = getTagByCategory(
    'assessment_task_status',
    currentTaskInfo.value.status,
  );
  return {
    label: tag?.label,
    color: tag?.tagStyle.color,
  };
});

/**
 * 截取字符串
 * @param text 字符串
 * @param maxLength 最大长度
 */
function truncateText(
  text: string | undefined,
  maxLength: number = 10,
): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

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
      currentTaskInfo.value = {
        taskNo: taskInfo.taskNo || '',
        taskName: taskInfo.taskName,
        status: taskInfo.status,
        startline: taskInfo.startline || 0,
        deadline: taskInfo.deadline || 0,
        questionnairesTabs,
      };
      activeTabKey.value = currentTaskInfo.value?.questionnairesTabs[0] || {
        key: '',
        label: '',
      };
    }
  } catch (error) {
    console.error('Failed to load task data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (taskNo) {
    loadTaskData();
  }
});
</script>

<template>
  <div class="flex min-h-screen flex-col gap-4 p-6">
    <!-- nav -->
    <div class="flex flex-wrap items-center justify-between gap-6">
      <!-- 任务信息 -->
      <div
        class="flex flex-1 items-center justify-between rounded-xl bg-[#FFFFFF99] p-4 text-sm text-[#000000A6]"
      >
        <div class="flex flex-nowrap items-center gap-2">
          <IconifyIcon
            icon="mdi:information"
            :color="taskStatusTag?.color"
            class="size-5"
          />
          <span class="truncate">{{
            truncateText(currentTaskInfo?.taskName, 10)
          }}</span>
          <ADivider type="vertical" class="h-4" />
          <span class="truncate"> 任务：{{ currentTaskInfo?.taskNo }} </span>
          <ADivider type="vertical" class="h-4" />
          <span class="truncate"> 测评量表：{{ activeTabKey?.label }} </span>
          <ADivider type="vertical" class="h-4" />
          <span class="truncate">
            创建时间：{{
              dayjs(currentTaskInfo?.startline).format('YYYY-MM-DD')
            }}
          </span>
          <ADivider type="vertical" class="h-4" />
          <span class="!truncate">
            截止时间：{{
              dayjs(currentTaskInfo?.deadline).format('YYYY-MM-DD')
            }}
          </span>
        </div>
        <div class="ml-4 truncate" :class="`text-[${taskStatusTag?.color}]`">
          {{ taskStatusTag?.label }}
        </div>
      </div>
      <!-- 操作按钮 -->
      <div class="space-x-2">
        <LyButton
          v-for="item in actionButtons"
          :key="item.value"
          size="middle"
          type="default"
          @click="activeButton = item.value"
        >
          {{ item.label }}
        </LyButton>
      </div>
    </div>

    <!-- 问卷Tabs -->
    <ATabs v-model:active-key="activeTabKey.key">
      <ATabs.TabPane
        v-for="tab in currentTaskInfo?.questionnairesTabs"
        :key="tab.key"
      >
        <template #tab>
          <span
            class="rounded-full bg-white px-3 py-2 text-center text-xs font-medium text-[#979899] transition-all duration-300"
            :class="{
              '!bg-primary !text-white': activeTabKey?.key === tab.key,
            }"
          >
            {{ tab.label }}
          </span>
        </template>
      </ATabs.TabPane>
      <!-- <template #leftExtra>
        <div class="mr-6">
          <LyButton size="middle" type="default" @click="router.back()">
            返回
          </LyButton>
        </div>
      </template> -->
      <template #rightExtra>
        <ARadio.Group v-model:value="activeType">
          <ARadio.Button
            v-for="item in classType"
            :key="item.key"
            :value="item.key"
          >
            {{ item.label }}
          </ARadio.Button>
        </ARadio.Group>
      </template>
    </ATabs>

    <div class="grid grid-cols-2 gap-4">
      <!-- 统计卡片区域 -->
      <AssessmentDetailTask :task-info="currentTaskInfo" :loading="loading" />

      <!-- 年级班级对比区域 -->
      <AssessmentDetailCompare />
    </div>

    <!-- 年级管理区域 -->
    <AssessmentDetailList />
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-tabs-nav) {
  margin-bottom: 0 !important;
}

:deep(.ant-tabs-nav::before) {
  display: none !important;
}

:deep(.ant-tabs-ink-bar) {
  display: none !important;
}

:deep(.ant-btn-default) {
  height: 100% !important;
  padding: 12px 15px !important;
  // font-size: 12px !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
