<script lang="ts" setup>
import type { CrisisEvent } from '@vben/types';

import type { CrisisEventListReq } from '#/api/psychology/crisis';

import { ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Progress as AProgress, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCrisisEventList,
  getEventProcessStatistics,
} from '#/api/psychology';
import HandleCrisisEventDialog from '#/components/Dialog/handleCrisisEventDialog/index.vue';
import CrisisInterventionSettingDrawer from '#/components/Drawer/CrisisInterventionSettingDrawer/index.vue';
import ReportQuicklyDrawer from '#/components/Drawer/ReportQuicklyDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyTag from '#/components/LyTag/index.vue';
import { getDictLabel } from '#/utils/dict';

import crisisEventClosedIcon from '../../static/icons/crisis/crisis_event_closed_icon.png';
import crisisEventConsultIcon from '../../static/icons/crisis/crisis_event_consult_icon.png';
import crisisEventContinuousIcon from '../../static/icons/crisis/crisis_event_continuous_icon.png';
import crisisEventEvaluationIcon from '../../static/icons/crisis/crisis_event_evaluation_icon.png';
import crisisEventHandlingIcon from '../../static/icons/crisis/crisis_event_handling_icon.png';
import crisisEventResolvedIcon from '../../static/icons/crisis/crisis_event_resolved_icon.png';
import RiskSearch from './components/RiskSearch.vue';
import { useEventGridSchema } from './data';

defineOptions({ name: 'CrisisIntervention' });

interface EventPanelData {
  type: number;
  count: number;
}

const riskSearchRef = ref<InstanceType<typeof RiskSearch>>();

// 事件面板图标映射
const eventpanelIconMap: Record<number, string> = {
  0: crisisEventHandlingIcon,
  1: crisisEventConsultIcon,
  2: crisisEventEvaluationIcon,
  3: crisisEventContinuousIcon,
  4: crisisEventResolvedIcon,
  5: crisisEventClosedIcon,
};

// 面板数据
const eventPanelData = ref<EventPanelData[]>(
  Object.keys(eventpanelIconMap).map((key) => ({
    type: Number(key),
    count: 0,
  })),
);

// 危机事件处理弹窗
const [HandleCrisisEventModal, handleCrisisEventModalApi] = useVbenModal({
  connectedComponent: HandleCrisisEventDialog,
});

// 危机干预系统设置抽屉
const [SystemSettingDrawer, systemSettingDrawerApi] = useVbenDrawer({
  connectedComponent: CrisisInterventionSettingDrawer,
});

// 快速上班抽屉
const [ReportFastDrawer, reportFastDrawerApi] = useVbenDrawer({
  connectedComponent: ReportQuicklyDrawer,
});

// 表格视图
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '590px',
    pagerConfig: {
      align: 'right',
      pageSize: 10,
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
      pageSizes: [10, 20, 30, 40, 50, 60],
    },
    columns: useEventGridSchema(),
    proxyConfig: {
      ajax: {
        query: async ({ page }: any, formValues: any) => {
          const response = await getCrisisEventList({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            ...riskSearchRef.value?.crisisEventListReq,
          });
          await loadEventProcessStatistics();
          return response;
        },
      },
    },
    cellConfig: {
      height: 80,
    },
    toolbarConfig: { refresh: false, search: true, custom: false, zoom: false },
  },
});

/** 加载危机事件状态统计 */
async function loadEventProcessStatistics() {
  try {
    const list = await getEventProcessStatistics();
    if (list.length > 0) {
      eventPanelData.value = list;
    }
  } catch (error) {
    console.error('加载危机事件状态统计失败', error);
    message.error('加载危机事件状态统计失败');
  }
}

/** 搜索表单搜索 */
function handleSearch(params: CrisisEventListReq) {
  gridApi.query(params);
}

/** 事件类型搜索 */
function handlestatusSearch(status: number) {
  gridApi.query({
    pageNo: 1,
    pageSize: 10,
    processStatus: status,
  });
}

