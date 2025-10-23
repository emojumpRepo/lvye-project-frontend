<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { TimeRangeAppointment } from '@vben/types';

import { onMounted, onUnmounted, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

// @ts-ignore
import Calendar from '@toast-ui/calendar';
import {
  DatePicker,
  message,
  RadioButton,
  RadioGroup,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';

import { getTimeRangeAppointment } from '#/api/psychology/consultation';
import LyButton from '#/components/LyButton/index.vue';

import '@toast-ui/calendar/dist/toastui-calendar.min.css';

defineOptions({ name: 'CounselingCalendar' });

const emit = defineEmits<{
  (e: 'monthCellClick', payload: { date: Date }): void;
  (e: 'timeClick', payload: { date: Date; end: Date; start: Date }): void;
  (
    e: 'moreEventsClick',
    payload: {
      counselorUserId: number;
      date: Date;
      target: HTMLElement | null;
    },
  ): void;
  (e: 'eventClick', payload: { date: Date; event: any }): void;
}>();

/* eslint-disable no-unused-vars */
enum CalendarViewType {
  Day = 'day',
  Month = 'month',
  Week = 'week',
}
/* eslint-enable no-unused-vars */

type PickerMode = 'date' | 'month' | 'week';

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);

// 日历组件实例
const calendarContainer = ref<HTMLElement | null>(null);
const calendar = ref<Calendar | null>(null);
let removeMouseListeners: (() => void) | null = null;
let removeMonthSingleSelect: (() => void) | null = null;

// 日历视图类型
const calendarView = ref<CalendarViewType>(CalendarViewType.Month);
const pickerType = ref<PickerMode>(CalendarViewType.Month);
const leftArrowTip = ref('上个月');
const rightArrowTip = ref('下个月');
const selectedDate = ref<Dayjs>(dayjs());
const isAllTeachers = ref(false);
const offset = ref(0);

/**
 * 辅助函数：将 dayjs/Date/原始值统一转换为 Date
 */
function toDateLike(input: any): Date {
  return typeof input?.toDate === 'function' ? input.toDate() : new Date(input);
}

/**
 * 辅助函数：判断点击目标是否为“更多”按钮（+N）
 */
function isMoreHeaderTarget(target: EventTarget | null): boolean {
  const el = (target as HTMLElement) || null;
  return !!(
    el &&
    (el.classList?.contains(
      'toastui-calendar-template-monthGridHeaderExceed',
    ) ||
      el.closest('.toastui-calendar-template-monthGridHeaderExceed'))
  );
}

/**
 * 辅助函数：从基准日期与日号生成点击的日期（归零时分秒）
 */
function getClickedDateFromBase(base: Date, dayNum: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), dayNum, 0, 0, 0, 0);
}

/**
 * 辅助函数：生成随机的日历ID (1-3)
 */
function getRandomCalendarId(): string {
  return String(Math.floor(Math.random() * 3) + 1);
}

/** 辅助函数：重构数据 */
function extractAndFormatAppointments(data: TimeRangeAppointment) {
  if (!data?.dailyData) return [];

  const allAppointments = data.dailyData.flatMap(
    (dailyItem) => dailyItem.appointments || [],
  );

  const formattedAppointments = allAppointments.map((appointment) => {
    return {
      id: appointment.id,
      calendarId: getRandomCalendarId(),
      title: `${appointment.studentName} - ${appointment.counselorName}`,
      category: 'time',
      start: dayjs(appointment.appointmentStartTime).toISOString(),
      end: dayjs(appointment.appointmentEndTime).toISOString(),
      body: appointment.consultationType,
      location: appointment.location,
    };
  });

  return formattedAppointments;
}

/** 辅助函数：格式化日期 */
function formatDate(value: Dayjs) {
  switch (calendarView.value) {
    case CalendarViewType.Month: {
      return `${dayjs(value).format('YYYY年MM月')}`;
    }
    case CalendarViewType.Week: {
      return `${dayjs(value).startOf('week').format('YYYY年MM月DD日')} ~ ${dayjs(
        value,
      )
        .endOf('week')
        .format('DD日')}`;
    }
    default: {
      return `${dayjs(value).format('YYYY年MM月DD日')}`;
    }
  }
}

