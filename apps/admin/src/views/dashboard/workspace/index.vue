<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { ChevronRight } from '@vben/icons';

import { getConfigPage } from '#/api/infra/config';
import PageTitle from '#/components/PageTitle/index.vue';
import WorkSpaceCard from '#/views/dashboard/workspace/components/WorkSpaceCard.vue';
import WorkSpaceItem from '#/views/dashboard/workspace/components/WorkSpaceItem.vue';

const systemWelcome = ref('');

// Data for new WorkSpaceCard + WorkSpaceItem lists (sample to match figma)
const taskList = [
  {
    severity: 'warning',
    name: '李晓红',
    className: '高三 ( 1 ) 班',
    statusBadge: { text: '待补录', color: 'orange' },
    date: '2025-01-10',
    time: '12:12:00',
    counselor: '李老师',
    rightAction: { text: '补录评估', color: 'orange' },
  },
  {
    severity: 'warning',
    name: '张明明',
    className: '高三 ( 2 ) 班',
    statusBadge: { text: '待补录', color: 'orange' },
    date: '2025-01-10',
    time: '12:12:00',
    counselor: '李老师',
    rightAction: { text: '补录评估', color: 'orange' },
  },
  {
    severity: 'neutral',
    name: '王大大',
    className: '高三 ( 3 ) 班',
    date: '2025-01-10',
    time: '12:12:00',
    counselor: '李老师',
    rightAction: { text: '完成咨询', color: 'green' },
  },
];

const interveneList = [
  {
    severity: 'danger',
    name: '李晓红',
    className: '高三 ( 1 ) 班',
    statusBadge: { text: '重大（三类）', color: 'red' },
    description: '2小时前',
    counselor: '李老师',
  },
  {
    severity: 'warning',
    name: '张明明',
    className: '高三 ( 2 ) 班',
    statusBadge: { text: '严重（二类）', color: 'orange' },
    date: '2025-01-10',
    time: '12:12:00',
    counselor: '李老师',
  },
  {
    severity: 'neutral',
    name: '王大大',
    className: '高三 ( 3 ) 班',
    statusBadge: { text: '一般（一类）', color: 'grey' },
    date: '2025-01-10',
    time: '12:12:00',
    counselor: '李老师',
  },
];

const alertsList = [
  {
    severity: 'danger',
    name: '张小明',
    className: '高三 ( 1 ) 班',
    statusBadge: { text: '紧急', color: 'red' },
    secondaryBadge: { text: 'AI检测', type: 'ai' },
    time: '20分钟前',
    description: 'AI在对话中检测到该生存在严重自我否定情绪,表达了轻生倾...',
    rightAction: { text: '立即处理', color: 'red' },
  },
  {
    severity: 'warning',
    name: '张明明',
    className: '高三 ( 2 ) 班',
    statusBadge: { text: '重要', color: 'orange' },
    secondaryBadge: { text: '教师上报', type: 'teacher' },
    time: '20分钟前',
    description: '班主任上报:  该学生近期情绪低落,经常独自一人,需要关注...',
    rightAction: { text: '立即处理', color: 'orange' },
  },
  {
    severity: 'neutral',
    name: '张明明',
    className: '高三 ( 2 ) 班',
    statusBadge: { text: '一般', color: 'grey' },
    secondaryBadge: { text: '评测系统', type: 'system' },
    time: '20分钟前',
    description: '心理测评结果显示该学生焦虑指数严重偏高,建议立即干预...',
    rightAction: { text: '立即处理', color: 'green' },
  },
];

// pagination state and handlers
const taskPage = ref(1);
const taskPageSize = ref(5);
const pagedTaskList = computed(() =>
  taskList.slice(
    (taskPage.value - 1) * taskPageSize.value,
    taskPage.value * taskPageSize.value,
  ),
);
function onTaskPageChange(page: number, pageSize: number) {
  taskPage.value = page;
  taskPageSize.value = pageSize;
}
function onTaskRefresh() {
  // TODO: hook to real data source
}

