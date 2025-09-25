<script lang="ts" setup>
import type { CrisisEvent } from '@vben/types';

import type { CrisisEventListReq } from '#/api/psychology/crisis';

import { ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Progress as AProgress } from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCrisisEventList } from '#/api/psychology/crisis';
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
  eventType: number;
  count: number;
}

const eventpanelIconMap: Record<number, string> = {
  1: crisisEventHandlingIcon,
  2: crisisEventConsultIcon,
  3: crisisEventEvaluationIcon,
  4: crisisEventContinuousIcon,
  5: crisisEventResolvedIcon,
  6: crisisEventClosedIcon,
};

// 面板数据
const eventPanelData = ref<EventPanelData[]>(
  Object.keys(eventpanelIconMap).map((key) => ({
    eventType: Number(key),
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
    height: '540px',
    pagerConfig: {
      align: 'right',
      pageSize: 10,
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
    },
    columns: useEventGridSchema(),
    proxyConfig: {
      ajax: {
        query: async ({ page }: any, formValues: any) => {
          const response = await getCrisisEventList({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
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

/** 搜索表单搜索 */
function handleSearch(params: CrisisEventListReq) {
  gridApi.query(params);
}

/** 事件类型搜索 */
function handleEventTypeSearch(status: number) {
  gridApi.query({
    pageNo: 1,
    pageSize: 10,
    status,
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
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <!-- 搜索表单 -->
    <RiskSearch @search="handleSearch">
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
        :key="eventPanel.eventType"
        class="flex cursor-pointer items-center justify-between rounded-xl bg-white p-6 hover:shadow-sm"
        @click="handleEventTypeSearch(eventPanel.eventType)"
      >
        <div class="flex flex-col gap-3">
          <div class="text-xl font-bold">{{ eventPanel.count }}</div>
          <span class="text-sm text-[#979899]">
            {{ getDictLabel('crisis_event_type', eventPanel.eventType) }}
          </span>
        </div>
        <img :src="eventpanelIconMap[eventPanel.eventType]" class="w-12" />
      </div>
    </div>

    <!-- 事件列表 -->
    <Grid>
      <!-- 事件优先级 -->
      <template #id="{ row }">
        <div class="flex flex-col gap-1 px-2">
          <div class="font-bold text-[#4C4C4D]">
            {{ row.id }}
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
        <div class="text-[#4C4C4D]">{{ row.priority }}</div>
      </template>

      <!-- 当前状态 -->
      <template #status="{ row }">
        <LyTag
          tag-category-key="crisis_event_status"
          :dict-value="row.status"
        />
      </template>

      <!-- 负责人 -->
      <template #handlerName="{ row }">
        <div class="flex flex-col gap-1">
          <div class="font-bold text-[#4C4C4D]">
            {{ row.handlerName }}
          </div>
          <div class="text-xs text-[#4C4C4D]">
            {{ dayjs(row.updateTime).format('YYYY-MM-DD') }}
          </div>
        </div>
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
          {{ dayjs(row.reportedAt).format('YYYY-MM-DD') }}
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

    <HandleCrisisEventModal />
    <SystemSettingDrawer />
    <ReportFastDrawer />
  </div>
</template>