/** 加载时间范围预约数据 */
async function loadTimeRangeAppointmentData() {
  calendar.value?.clear();
  try {
    const counselorUserId =
      !isAllTeachers.value && userInfo.value?.id
        ? Number(userInfo.value.id)
        : undefined;
    const referenceDate = dayjs(selectedDate.value).format('YYYY-MM-DD');
    const data = await getTimeRangeAppointment({
      timeGranularity: calendarView.value,
      counselorUserId,
      referenceDate,
      offset: offset.value,
    });

    if (data) {
      const formattedAppointments = extractAndFormatAppointments(data);
      calendar.value.createEvents(formattedAppointments);
    }
  } catch (error) {
    console.error('加载时间范围预约数据失败:', error);
    message.error('加载时间范围预约数据失败');
  }
}

/** 点击全部老师按钮 */
async function handleAllTeachers() {
  isAllTeachers.value = !isAllTeachers.value;
  await loadTimeRangeAppointmentData();
}

/** 点击今日按钮 */
async function handleToday() {
  if (calendar.value) {
    offset.value = 0;
    calendar.value.today();
    // 更新选择器日期为今天
    selectedDate.value = dayjs();
    // 月视图时需要重新计算周数
    if (calendarView.value === CalendarViewType.Month) {
      updateVisibleWeeksCount();
    }
    await loadTimeRangeAppointmentData();
  }
}

/** 日期选择器变化 */
async function handleDateChange(value: Dayjs | string, _dateString: string) {
  console.log('handleDateChange', value, calendar.value);
  if (calendar.value && value) {
    const dateValue = typeof value === 'string' ? dayjs(value) : value;
    offset.value = 0;
    selectedDate.value = dateValue;
    calendar.value.setDate(dateValue.toDate());
    // 月视图时需要重新计算周数
    if (calendarView.value === CalendarViewType.Month) {
      updateVisibleWeeksCount();
    }
    await loadTimeRangeAppointmentData();
  }
}

/** 前移按钮点击 */
async function handlePrevious() {
  if (!calendar.value) return;

  const currentDate = calendar.value.getDate();
  const current = dayjs(
    typeof currentDate?.toDate === 'function'
      ? currentDate.toDate()
      : currentDate,
  );

  let newDate: Dayjs;
  switch (calendarView.value) {
    case CalendarViewType.Day: {
      newDate = current.subtract(1, 'day');
      break;
    }
    case CalendarViewType.Month: {
      newDate = current.subtract(1, 'month');
      break;
    }
    case CalendarViewType.Week: {
      newDate = current.subtract(1, 'week');
      break;
    }
    default: {
      return;
    }
  }

  offset.value -= 1;
  selectedDate.value = newDate;
  calendar.value.setDate(newDate.toDate());

  if (calendarView.value === CalendarViewType.Month) {
    updateVisibleWeeksCount();
  }
  await loadTimeRangeAppointmentData();
}

/** 后移按钮点击 */
async function handleNext() {
  if (!calendar.value) return;

  const currentDate = calendar.value.getDate();
  const current = dayjs(
    typeof currentDate?.toDate === 'function'
      ? currentDate.toDate()
      : currentDate,
  );

  let newDate: Dayjs;
  switch (calendarView.value) {
    case CalendarViewType.Day: {
      newDate = current.add(1, 'day');
      break;
    }
    case CalendarViewType.Month: {
      newDate = current.add(1, 'month');
      break;
    }
    case CalendarViewType.Week: {
      newDate = current.add(1, 'week');
      break;
    }
    default: {
      return;
    }
  }

  offset.value += 1;
  selectedDate.value = newDate;
  calendar.value.setDate(newDate.toDate());

  if (calendarView.value === CalendarViewType.Month) {
    updateVisibleWeeksCount();
  }
  await loadTimeRangeAppointmentData();
}