const intervenePage = ref(1);
const intervenePageSize = ref(5);
const pagedInterveneList = computed(() =>
  interveneList.slice(
    (intervenePage.value - 1) * intervenePageSize.value,
    intervenePage.value * intervenePageSize.value,
  ),
);
function onIntervenePageChange(page: number, pageSize: number) {
  intervenePage.value = page;
  intervenePageSize.value = pageSize;
}
function onInterveneRefresh() {
  // TODO: hook to real data source
}

const alertsPage = ref(1);
const alertsPageSize = ref(5);
const pagedAlertsList = computed(() =>
  alertsList.slice(
    (alertsPage.value - 1) * alertsPageSize.value,
    alertsPage.value * alertsPageSize.value,
  ),
);
function onAlertsPageChange(page: number, pageSize: number) {
  alertsPage.value = page;
  alertsPageSize.value = pageSize;
}
function onAlertsRefresh() {
  // TODO: hook to real data source
}

onMounted(async () => {
  try {
    const res = await getConfigPage({
      pageNo: 1,
      pageSize: 10,
      key: 'system.welcome',
    });

    if (res.list.length > 0) {
      systemWelcome.value = res.list[0].value || '欢迎使用心理健康管理系统';
    }
  } catch (error) {
    console.error('system.welcome', error);
  }
});
</script>

<template>
  <div class="flex h-full flex-col px-[30px] pb-10 pt-5">
    <PageTitle :title="systemWelcome" />
    <!-- New cards from Figma design -->
    <div class="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
      <WorkSpaceCard
        :with-gradient="true"
        :count="19"
        icon-src="mingcute:task-2-fill"
        icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
        :pagination="{
          total: taskList.length,
          current: taskPage,
          pageSize: taskPageSize,
          showSizeChanger: false,
        }"
        title="今日心理咨询任务"
        class="lg:col-span-2"
        @page-change="onTaskPageChange"
        @refresh="onTaskRefresh"
      >
        <div class="flex max-w-full flex-col gap-4">
          <WorkSpaceItem
            v-for="(item, idx) in pagedTaskList"
            :key="idx"
            v-bind="item as any"
          />
        </div>
      </WorkSpaceCard>

      <WorkSpaceCard
        :with-gradient="true"
        :count="19"
        icon-src="ix:user-filled"
        icon-bg="linear-gradient(143.39deg, #FFB6D9 11.39%, #FF1271 89.3%)"
        :pagination="{
          total: interveneList.length,
          current: intervenePage,
          pageSize: intervenePageSize,
          showSizeChanger: false,
        }"
        title="重点干预学生"
        class="lg:col-span-2"
        @page-change="onIntervenePageChange"
        @refresh="onInterveneRefresh"
      >
        <div class="flex max-w-full flex-col gap-4">
          <WorkSpaceItem
            v-for="(item, idx) in pagedInterveneList"
            :key="idx"
            v-bind="item as any"
          >
            <template #rightAction>
              <ChevronRight class="size-4 cursor-pointer" color="#959599" />
            </template>
          </WorkSpaceItem>
        </div>
      </WorkSpaceCard>

      <WorkSpaceCard
        :with-gradient="true"
        :count="19"
        icon-src="octicon:bell-fill-24"
        icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
        :pagination="{
          total: alertsList.length,
          current: alertsPage,
          pageSize: alertsPageSize,
          showSizeChanger: false,
        }"
        title="待处理预警事件"
        class="lg:col-span-3"
        @page-change="onAlertsPageChange"
        @refresh="onAlertsRefresh"
      >
        <div class="flex max-w-full flex-col gap-4">
          <WorkSpaceItem
            v-for="(item, idx) in pagedAlertsList"
            :key="idx"
            v-bind="item as any"
          />
        </div>
      </WorkSpaceCard>
    </div>
  </div>
</template>
