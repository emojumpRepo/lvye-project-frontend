<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Progress as AProgress } from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import HandleCrisisEventDialog from '#/components/Dialog/handleCrisisEventDialog/index.vue';
import CrisisInterventionSettingDrawer from '#/components/Drawer/CrisisInterventionSettingDrawer/index.vue';
import ReportQuickyDrawer from '#/components/Drawer/ReportQuickyDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyTag from '#/components/LyTag/index.vue';
import PageTitle from '#/components/PageTitle/index.vue';
import { getDictLabel } from '#/utils/dict';

import crisisEventClosedIcon from '../../static/icons/crisis/crisis_event_closed_icon.png';
import crisisEventConsultIcon from '../../static/icons/crisis/crisis_event_consult_icon.png';
import crisisEventContinuousIcon from '../../static/icons/crisis/crisis_event_continuous_icon.png';
import crisisEventEvaluationIcon from '../../static/icons/crisis/crisis_event_evaluation_icon.png';
import crisisEventHandlingIcon from '../../static/icons/crisis/crisis_event_handling_icon.png';
import crisisEventResolvedIcon from '../../static/icons/crisis/crisis_event_resolved_icon.png';
import CrisisSearch from './components/CrisisSearch.vue';
import InterventionCard from './components/InterventionCard.vue';
import { useEventGridSchema } from './data';
import { eventListData, eventPanelData, interventionList } from './mockData';

defineOptions({ name: 'CrisisIntervention' });

const loading = ref(false);
const activeTabKey = ref('board');

const eventpanelIconMap: Record<number, string> = {
  1: crisisEventHandlingIcon,
  2: crisisEventConsultIcon,
  3: crisisEventEvaluationIcon,
  4: crisisEventContinuousIcon,
  5: crisisEventResolvedIcon,
  6: crisisEventClosedIcon,
};

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
  connectedComponent: ReportQuickyDrawer,
});

// 表格视图
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '570px',
    pagerConfig: {
      align: 'right',
      pageSize: 10,
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
    },
    columns: useEventGridSchema(),
    data: eventListData,
    cellConfig: {
      height: 80,
    },
    toolbarConfig: { refresh: false, search: true, custom: false, zoom: false },
  },
});

/** 查看详情 */
function handleViewDetail(row: any) {
  console.log(row);
  handleCrisisEventModalApi.open();
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
    <!-- 页面标题 -->
    <PageTitle
      title="危机干预管理系统"
      description="事件上报来源 → 处理流程分配 → 进度跟踪管理"
      margin-bottom="mb-4"
    >
      <template #action>
        <div class="flex items-center gap-2">
          <LyButton
            size="middle"
            type="default"
            class="h-10 w-[96px]"
            @click="handleSystemSetting"
          >
            系统设置
          </LyButton>
          <LyButton
            size="middle"
            type="success"
            class="h-10 w-[96px]"
            @click="handleReportFast"
          >
            快速上报
          </LyButton>
        </div>
      </template>
    </PageTitle>

    <!-- 搜索表单 -->
    <CrisisSearch :loading="loading" v-model:active-key="activeTabKey" />

    <!-- 列表 -->
    <div v-if="activeTabKey === 'board'" class="grid grid-cols-5 gap-5">
      <template v-for="item in interventionList" :key="item.type">
        <InterventionCard :intervention-item="item" />
      </template>
    </div>

    <div v-if="activeTabKey === 'list'" class="space-y-4">
      <!-- 事件面板 -->
      <div class="grid grid-cols-6 gap-5">
        <div
          v-for="eventPanel in eventPanelData"
          :key="eventPanel.eventType"
          class="flex items-center justify-between rounded-xl bg-white p-6"
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
        <template #eventId="{ row }">
          <div class="flex flex-col gap-1 px-2">
            <div class="font-bold text-[#4C4C4D]">
              {{ row.eventId }}
            </div>
            <p
              class="line-clamp-2 whitespace-normal text-xs leading-normal text-[#979899]"
            >
              {{ row.eventDescription }}
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
            tag-category-key="crisis_event_type"
            :dict-value="row.status"
          />
        </template>

        <!-- 负责人 -->
        <template #consultant="{ row }">
          <div class="flex flex-col gap-1">
            <div class="font-bold text-[#4C4C4D]">
              {{ row.consultant.name }}
            </div>
            <div class="text-xs text-[#4C4C4D]">
              {{ dayjs(row.consultant.createTime).format('YYYY-MM-DD') }}
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
        <template #createTime="{ row }">
          <div class="text-[#4C4C4D]">
            {{ dayjs(row.createTime).format('YYYY-MM-DD') }}
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
    </div>

    <HandleCrisisEventModal />
    <SystemSettingDrawer />
    <ReportFastDrawer />
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-pager--sizes) {
  margin-right: 0 !important;
}

:deep(.ant-progress-text) {
  color: #979899;
}

:deep(.ant-btn-link) {
  color: #2c68ff;
}

:deep(.ant-pagination-simple-pager) {
  margin-inline-end: 0 !important;
}
</style>