/** 切换日历视图 */
async function handleChangeCalendarView() {
  if (calendar.value) {
    calendar.value.changeView(calendarView.value);
    // 保持当前选择的日期，不要重置为今天
    calendar.value.setDate(selectedDate.value.toDate());
  }

  // 触发日期选择器重新格式化显示
  // 通过重新赋值相同的日期来触发响应式更新和格式化
  const currentDate = selectedDate.value;
  selectedDate.value = dayjs(currentDate);

  updateVisibleWeeksCount();
  await loadTimeRangeAppointmentData();
}

/** 初始化日历 */
async function initCalendar() {
  calendar.value = new Calendar(calendarContainer.value, {
    defaultView: calendarView.value,
    // 日历分组配置
    calendars: [
      {
        id: '1',
        name: '咨询一',
        backgroundColor: '#04DC7014',
        borderColor: '#04DC70',
        color: '#4C4C4D',
      },
      {
        id: '2',
        name: '咨询二',
        backgroundColor: '#1966FF14',
        borderColor: '#1966FF',
        color: '#4C4C4D',
      },
      {
        id: '3',
        name: '咨询三',
        backgroundColor: '#FF9C0514',
        borderColor: '#FF9C05',
        color: '#4C4C4D',
      },
    ],
    // 周视图
    week: {
      dayNames: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      taskView: false,
      startDayOfWeek: 1,
    },
    // 月视图
    month: {
      dayNames: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      startDayOfWeek: 1,
      isAlways6Weeks: false,
      visibleEventCount: 3,
    },
    // 模板
    template: {
      timegridDisplayPrimaryTime: ({ time }: any) => {
        // 将时间转换为24小时制格式
        const hour = time.getHours();
        return `${hour.toString().padStart(2, '0')}:00`;
      },
      allday: () => '全天',
      alldayTitle: () => '全天',
      monthGridHeaderExceed(hideEventCount: number) {
        return `更多预约(${hideEventCount + 3})`;
      },
    },
    // 主题样式
    theme: {
      common: {
        holiday: {
          color: '#000',
        },
      },
      week: {
        nowIndicatorLabel: { color: '#04dc70' },
        nowIndicatorToday: { border: '1px solid #04dc70' },
        nowIndicatorBullet: { backgroundColor: '#04dc70' },
        nowIndicatorPast: { border: '1px dashed #04dc70' },
      },
      month: {
        holidayExceptThisMonth: { color: '#B0B1B2' },
        dayExceptThisMonth: { color: '#B0B1B2' },
        gridCell: {
          headerHeight: 31,
          footerHeight: 0,
        },
      },
    },
  });

  // 加载预约数据
  await loadTimeRangeAppointmentData();
}

/**
 * 根据当前月份动态计算需要显示的周数（5 或 6），
 * 当正好 5 周即可容纳时，隐藏多出的纯下月周。
 */
function updateVisibleWeeksCount() {
  if (!calendar.value) return;
  if (calendar.value.getViewName() !== 'month') return;

  // 以日历当前渲染的日期为准，避免与选择器不同步导致裁剪错误
  const tz = calendar.value.getDate();
  const current = dayjs(
    typeof tz?.toDate === 'function' ? tz.toDate() : tz,
  ).startOf('month');
  const startDayOfWeek = 0; // 与默认配置保持一致：周日为 0
  let offset = current.day() - startDayOfWeek;
  if (offset < 0) offset += 7;

  const totalDays = current.daysInMonth();
  const weeksNeeded = Math.ceil((offset + totalDays) / 7); // 5 或 6

  // 为避免裁掉月初的有效天：
  // - 若只需 5 周，先将日期锚定到当月 1 号，再设 5 周 → 裁掉末尾周
  // - 若需 6 周，恢复为 6
  if (weeksNeeded <= 5) {
    calendar.value.setDate(current.toDate());
    calendar.value.setOptions({ month: { visibleWeeksCount: 5 } } as any);
  } else {
    calendar.value.setOptions({ month: { visibleWeeksCount: 6 } } as any);
  }
  calendar.value.render();
}

