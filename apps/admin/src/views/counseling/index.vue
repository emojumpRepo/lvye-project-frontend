<script lang="ts" setup>
import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { RadioButton, RadioGroup } from 'ant-design-vue';
import dayjs from 'dayjs';

import ConsultMoreDrawerComponent from '#/components/Drawer/ConsultMoreDrawer/index.vue';
import CreateConsultDrawerComponent from '#/components/Drawer/CreateConsultDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import PageTitle from '#/components/PageTitle/index.vue';

import CounselingCalendar from './calendar.vue';
import StatisticCard from './components/StatisticCard.vue';
import CounselingList from './list.vue';

defineOptions({ name: 'CounselingCenter' });

const viewTypeOptions = [
  { label: '访谈记录', value: 1 },
  { label: '日历视图', value: 2 },
];

const counselingListRef = ref<InstanceType<typeof CounselingList>>();

const isProcessingMoreClick = ref(false); // 是否正在处理更多事件点击

// 创建咨询预约抽屉
const [ConsultRecordDrawer, consultRecordDrawerApi] = useVbenDrawer({
  connectedComponent: CreateConsultDrawerComponent,
});

// 更多预约列表抽屉
const [ConsultMoreDrawer, consultMoreDrawerApi] = useVbenDrawer({
  connectedComponent: ConsultMoreDrawerComponent,
});

const viewType = ref(1); // 视图类型，1:咨询记录，2:日历视图

const today = computed(
  () => `${dayjs().format('YYYY-MM-DD')} ${dayjs().format('dddd')}`,
);

/** 刷新咨询记录列表 */
function onRefresh() {
  counselingListRef.value?.refresh();
}

/** 打开咨询预约抽屉 */
function handleCreateConsult(
  payload?:
    | dayjs.Dayjs
    | undefined
    | { date: Date }
    | { end: Date; start: Date },
) {
  // 延迟执行，避免与 moreEventsClick 事件冲突
  setTimeout(() => {
    // 如果正在处理更多事件点击，则跳过创建预约
    if (isProcessingMoreClick.value) {
      return;
    }

    // 提取日期信息
    const currentDate = payload
      ? (dayjs.isDayjs(payload)
          ? payload
          : dayjs('date' in payload ? payload.date : payload.start)
        ).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD');

    // 提取时间段信息
    const timeRange =
      payload && 'start' in payload && 'end' in payload
        ? {
            start: dayjs(payload.start).format('HH:mm'),
            end: dayjs(payload.end).format('HH:mm'),
          }
        : undefined;

    consultRecordDrawerApi
      .setData({
        currentDate,
        timeRange,
      })
      .open();
  }, 100);
}

/** 打开预约列表抽屉 */
function handleViewMoreAppointments(moreEventsBtnInfo?: any) {
  // 立即设置标志，防止后续的 monthCellClick 事件被处理
  isProcessingMoreClick.value = true;

  const currentDate = moreEventsBtnInfo?.date
    ? dayjs(moreEventsBtnInfo.date).format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD');

  consultMoreDrawerApi
    .setData({
      currentDate,
    })
    .open();

  // 延迟重置标志
  setTimeout(() => {
    isProcessingMoreClick.value = false;
  }, 300);
}

/** 打开预约详情抽屉 */
function handleViewDetail(
  payload:
    | PsychologyConsultationApi.ConsultationRecord
    | { date: Date; event: any },
) {
  // 判断是从日历视图还是列表视图触发的
  const record =
    'event' in payload
      ? payload.event // 从日历视图传入的事件数据
      : payload; // 从列表视图传入的记录数据

  // 确保有有效的ID
  const recordId = record?.id || record?.extendedProps?.id;
  if (!recordId) {
    console.warn('无法获取记录ID');
    return;
  }

  consultRecordDrawerApi
    .setData({
      id: recordId,
    })
    .open();
}
</script>

<template>
  <Page auto-content-height :height-offset="50">
    <div class="flex h-full flex-col px-4">
      <!-- 页面标题 -->
      <PageTitle title="访谈管理" :description="today" margin-bottom="mb-4">
        <template #action>
          <div class="custom-radio-group flex items-center gap-4">
            <RadioGroup v-model:value="viewType">
              <RadioButton
                v-for="option in viewTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </RadioButton>
            </RadioGroup>
            <LyButton size="middle" type="success" @click="handleCreateConsult">
              新建预约
            </LyButton>
          </div>
        </template>
      </PageTitle>

      <!-- 统计卡片栏 -->
      <div class="mb-6 grid shrink-0 grid-cols-4 gap-8">
        <StatisticCard
          icon-bg="#f3f6ff"
          icon-color="#247eff"
          icon-src="flowbite:messages-solid"
          title="今天访谈数"
          :value="12000"
        />

        <StatisticCard
          icon-bg="#e6fbf2"
          icon-color="#04dc70"
          icon-src="fluent:clipboard-task-24-filled"
          title="已完成数"
          :value="900"
        />

        <StatisticCard
          icon-bg="#fff2de"
          icon-color="#ff9900"
          icon-src="ph:clock-countdown-fill"
          title="待完成数"
          :value="12"
        />

        <StatisticCard
          icon-bg="#ffeded"
          icon-color="#f4532f"
          icon-src="ph:seal-warning-fill"
          title="逾期评估数"
          :value="100"
        />
      </div>

      <Transition name="fade" mode="out-in">
        <template v-if="viewType === 1">
          <!-- 访谈记录列表 -->
          <CounselingList
            @view-detail="handleViewDetail"
            ref="counselingListRef"
          />
        </template>
        <template v-else>
          <!-- 日历视图 -->
          <CounselingCalendar
            @time-click="handleCreateConsult"
            @month-cell-click="handleCreateConsult"
            @more-events-click="handleViewMoreAppointments"
            @event-click="handleViewDetail"
          />
        </template>
      </Transition>
    </div>
    <ConsultRecordDrawer @refresh="onRefresh" />
    <ConsultMoreDrawer />
  </Page>
</template>

<style lang="scss" scoped>
.custom-radio-group {
  :deep(.ant-radio-group) {
    height: 40px;
    line-height: 40px;
    // border-radius: 4px;

    .ant-radio-button-wrapper {
      height: 40px;
      padding: 0 20px;
      line-height: 40px;
      color: #979899;
    }

    .ant-radio-button-wrapper-checked {
      color: #04dc70 !important;
      background-color: #14e77e14 !important;
    }

    .ant-radio-button-wrapper:first-child {
      border-radius: 4px 0 0 4px;
    }

    .ant-radio-button-wrapper:last-child {
      border-radius: 0 4px 4px 0;
    }
  }
}
</style>