/** 查看详情 */
function handleViewDetail(row: CrisisEvent) {
  handleCrisisEventModalApi
    .setData({
      id: row.id,
      title: row.title,
    })
    .open();
}

/** 系统设置 */
function handleSystemSetting() {
  systemSettingDrawerApi.open();
}

/** 快速上报 */
function handleReportFast() {
  reportFastDrawerApi.open();
}

/** 刷新事件列表 */
function refresh() {
  gridApi.query();
}
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <!-- 搜索表单 -->
    <RiskSearch ref="riskSearchRef" @search="handleSearch">
      <template #actions>
        <div class="flex items-center gap-2">
          <LyButton size="middle" type="default" @click="handleSystemSetting">
            系统设置
          </LyButton>
          <LyButton size="middle" type="success" @click="handleReportFast">
            快速上报
          </LyButton>
        </div>
      </template>
    </RiskSearch>

    <!-- 事件面板 -->
    <div class="grid grid-cols-6 gap-5">
      <div
        v-for="eventPanel in eventPanelData"
        :key="eventPanel.type"
        class="flex cursor-pointer items-center justify-between rounded-xl bg-white p-6 hover:shadow-sm"
        @click="handlestatusSearch(eventPanel.type)"
      >
        <div class="flex flex-col gap-3">
          <div class="text-xl font-bold">{{ eventPanel.count }}</div>
          <span class="text-sm text-[#979899]">
            {{ getDictLabel('intervention_process_status', eventPanel.type) }}
          </span>
        </div>
        <img :src="eventpanelIconMap[eventPanel.type]" class="w-12" />
      </div>
    </div>

    <!-- 事件列表 -->
    <Grid>
      <!-- 事件优先级 -->
      <template #eventId="{ row }">
        <div class="flex flex-col gap-1 px-2">
          <div class="font-bold text-[#4C4C4D]">
            {{ row.eventId }}
          </div>
          <p
            class="line-clamp-2 whitespace-normal text-xs leading-normal text-[#979899]"
          >
            {{ row.description }}
          </p>
        </div>
      </template>

      <!-- 学生信息 -->
      <template #studentName="{ row }">
        <div class="flex flex-col gap-1">
          <div class="font-bold text-[#4C4C4D]">
            {{ row.studentName }}
          </div>
          <p class="text-xs text-[#4C4C4D]">
            {{ row.className }}
          </p>
        </div>
      </template>

      <!-- 优先级 -->
      <template #priority="{ row }">
        <div class="text-[#4C4C4D]">
          {{ getDictLabel('crisis_event_priority', row.priority) }}
        </div>
        <!-- <LyTag
          tag-category-key="crisis_event_priority"
          :dict-value="String(row.priority)"
        /> -->
      </template>

      <!-- 当前状态 -->
      <template #status="{ row }">
        <LyTag
          tag-category-key="intervention_process_status"
          :dict-value="String(row.processStatus)"
        />
      </template>

      <!-- 负责人 -->
      <template #handlerName="{ row }">
        <div v-if="row.handlerName" class="flex flex-col gap-1">
          <div class="font-bold text-[#4C4C4D]">
            {{ row.handlerName }}
          </div>
          <div class="text-xs text-[#4C4C4D]">
            {{ dayjs(row.updateTime).format('YYYY-MM-DD') }}
          </div>
        </div>
        <div v-else>--</div>
      </template>

      <!-- 处理进度 -->
      <template #progress="{ row }">
        <div class="px-8">
          <AProgress :percent="row.progress" :size="8" />
        </div>
      </template>

      <!-- 上报时间 -->
      <template #reportedAt="{ row }">
        <div class="text-[#4C4C4D]">
          {{ dayjs(row.reportedAt).format('YYYY-MM-DD HH:mm:ss') }}
        </div>
      </template>

      <!-- 操作 -->
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              onClick: handleViewDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>

    <HandleCrisisEventModal @refresh="refresh" />
    <SystemSettingDrawer />
    <ReportFastDrawer @refresh="refresh" />
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-pager--sizes) {
  width: 8em !important;
  margin-right: 0 !important;
}
</style>