/**
 * 监听日历事件
 */
// 事件监听器清理函数
let removeCalendarEvents: (() => void) | null = null;

/** 设置日历事件监听器 */
function setupCalendarEvents() {
  if (!calendar.value) return;

  // 先清理之前的事件监听器
  if (removeCalendarEvents) {
    removeCalendarEvents();
  }

  // 监听选择事件：点击或拖拽选择日期/时间段
  const handleSelectDateTime = (props: any) => {
    const { start, end } = props;
    const view = calendar.value?.getViewName();

    if (view !== 'month') {
      // 周/日视图：选择时间段
      const startTime = toDateLike(start);
      const endTime = toDateLike(end);
      // 提取日期部分（不包含时间）
      const dateOnly = new Date(startTime);
      dateOnly.setHours(0, 0, 0, 0);
      emit('timeClick', { date: dateOnly, start: startTime, end: endTime });
    }
  };

  // 监听事件点击
  const handleClickEvent = ({ event }: any) => {
    const eventDate = toDateLike(event.start);
    emit('eventClick', { event, date: eventDate });
  };

  // 绑定事件监听器
  calendar.value.on('selectDateTime', handleSelectDateTime);
  calendar.value.on('clickEvent', handleClickEvent);

  // 设置清理函数
  removeCalendarEvents = () => {
    if (calendar.value) {
      calendar.value.off('selectDateTime', handleSelectDateTime);
      calendar.value.off('clickEvent', handleClickEvent);
    }
  };
}

/** 设置月视图单选 */
function setupMonthSingleSelect() {
  if (!calendarContainer.value) return;

  const container = calendarContainer.value;
  /** 辅助函数：获取月视图单元格元素 */
  function getMonthCellElement(node: HTMLElement | null): HTMLElement | null {
    let current: HTMLElement | null = node;
    while (current && current !== container) {
      if (current.classList?.contains('toastui-calendar-daygrid-cell')) {
        return current;
      }
      current = current.parentElement as HTMLElement | null;
    }
    return null;
  }

  const handleClick = (evt: MouseEvent) => {
    if (!calendar.value || calendar.value.getViewName() !== 'month') return;
    const target = evt.target as HTMLElement | null;
    const cell = getMonthCellElement(target);
    if (!cell) return;

    // 最简逻辑：清空 → 当前格子加类
    const selected = container.querySelectorAll('.ly-month-selected');
    selected.forEach((el) => el.classList.remove('ly-month-selected'));
    cell.classList.add('ly-month-selected');

    // 同步向外发出点击的日期信息
    const dateEl = cell.querySelector(
      '.toastui-calendar-grid-cell-date',
    ) as HTMLElement | null;
    if (dateEl && calendar.value) {
      const dayNum = Number.parseInt((dateEl.textContent || '').trim(), 10);
      if (Number.isFinite(dayNum)) {
        const tz = calendar.value.getDate();
        const base = toDateLike(tz as any);
        const clicked = getClickedDateFromBase(base, dayNum);
        const targetEl = evt?.target as HTMLElement | null;
        const isMoreBtn = isMoreHeaderTarget(targetEl);

        if (isMoreBtn) {
          emit('moreEventsClick', {
            counselorUserId: userInfo.value?.id,
            date: clicked,
            target: null,
          });
        } else {
          emit('monthCellClick', { date: clicked });
        }
      }
    }
  };

  container.addEventListener('click', handleClick);
  removeMonthSingleSelect = () => {
    container.removeEventListener('click', handleClick as any);
  };
}

