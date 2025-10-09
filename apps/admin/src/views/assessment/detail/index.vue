<script lang="ts" setup>
import type { ActiveType, TabItem, TaskInfo } from './types';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { useDocumentVisibility, useIdle, useIntervalFn } from '@vueuse/core';
import {
  Divider as ADivider,
  Radio as ARadio,
  Tabs as ATabs,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { getTagByCategory } from '#/api/constants';
import { getAssessmentTask } from '#/api/psychology/assessment';
import LyButton from '#/components/LyButton/index.vue';

import AssessmentDetailCompare from './components/AssessmentDetailCompare.vue';
import AssessmentDetailList from './components/AssessmentDetailList.vue';
import AssessmentDetailTask from './components/AssessmentDetailTask.vue';

import 'dayjs/locale/zh-cn';

// Day.js 插件配置
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const assessmentDetailTaskRef =
  ref<InstanceType<typeof AssessmentDetailTask>>();
const assessmentDetailCompareRef =
  ref<InstanceType<typeof AssessmentDetailCompare>>();
const lastManualRefreshTime = ref(0);

const classType = ref<TabItem[]>([
  { label: '全部', key: 'all' },
  { label: '年级', key: 'grade' },
  { label: '班级', key: 'class' },
]);

const actionButtons = ref([
  {
    label: '发布提醒',
    value: 'publish',
    onClick: handlePublish,
    show: false,
  },
  {
    label: '延长时间',
    value: 'extend',
    onClick: handleExtend,
    show: false,
  },
  {
    label: '提前结束',
    value: 'end',
    onClick: handleEnd,
    show: false,
  },
  {
    label: '导出数据',
    value: 'export',
    onClick: handleExport,
    show: true,
  },
]);

const activeType = ref<ActiveType>('all'); // 年级班级类型
const route = useRoute();
const router = useRouter();
const taskNo = String(route.params.taskNo || '');

const loading = ref(false);

const currentTaskInfo = ref<TaskInfo>();
const activeTab = ref<TabItem>({
  key: '',
  label: '',
});

/** 任务状态标签 */
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

/** 发布提醒 */
function handlePublish() {
  message.warning('即将上线');
}

/** 延长时间 */
function handleExtend() {
  message.warning('即将上线');
}
/** 提前结束 */
function handleEnd() {
  message.warning('即将上线');
}

/** 导出数据 */
function handleExport() {
  message.warning('即将上线');
}

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

/** 加载测评任务数据 */
async function loadTaskData() {
  if (!taskNo) return;
  try {
    loading.value = true;
    // 获取任务基本信息
    const taskInfo = await getAssessmentTask(taskNo);
    if (taskInfo.questionnaires) {
      const questionnairesTabs = taskInfo.questionnaires.map((item) => ({
        label: item.title || '',
        code: item.code || '',
        key: item.id?.toString() || '',
      }));

      // 将包含"心理健康评估"的项前置
      const priorityIndex = questionnairesTabs.findIndex((item) =>
        item.label.includes('心理健康评估'),
      );
      if (priorityIndex !== -1) {
        const [priorityItem] = questionnairesTabs.splice(priorityIndex, 1);
        if (priorityItem) {
          questionnairesTabs.unshift(priorityItem);
        }
      }

      // 将包含"儿童期逆境与发育情况评估"的项后置
      const lastIndex = questionnairesTabs.findIndex((item) =>
        item.label.includes('儿童期逆境与发育情况评估'),
      );
      if (lastIndex !== -1) {
        const [lastItem] = questionnairesTabs.splice(lastIndex, 1);
        if (lastItem) {
          questionnairesTabs.push(lastItem);
        }
      }

      currentTaskInfo.value = {
        taskNo: taskInfo.taskNo || '',
        taskName: taskInfo.taskName,
        status: taskInfo.status,
        startline: Number(taskInfo.startline),
        deadline: Number(taskInfo.deadline),
        questionnairesTabs: [
          { label: '整体测评', key: '' },
          ...questionnairesTabs,
        ],
      };

      // if (
      //   !activeTab.value.key &&
      //   currentTaskInfo.value?.questionnairesTabs?.length
      // ) {
      //   activeTab.value = currentTaskInfo.value?.questionnairesTabs[0]
      //     ? { ...currentTaskInfo.value.questionnairesTabs[0] }
      //     : { key: '', label: '' };
      // }
    }
  } catch (error) {
    console.error('加载测评任务数据失败:', error);
  } finally {
    loading.value = false;
  }
}

/** 切换问卷tab */
function handleTabChange(key: any) {
  const target = currentTaskInfo.value?.questionnairesTabs.find(
    (item) => item.key === key,
  );
  activeTab.value = target ? { ...target } : { key: '', label: '' };
}

/** 实际执行刷新的函数 */
function executeRefresh() {
  assessmentDetailTaskRef.value?.loadAssessmentStatistics(taskNo);
  assessmentDetailCompareRef.value?.loadAssessmentTaskRiskLevelStatistics(
    taskNo,
  );
  loadTaskData();
  lastUpdateTime.value = dayjs();
}

/** 手动刷新处理函数 */
function handleManualRefresh() {
  const now = Date.now();
  if (now - lastManualRefreshTime.value < 60 * 1000) {
    message.warning('请等待1分钟后再刷新');
    return;
  }
  lastManualRefreshTime.value = now;
  executeRefresh();
}

const REFRESH_INTERVAL = 60 * 1000; // 1分钟
const IDLE_TIMEOUT = 3 * 60 * 1000; // 3分钟

// 2. 状态追踪
const lastUpdateTime = ref<dayjs.Dayjs | null>(null);
const isVisible = useDocumentVisibility(); // 跟踪页面是否可见
const { idle } = useIdle(IDLE_TIMEOUT); // 跟踪用户是否3分钟无操作

// 3. 创建可控的定时器
const { pause, resume, isActive } = useIntervalFn(
  executeRefresh,
  REFRESH_INTERVAL,
  { immediate: false }, // 初始化时不立即执行
);

// 监听 "页面可见" 且 "用户不空闲" 这两个状态
watch(
  [isVisible, idle],
  ([visible, isIdle]) => {
    if (visible === 'visible' && !isIdle) {
      // 当页面可见且用户活跃时：
      // 1. 立即执行一次刷新（例如从其他tab切回来时）
      executeRefresh();
      // 2. 启动或恢复定时器
      resume();
    } else {
      // 当页面不可见或用户空闲时，暂停定时器
      pause();
    }
  },
  { immediate: true },
);

const lastUpdatedMessage = computed(() => {
  if (!lastUpdateTime.value) return '等待刷新...';
  // isActive 是 useIntervalFn 返回的，表示定时器是否在运行
  if (!isActive.value) return '自动刷新已暂停';
  return `上次更新时间：${lastUpdateTime.value.format('HH:mm')}`;
});
</script>

<template>
  <div class="flex min-h-screen flex-col gap-4 p-6">
    <div class="flex items-center justify-between gap-6">
      <!-- 任务信息 -->
      <div
        class="flex flex-1 flex-wrap items-center justify-between rounded-xl bg-[#FFFFFF99] px-5 py-2 text-sm text-[#000000A6]"
      >
        <div class="flex flex-nowrap items-center gap-2">
          <IconifyIcon
            icon="mdi:information"
            :color="taskStatusTag?.color"
            class="size-5"
          />
          <span class="truncate">{{
            truncateText(currentTaskInfo?.taskName, 16)
          }}</span>
          <ADivider type="vertical" class="h-4" />
          <span class="truncate"> 任务：{{ currentTaskInfo?.taskNo }} </span>
          <ADivider type="vertical" class="h-4" />
          <span class="truncate">
            测评时间：{{
              dayjs(currentTaskInfo?.startline).format('YYYY-MM-DD')
            }}
            至 {{ dayjs(currentTaskInfo?.deadline).format('YYYY-MM-DD') }}
          </span>
        </div>
        <div class="ml-4 truncate" :class="`text-[${taskStatusTag?.color}]`">
          {{ taskStatusTag?.label }}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-nowrap gap-2">
        <template v-for="button in actionButtons" :key="button.value">
          <LyButton
            v-if="button.show"
            size="middle"
            :type="button.value === 'export' ? 'success' : 'default'"
            @click="button.onClick && button.onClick()"
          >
            {{ button.label }}
          </LyButton>
        </template>
      </div>
    </div>

    <!-- 问卷Tabs -->
    <ATabs
      v-model:active-key="activeTab.key"
      :tab-bar-gutter="10"
      @change="handleTabChange"
    >
      <!-- <ATabs.TabPane
        v-for="tab in currentTaskInfo?.questionnairesTabs"
        :key="tab.key"
      >
        <template #tab>
          <span
            class="rounded-full bg-white px-3 py-2 text-center text-xs font-medium text-[#979899] transition-all duration-300"
            :class="{
              '!bg-primary !text-white': activeTab.key === tab.key,
            }"
          >
            {{ tab.label }}
          </span>
        </template>
      </ATabs.TabPane> -->

      <template #leftExtra>
        <div class="flex-center mr-6 gap-2">
          <LyButton size="middle" type="default" @click="router.back()">
            返回
          </LyButton>
          <LyButton size="small" type="success" @click="handleManualRefresh">
            <IconifyIcon icon="material-symbols:refresh" class="size-5" />
          </LyButton>
          <div class="w-28 whitespace-nowrap text-xs text-gray-500">
            {{ lastUpdatedMessage }}
          </div>
        </div>
      </template>
      <template #rightExtra>
        <div class="flex-center gap-2">
          <ARadio.Group v-model:value="activeType">
            <ARadio.Button
              v-for="item in classType"
              :key="item.key"
              :value="item.key"
            >
              {{ item.label }}
            </ARadio.Button>
          </ARadio.Group>
        </div>
      </template>
    </ATabs>

    <div class="grid h-[400px] grid-cols-2 gap-4">
      <!-- 统计卡片区域 -->
      <AssessmentDetailTask ref="assessmentDetailTaskRef" :task-no="taskNo" />

      <!-- 年级班级对比区域 -->
      <AssessmentDetailCompare
        ref="assessmentDetailCompareRef"
        :task-no="taskNo"
        :active-type="activeType"
      />
    </div>

    <!-- 年级管理区域 -->
    <AssessmentDetailList
      :task-no="taskNo"
      :task-name="currentTaskInfo?.taskName"
      :questionnaires-tabs="currentTaskInfo?.questionnairesTabs"
      @tab-change="handleTabChange"
      v-model:active-tab="activeTab"
    />
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
  padding: 6px 15px !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
