<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { ChevronRight } from '@vben/icons';

import { Empty } from 'ant-design-vue';

import { getConfigKey } from '#/api/infra/config';
import ReportQuicklyDrawer from '#/components/Drawer/ReportQuicklyDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import PageTitle from '#/components/PageTitle/index.vue';
import WorkSpaceCard from '#/views/dashboard/workspace/components/WorkSpaceCard.vue';
import WorkSpaceItem from '#/views/dashboard/workspace/components/WorkSpaceItem.vue';

const [ReportFastDrawer, reportFastDrawerApi] = useVbenDrawer({
  connectedComponent: ReportQuicklyDrawer,
});

const systemWelcome = ref('');

// Data for new WorkSpaceCard + WorkSpaceItem lists (sample to match figma)
const taskList = ref([]);

const interveneList = ref([]);

const alertsList = ref([]);

// pagination state and handlers
const taskPage = ref(1);
const taskPageSize = ref(5);
const pagedTaskList = computed(() =>
  taskList.value.slice(
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
  interveneList.value.slice(
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
  alertsList.value.slice(
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

function handleQuickReport() {
  reportFastDrawerApi.open();
}

onMounted(async () => {
  try {
    const res = await getConfigKey('system.welcome');

    if (res) {
      systemWelcome.value = res || '欢迎使用心理健康管理系统';
    }
  } catch (error) {
    console.error('system.welcome', error);
  }
});
</script>

<template>
  <div
    class="flex h-full flex-col px-4 pb-6 pt-4 sm:px-6 md:px-8 md:pb-8 md:pt-5 lg:pb-10"
  >
    <PageTitle :title="systemWelcome">
      <template #action>
        <LyButton size="middle" type="success" @click="handleQuickReport">
          快速上报
        </LyButton>
      </template>
    </PageTitle>
    <!-- Responsive grid with better breakpoints -->
    <div
      class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:gap-6 xl:grid-cols-3"
    >
      <WorkSpaceCard
        :with-gradient="true"
        :count="0"
        icon-src="mingcute:task-2-fill"
        icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
        :pagination="{
          total: taskList.length,
          current: taskPage,
          pageSize: taskPageSize,
          showSizeChanger: false,
        }"
        title="今日心理咨询任务"
        class="min-h-[400px] md:col-span-1"
        @page-change="onTaskPageChange"
        @refresh="onTaskRefresh"
      >
        <div class="flex h-full max-w-full flex-col gap-3 sm:gap-4">
          <template v-if="pagedTaskList.length > 0">
            <WorkSpaceItem
              v-for="(item, idx) in pagedTaskList"
              :key="idx"
              v-bind="item"
            />
          </template>
          <div v-else class="flex-center h-full">
            <Empty />
          </div>
        </div>
      </WorkSpaceCard>

      <WorkSpaceCard
        :with-gradient="true"
        :count="0"
        icon-src="ix:user-filled"
        icon-bg="linear-gradient(143.39deg, #FFB6D9 11.39%, #FF1271 89.3%)"
        :pagination="{
          total: interveneList.length,
          current: intervenePage,
          pageSize: intervenePageSize,
          showSizeChanger: false,
        }"
        title="重点干预学生"
        class="min-h-[400px] md:col-span-1"
        @page-change="onIntervenePageChange"
        @refresh="onInterveneRefresh"
      >
        <div class="flex h-full max-w-full flex-col gap-3 sm:gap-4">
          <template v-if="pagedInterveneList.length > 0">
            <WorkSpaceItem
              v-for="(item, idx) in pagedInterveneList"
              :key="idx"
              v-bind="item"
            >
              <template #rightAction>
                <ChevronRight
                  class="size-4 cursor-pointer hover:opacity-70"
                  color="#959599"
                />
              </template>
            </WorkSpaceItem>
          </template>
          <div v-else class="flex-center h-full">
            <Empty />
          </div>
        </div>
      </WorkSpaceCard>

      <WorkSpaceCard
        :with-gradient="true"
        :count="0"
        icon-src="octicon:bell-fill-24"
        icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
        :pagination="{
          total: alertsList.length,
          current: alertsPage,
          pageSize: alertsPageSize,
          showSizeChanger: false,
        }"
        title="待处理预警事件"
        class="min-h-[400px] md:col-span-2 xl:col-span-1"
        @page-change="onAlertsPageChange"
        @refresh="onAlertsRefresh"
      >
        <div class="flex h-full max-w-full flex-col gap-3 sm:gap-4">
          <template v-if="pagedAlertsList.length > 0">
            <WorkSpaceItem
              v-for="(item, idx) in pagedAlertsList"
              :key="idx"
              v-bind="item"
            />
          </template>
          <div v-else class="flex-center h-full">
            <Empty />
          </div>
        </div>
      </WorkSpaceCard>
    </div>

    <ReportFastDrawer />
  </div>
</template>