/** 监听日历视图变化 */
watch(
  calendarView,
  (newVal) => {
    if (newVal === CalendarViewType.Day) {
      leftArrowTip.value = '前一天';
      rightArrowTip.value = '后一天';
      pickerType.value = 'date';
    } else if (newVal === CalendarViewType.Month) {
      leftArrowTip.value = '上个月';
      rightArrowTip.value = '下个月';
      pickerType.value = CalendarViewType.Month;
    } else {
      leftArrowTip.value = '前一周';
      rightArrowTip.value = '后一周';
      pickerType.value = CalendarViewType.Week;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await initCalendar();
  setupMonthSingleSelect();
  setupCalendarEvents();
  updateVisibleWeeksCount();
});

onUnmounted(() => {
  if (removeMouseListeners) {
    removeMouseListeners();
    removeMouseListeners = null;
  }
  if (removeMonthSingleSelect) {
    removeMonthSingleSelect();
    removeMonthSingleSelect = null;
  }
  if (removeCalendarEvents) {
    removeCalendarEvents();
    removeCalendarEvents = null;
  }
});

defineExpose({
  loadTimeRangeAppointmentData,
});
</script>

<template>
  <div
    class="flex min-h-[685px] flex-1 flex-col overflow-hidden rounded-xl bg-white"
  >
    <!-- 日历头部 -->
    <header class="flex shrink-0 items-center justify-between p-6">
      <!-- 左侧切换日期 -->
      <div class="flex items-center gap-4">
        <div class="mr-4 text-xl font-semibold">访谈日历</div>
        <LyButton size="middle" @click="handleToday">今日</LyButton>
        <LyButton
          size="middle"
          @click="handleAllTeachers"
          :type="isAllTeachers ? 'success' : 'default'"
        >
          全部老师
        </LyButton>
        <Tooltip :title="leftArrowTip" placement="bottom">
          <LyButton
            type="text"
            size="middle"
            class="h-8 w-8"
            @click="handlePrevious"
          >
            <template #icon>
              <IconifyIcon
                icon="material-symbols:chevron-left-rounded"
                class="size-6 text-gray-600"
              />
            </template>
          </LyButton>
        </Tooltip>
        <Tooltip :title="rightArrowTip" placement="bottom">
          <LyButton
            type="text"
            size="middle"
            class="h-8 w-8"
            @click="handleNext"
          >
            <template #icon>
              <IconifyIcon
                icon="material-symbols:chevron-right-rounded"
                class="size-6 text-gray-600"
              />
            </template>
          </LyButton>
        </Tooltip>

        <!-- 日期选择器 -->
        <DatePicker
          v-model:value="selectedDate"
          :picker="pickerType as PickerMode"
          show-today
          :allow-clear="false"
          input-read-only
          :format="formatDate"
          @change="handleDateChange"
        />
      </div>

      <!-- 右侧切换日历视图 -->
      <div class="flex items-center">
        <RadioGroup
          v-model:value="calendarView"
          button-style="solid"
          @change="handleChangeCalendarView"
        >
          <RadioButton value="day">日</RadioButton>
          <RadioButton value="week">周</RadioButton>
          <RadioButton value="month">月</RadioButton>
        </RadioGroup>
      </div>
    </header>
    <!-- 日历日程组件 -->
    <main class="flex-1 overflow-y-scroll" ref="calendarContainer"></main>
  </div>
</template>

<style scoped lang="scss">
:deep(.toastui-calendar-weekday-grid-date-decorator) {
  color: #04dc70 !important;
  background-color: transparent !important;
}

:deep(.toastui-calendar-template-monthDayName) {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #000 !important;
}

:deep(.toastui-calendar-day-names.toastui-calendar-month) {
  height: 80px;
  padding: 10px 0 40px;
  border-top: 0.5px #eaebed solid;

  .toastui-calendar-day-name-item {
    padding: 0 20px !important;
  }
}

:deep(.toastui-calendar-day-names .toastui-calendar-week) {
  .toastui-calendar-day-name-item,
  .toastui-calendar-day-name__name {
    font-weight: 600 !important;
    color: #000;
  }
}

:deep(.toastui-calendar-grid-cell-date) {
  padding: 0 10px !important;
}

:deep(.toastui-calendar-daygrid-cell) {
  border-left: 0 !important;

  .toastui-calendar-grid-cell-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
  }
}

