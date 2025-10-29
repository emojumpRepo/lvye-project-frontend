<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { ChevronRight } from '@vben/icons';

import { Empty, message } from 'ant-design-vue';

import { getConfigKey } from '#/api/infra/config';
import { getWorkspaceData } from '#/api/psychology/workspace';
import ReportQuicklyDrawer from '#/components/Drawer/ReportQuicklyDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import PageTitle from '#/components/PageTitle/index.vue';
import WorkSpaceCard from '#/views/dashboard/workspace/components/WorkSpaceCard.vue';
import WorkSpaceItem from '#/views/dashboard/workspace/components/WorkSpaceItem.vue';

// 快速上报抽屉
const [ReportFastDrawer, reportFastDrawerApi] = useVbenDrawer({
  connectedComponent: ReportQuicklyDrawer,
});

const systemWelcome = ref(''); // 系统欢迎语
const consultationsList = ref([]); // 今日咨询任务
const interveneList = ref([]); // 重点干预学生
const alertsList = ref([]); // 待处理预警事件

function handleQuickReport() {
  reportFastDrawerApi.open();
}

/** 获取任务看板数据 */
async function loadWorkspaceData(
  type: 'HIGH_RISK_STUDENTS' | 'PENDING_ALERTS' | 'TODAY_CONSULTATIONS',
) {
  try {
    const response = await getWorkspaceData({
      type,
    });
    if (!response) return;
    switch (type) {
      case 'HIGH_RISK_STUDENTS': {
        interveneList.value = response.data;
        break;
      }
      case 'PENDING_ALERTS': {
        alertsList.value = response.data;
        break;
      }
      case 'TODAY_CONSULTATIONS': {
        consultationsList.value = response.data;
        break;
      }
      default: {
        break;
      }
    }
  } catch (error) {
    console.error('获取任务看板数据失败', error);
    message.error('获取任务看板数据失败, 请稍后重试');
  }
}

/** 获取系统欢迎语 */
async function loadSystemWelcome() {
  try {
    const response = await getConfigKey('system.welcome');
    if (!response) return;
    systemWelcome.value = response || '欢迎使用心理健康管理系统';
  } catch (error) {
    console.error('获取系统欢迎语失败', error);
    message.error('获取系统欢迎语失败, 请稍后重试');
  }
}

onMounted(async () => {
  await loadSystemWelcome();
  await loadWorkspaceData('TODAY_CONSULTATIONS');
  await loadWorkspaceData('HIGH_RISK_STUDENTS');
  await loadWorkspaceData('PENDING_ALERTS');
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

    <div
      class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:gap-6 xl:grid-cols-3"
    >
      <!-- 今日心理咨询任务 -->
      <WorkSpaceCard
        :with-gradient="true"
        :count="0"
        icon-src="mingcute:task-2-fill"
        icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
        title="今日心理咨询任务"
        class="min-h-[400px] md:col-span-1"
      >
        <div class="flex h-full max-w-full flex-col gap-3 sm:gap-4">
          <template v-if="consultationsList.length > 0">
            <WorkSpaceItem
              v-for="(consultation, idx) in consultationsList"
              :key="idx"
              :item="consultation"
            />
          </template>
          <div v-else class="flex-center h-full">
            <Empty />
          </div>
        </div>
      </WorkSpaceCard>

      <!-- 重点干预学生 -->
      <WorkSpaceCard
        :with-gradient="true"
        :count="0"
        icon-src="ix:user-filled"
        icon-bg="linear-gradient(143.39deg, #FFB6D9 11.39%, #FF1271 89.3%)"
        title="重点干预学生"
        class="min-h-[400px] md:col-span-1"
      >
        <div class="flex h-full max-w-full flex-col gap-3 sm:gap-4">
          <template v-if="interveneList.length > 0">
            <WorkSpaceItem
              v-for="(intervention, idx) in interveneList"
              :key="idx"
              :item="intervention"
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

      <!-- 待处理预警事件 -->
      <WorkSpaceCard
        :with-gradient="true"
        :count="0"
        icon-src="octicon:bell-fill-24"
        icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
        title="待处理预警事件"
        class="min-h-[400px] md:col-span-2 xl:col-span-1"
      >
        <div class="flex h-full max-w-full flex-col gap-3 sm:gap-4">
          <template v-if="alertsList.length > 0">
            <WorkSpaceItem
              v-for="(alert, idx) in alertsList"
              :key="idx"
              :item="alert"
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