:deep(.toastui-calendar-weekday-grid) {
  border-top: 0.5px #eaebed solid;
}

:deep(.toastui-calendar-template-monthGridHeader) {
  font-size: 18px !important;
  font-weight: 600 !important;
}

:deep(.toastui-calendar-column .toastui-calendar-grid-selection) {
  right: 0 !important;
  left: 0 !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 !important;
}

:deep(.toastui-calendar-grid-cell-more-events) {
  width: 68px !important;

  .toastui-calendar-template-monthGridHeaderExceed {
    width: 100% !important;
    text-align: end !important;
  }
}

:deep(.toastui-calendar-events) {
  margin-right: 0 !important;

  .toastui-calendar-resize-handler-x {
    display: none !important;
  }
}

/* 月份视图：所有日期格子均为手型指针 */
:deep(.toastui-calendar-month .toastui-calendar-daygrid-cell),
:deep(.toastui-calendar-month .toastui-calendar-grid-cell) {
  padding: 3px !important;
  cursor: pointer !important;
}

/* 选中态提高优先级，避免被内部样式清理 */
.ly-month-selected,
:deep(.toastui-calendar-daygrid-cell.ly-month-selected) {
  background-color: #f7f8fa !important;
  transition: all 0.3s ease-in-out !important;
}

:deep(.toastui-calendar-allday .toastui-calendar-grid-selection) {
  width: 14.2% !important;
  background-color: #f7f8fa !important;
  border: 0 !important;
  transition: all 0.3s ease-in-out !important;
}

:deep(.toastui-calendar-popup-overlay),
:deep(.toastui-calendar-floating-layer) {
  display: none !important;
}

:deep(.toastui-calendar-month .toastui-calendar-grid-selection) {
  display: none !important;
}

:deep(.toastui-calendar-panel-title) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 强制覆盖 周/日视图 选区为品牌绿色，包含内外容器，提升权重 */
:deep(.toastui-calendar-week .toastui-calendar-grid-selection),
:deep(.toastui-calendar-day .toastui-calendar-grid-selection),
:deep(.toastui-calendar-timegrid .toastui-calendar-grid-selection) {
  background-color: rgb(4 220 112 / 8%) !important;
  border: 1px solid #04dc70 !important;
  border-radius: 4px !important;

  .toastui-calendar-grid-selection-label {
    color: #04dc70 !important;
  }
}

/* 为 calendar 事件添加自定义公共样式 */
:deep(.toastui-calendar-weekday-event-block) {
  /* 圆角 */
  border-radius: 4px !important;

  /* 悬停效果 */
  &:hover {
    transform: scale(1.05);
    transition: all 0.3s ease-in-out;
  }

  .toastui-calendar-template-time {
    line-clamp: 1 !important;
    font-size: 12px !important;
    font-weight: 400 !important;
  }

  .toastui-calendar-weekday-resize-handle.toastui-calendar-handle-y {
    display: none !important;
  }
}

/* 为 data-calendar-id="first" 的事件添加自定义样式 */
:deep([data-calendar-id='1']) {
  /* 事件背景色 */
  background-color: #04dc7014 !important;

  .toastui-calendar-weekday-event-dot {
    background-color: #04dc70 !important;
  }
}

/* 为 data-calendar-id="second" 的事件添加自定义样式 */
:deep([data-calendar-id='2']) {
  background-color: #1966ff14 !important;

  .toastui-calendar-weekday-event-dot {
    background-color: #1966ff !important;
  }
}

/* 为 data-calendar-id="more" 的事件添加自定义样式 */
:deep([data-calendar-id='3']) {
  background-color: #ff9c0514 !important;

  .toastui-calendar-weekday-event-dot {
    background-color: #ff9c05 !important;
  }
}
</style>
