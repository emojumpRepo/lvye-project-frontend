<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  DatePicker,
  Form,
  Input,
  message,
  Select,
  TimeRangePicker,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { getEventStyleOptions } from '#/views/counseling/data';

// 导入 composables
import { useStudentSearch } from './composables/useStudentSearch';
import { useTimeCalculation } from './composables/useTimeCalculation';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

dayjs.extend(isBetween);

// ==================== 使用 composables ====================
const { calculateDurationText, getDisabledTimeConfig } = useTimeCalculation();

const {
  studentSearchState,
  searchingText,
  studentWarning,
  fetchStudents,
  handleStudentChange,
  clearSearchState,
} = useStudentSearch();

// ==================== 基础状态 ====================
const currentDate = ref('');
const timeRange = ref<{
  date: Date;
  end: Date | string;
  start: Date | string;
}>();
const formRef = ref();
const showConfirmDialog = ref(false);
// 删除时间传递功能

// ==================== 表单相关 ====================
const consultTypeOptions = ref([
  '初次访谈',
  '复诊访谈',
  '紧急访谈',
  '家长访谈',
]);

const teacherOptions = [
  { label: '张老师', value: 'teacher1' },
  { label: '李老师', value: 'teacher2' },
  { label: '王老师', value: 'teacher3' },
  { label: '赵老师', value: 'teacher4' },
];

const form = ref({
  student: undefined as
    | undefined
    | {
        class: string;
        label: string;
        name: string;
        studentNo: string;
        value: string;
      },
  consultDate: undefined as dayjs.Dayjs | undefined,
  consultTime: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
  consultType: '',
  consultTeacher: '',
  consultLocation: '',
  consultFocus: '',
});

const rules = ref({
  student: [{ required: true, message: '请选择学生' }],
  consultDate: [{ required: true, message: '请选择访谈日期' }],
  consultTime: [{ required: true, message: '请选择访谈时间' }],
  consultType: [{ required: true, message: '请选择访谈类型' }],
  consultTeacher: [{ required: true, message: '请选择访谈老师' }],
});

// ==================== 自定义访谈类型 ====================
const showAddTypeInput = ref(false);
const newTypeName = ref('');

// ==================== 周视图相关 ====================
const weekViewDate = ref(dayjs());

// ==================== 时间冲突检查 ====================
const timeError = ref('');
const conflictError = ref('');
const dateTip = ref('');
const holidayDates = ['2025-01-01', '2025-10-01'];
const myAppointments = [
  { date: '2025-08-05', start: '15:00', end: '16:00', title: '李小红' },
];

// ==================== 计算属性 ====================
const durationText = computed(() => {
  if (!form.value.consultTime?.[0] || !form.value.consultTime?.[1]) return '';

  return calculateDurationText({
    start: form.value.consultTime[0],
    end: form.value.consultTime[1],
  });
});

// ==================== 周视图相关函数 ====================
function formatWeekViewDate(value: dayjs.Dayjs) {
  return [
    `${dayjs(value).startOf('week').format('YYYY-MM-DD')}`,
    `${dayjs(value).endOf('week').format('YYYY-MM-DD')}`,
  ];
}

function handlePreviousWeek() {
  weekViewDate.value = weekViewDate.value.subtract(1, 'week');
}

function handleNextWeek() {
  weekViewDate.value = weekViewDate.value.add(1, 'week');
}

function getWeekDays() {
  const startOfWeek = weekViewDate.value.startOf('week');
  const days = [];

  for (let i = 0; i < 7; i++) {
    const currentDay = startOfWeek.add(i, 'day');
    days.push({
      dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
      date: currentDay.format('M/D'),
      fullDate: currentDay,
    });
  }

  return days;
}

// ==================== 自定义访谈类型函数 ====================
function showAddCustomType() {
  showAddTypeInput.value = true;
  newTypeName.value = '';
  formRef.value?.clearValidate('consultType');
}

function confirmAddType() {
  if (!newTypeName.value.trim()) {
    message.error('请输入自定义类型名称');
    return;
  }

  consultTypeOptions.value.push(newTypeName.value);
  form.value.consultType = newTypeName.value;
  showAddTypeInput.value = false;
  newTypeName.value = '';
}

function cancelAddType() {
  showAddTypeInput.value = false;
  newTypeName.value = '';
  if (!form.value.consultType) {
    formRef.value?.validateFields(['consultType']);
  }
}

// ==================== 时间冲突检查函数 ====================
function onDateChange(value: dayjs.Dayjs | string, _dateString: string) {
  dateTip.value = '';
  const d = dayjs(typeof value === 'string' ? value : value.toString());
  if (holidayDates.some((h) => d.isSame(dayjs(h), 'day'))) {
    dateTip.value = '⚠️ 所选日期为节假日';
  }
}

function onTimeRangeChange(
  value: [dayjs.Dayjs | null | string, dayjs.Dayjs | null | string] | null,
  _dateString?: [string, string],
) {
  timeError.value = '';
  conflictError.value = '';
  if (!value || !form.value.consultDate) return;

  if (value[0] === null || value[1] === null) return;

  const startDT = dayjs.isDayjs(value[0])
    ? value[0]
    : dayjs(value[0] as string);
  const endDT = dayjs.isDayjs(value[1]) ? value[1] : dayjs(value[1] as string);

  if (startDT.isBefore(dayjs())) {
    timeError.value = '不能选择过去时间';
    return;
  }

  const conflicts = myAppointments.filter((a) =>
    dayjs(a.date).isSame(dayjs(form.value.consultDate), 'day'),
  );

  for (const c of conflicts) {
    const cStart = dayjs(`${c.date} ${c.start}`);
    const cEnd = dayjs(`${c.date} ${c.end}`);
    const overlap = startDT.isBefore(cEnd) && endDT.isAfter(cStart);
    if (overlap) {
      conflictError.value = `❌ 该时间段您已有其他预约：${c.title}(${c.start}-${c.end})`;
      break;
    }
  }
}

// ==================== 表单提交相关 ====================
function submitConsult() {
  formRef.value?.validate().then(() => {
    showConfirmDialog.value = true;
  });
}

function handleConfirmCreate() {
  // 这里可以调用API创建预约
  showConfirmDialog.value = false;
  drawerApi.close();
  emit('refresh');
}

function resetForm() {
  formRef.value?.resetFields();
  clearSearchState();
  timeError.value = '';
  conflictError.value = '';
  dateTip.value = '';
}

// ==================== Drawer 配置 ====================
const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[1200px]',
  contentClass: 'p-0',
  confirmText: '创建预约',
  onConfirm: submitConsult,
  onClosed: () => {
    resetForm();
    drawerApi.close();
  },
  onOpenChange: (isOpen: boolean) => {
    if (isOpen) {
      const data = drawerApi.getData<{
        currentDate: string;
        timeRange?: { date: Date; end: Date | string; start: Date | string };
      }>();
      currentDate.value = data.currentDate;
      timeRange.value = data.timeRange;
    }
  },
});

// ==================== 监听器 ====================
watch(
  () => form.value.student,
  (val) => {
    handleStudentChange(val);
  },
);

// 监听 currentDate 变化，更新周视图以及表单日期
watch(
  () => currentDate.value,
  (newDate) => {
    if (newDate) {
      if (dayjs.isDayjs(newDate)) {
        weekViewDate.value = newDate;
        form.value.consultDate = newDate;
      } else {
        weekViewDate.value = dayjs(newDate);
        form.value.consultDate = dayjs(newDate);
      }
    }
  },
  { immediate: true },
);

// 监听 timeRange 变化，更新表单时间
watch(
  () => timeRange.value,
  (val) => {
    if (val?.start && val?.end) {
      // 处理时间格式
      const startTimeStr =
        typeof val.start === 'string'
          ? val.start
          : dayjs(val.start).format('HH:mm');
      const endTimeStr =
        typeof val.end === 'string' ? val.end : dayjs(val.end).format('HH:mm');

      // 创建完整的日期时间对象
      const start = dayjs(`${currentDate.value} ${startTimeStr}`);
      const end = dayjs(`${currentDate.value} ${endTimeStr}`);

      form.value.consultTime = [start, end];
      form.value.consultDate = dayjs(`${currentDate.value} ${startTimeStr}`);
    }
  },
);

// ==================== 工具函数 ====================
function disabledRangeTime(
  _date: dayjs.Dayjs | null | string,
  _type: 'end' | 'start',
) {
  return getDisabledTimeConfig(form.value.consultDate);
}
</script>

<template>
  <Drawer>
    <template #title>
      <div class="flex items-center gap-2 text-lg font-semibold">
        <img
          src="../../../static/icons/consulting/icon_yuyue.svg"
          class="w-5"
        />
        <span>新建预约</span>
      </div>
    </template>
    <!-- 抽屉内容 -->
    <div class="grid h-full w-full grid-cols-2 overflow-hidden">
      <!-- 左侧预约访谈部分 -->
      <div class="col-span-1 overflow-y-auto border-r border-[#F2F3F5] p-6">
        <Form ref="formRef" :model="form" :rules="rules" class="w-full">
          <!-- 学生选择 -->
          <LyLabel
            title="学生选择"
            :required="true"
            custom-title-class="font-semibold text-sm"
          />
          <Form.Item name="student">
            <Select
              v-model:value="form.student"
              show-search
              label-in-value
              placeholder="输入学生姓名或学号进行搜索"
              style="width: 100%"
              :filter-option="false"
              :not-found-content="
                studentSearchState.fetching
                  ? undefined
                  : searchingText
                    ? '未找到匹配学生'
                    : null
              "
              :options="studentSearchState.data"
              @search="fetchStudents"
            >
              <template v-if="studentSearchState.fetching" #notFoundContent>
                正在搜索学生...
              </template>
              <template
                v-else
                #option="{ studentNo, class: studentClass, name }"
              >
                <div class="flex flex-col">
                  <div class="font-medium">{{ name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ studentNo }} · {{ studentClass }}
                  </div>
                </div>
              </template>
              <template #suffixIcon>
                <IconifyIcon
                  icon="tabler:search"
                  class="size-4 text-[#979899]"
                />
              </template>
            </Select>
            <div v-if="studentWarning" class="mt-1 text-xs text-[#faad14]">
              {{ studentWarning }}
            </div>
          </Form.Item>

          <!-- 访谈时间 -->
          <LyLabel
            title="访谈时间"
            :required="true"
            custom-title-class="font-semibold text-sm"
          />
          <div class="flex w-full items-center gap-4">
            <Form.Item name="consultDate" :class="{ 'mb-0': durationText }">
              <DatePicker
                v-model:value="form.consultDate"
                placeholder="请选择访谈日期"
                show-today
                class="w-full"
                :disabled-date="
                  (current) =>
                    current && current.isBefore(dayjs().startOf('day'))
                "
                @change="onDateChange"
              />
            </Form.Item>
            <Form.Item
              name="consultTime"
              class="flex-1"
              :class="{ 'mb-0': durationText }"
            >
              <TimeRangePicker
                v-model:value="form.consultTime"
                class="w-full"
                :disabled-time="disabledRangeTime"
                @change="onTimeRangeChange"
              />
            </Form.Item>
          </div>
          <div
            v-if="durationText"
            class="mb-6 mt-2 flex items-center gap-2 rounded bg-[#04DC7014] px-4 py-2 text-sm text-[#04DC70]"
          >
            <IconifyIcon
              icon="si:clock-alt-fill"
              class="size-4 text-[#04DC70]"
            />
            {{ durationText }}
          </div>

          <!-- 访谈类型 -->
          <LyLabel
            title="访谈类型"
            :required="true"
            custom-title-class="font-semibold text-sm"
          />
          <Form.Item
            name="consultType"
            :rules="showAddTypeInput ? [] : rules.consultType"
          >
            <div class="flex flex-wrap gap-2">
              <LyButton
                v-for="option in consultTypeOptions"
                :key="option"
                size="middle"
                class="w-18 h-9"
                :class="{
                  'border border-[#04DC70] bg-[#04DC7014] text-[#04DC70]':
                    form.consultType === option,
                }"
                @click="form.consultType = option"
              >
                {{ option }}
              </LyButton>
              <!-- 添加按钮或输入框 -->
              <template v-if="!showAddTypeInput">
                <LyButton
                  size="middle"
                  class="w-18 h-9"
                  @click="showAddCustomType"
                >
                  + 添加
                </LyButton>
              </template>

              <!-- 自定义类型输入框 -->
              <template v-else>
                <div class="flex items-center gap-2">
                  <Input
                    v-model:value="newTypeName"
                    placeholder="输入自定义类型名称"
                    class="w-40"
                    @keyup.enter="confirmAddType"
                  />
                  <LyButton type="success" size="small" @click="confirmAddType">
                    确认
                  </LyButton>
                  <LyButton size="small" @click="cancelAddType">
                    取消
                  </LyButton>
                </div>
              </template>
            </div>
          </Form.Item>

          <!-- 访谈老师 -->
          <LyLabel
            title="访谈老师"
            :required="true"
            custom-title-class="font-semibold text-sm"
          />
          <Form.Item name="consultTeacher">
            <Select
              v-model:value="form.consultTeacher"
              placeholder="请选择老师"
              class="w-full"
              :options="teacherOptions"
            />
          </Form.Item>

          <!-- 访谈地点 -->
          <LyLabel
            title="访谈地点"
            custom-title-class="font-semibold text-sm"
          />
          <Form.Item name="consultLocation">
            <Input
              v-model:value="form.consultLocation"
              placeholder="请填写地点"
              class="w-full"
            />
          </Form.Item>

          <!-- 访谈重点 -->
          <LyLabel
            title="访谈重点"
            custom-title-class="font-semibold text-sm"
          />
          <Form.Item name="consultFocus">
            <Input.TextArea
              v-model:value="form.consultFocus"
              placeholder="重点内容描述..."
              :rows="4"
              :maxlength="200"
              show-count
              class="w-full"
            />
          </Form.Item>
        </Form>
      </div>

      <!-- 右侧周视图部分 -->
      <div class="col-span-1 overflow-y-auto p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-semibold">周视图预览</h3>
          <div class="flex items-center gap-2">
            <div
              class="flex h-8 w-8 cursor-pointer items-center justify-center"
              @click="handlePreviousWeek"
            >
              <IconifyIcon
                icon="tabler:caret-left-filled"
                class="size-4 text-[#979899]"
              />
            </div>
            <span class="text-base">
              {{ formatWeekViewDate(weekViewDate)[0] }}
              <span class="mx-1">-</span>
              {{ formatWeekViewDate(weekViewDate)[1] }}
            </span>
            <div
              class="flex h-8 w-8 cursor-pointer items-center justify-center"
              @click="handleNextWeek"
            >
              <IconifyIcon
                icon="tabler:caret-right-filled"
                class="size-4 text-[#979899]"
              />
            </div>
          </div>
        </div>

        <!-- 周视图内容 -->
        <div class="space-y-4">
          <!-- 动态生成一周的每一天 -->
          <div
            v-for="(dayInfo, index) in getWeekDays()"
            :key="dayInfo.fullDate.format('YYYY-MM-DD')"
            class="box-border flex max-h-[152px] flex-col overflow-hidden rounded-lg border border-gray-200 p-4"
          >
            <div class="mb-2 flex shrink-0 items-center justify-between">
              <span class="font-medium">{{ dayInfo.dayName }}</span>
              <span class="text-sm text-gray-500">{{ dayInfo.date }}</span>
            </div>

            <!-- 如果是周一（index === 1），显示事件列表 -->
            <div
              v-if="index === 1"
              class="flex-1 space-y-2 overflow-y-auto text-xs text-[#4C4C4D]"
            >
              <div v-for="i in 5" :key="i">
                <div
                  class="flex items-center gap-2 rounded p-1.5"
                  :style="{
                    backgroundColor:
                      getEventStyleOptions(i)?.backgroundColor || '#f5f5f5',
                  }"
                >
                  <span
                    class="h-2 w-2 rounded-full"
                    :style="{
                      backgroundColor:
                        getEventStyleOptions(i)?.dotColor || '#ccc',
                    }"
                  ></span>
                  <span>课程表的时间内容...</span>
                </div>
              </div>
            </div>

            <!-- 其他天显示暂无预约 -->
            <div v-else class="text-sm text-gray-400">暂无预约</div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
  <!-- 确认创建弹窗 -->
  <ConfirmDialog
    v-model:show="showConfirmDialog"
    confirm-text="确认创建"
    cancel-text="取消"
    @confirm="handleConfirmCreate"
  >
    <template #title>
      <div class="flex items-center gap-3 text-lg font-semibold">
        <IconifyIcon
          icon="tabler:calendar-check"
          class="size-5 text-[#04DC70]"
        />
        确认创建访谈预约
      </div>

      <div class="py-4">
        <!-- 预约信息卡片 -->
        <div class="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4">
          <div class="space-y-3">
            <!-- 学生信息 -->
            <div class="flex items-center gap-3">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-[#04DC7014]"
              >
                <IconifyIcon icon="tabler:user" class="size-4 text-[#04DC70]" />
              </div>
              <div>
                <div class="text-sm text-[#6B7280]">学生选择</div>
                <div class="font-medium text-[#1F2937]">
                  {{ form.student?.label || '未选择' }}
                </div>
              </div>
            </div>

            <!-- 时间信息 -->
            <div class="flex items-center gap-3">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F614]"
              >
                <IconifyIcon
                  icon="tabler:clock"
                  class="size-4 text-[#3B82F6]"
                />
              </div>
              <div>
                <div class="text-sm text-[#6B7280]">访谈时间</div>
                <div class="font-medium text-[#1F2937]">
                  {{
                    form.consultDate
                      ? dayjs(form.consultDate).format('YYYY年MM月DD日')
                      : '未选择'
                  }}
                  {{ form.consultTime?.[0]?.format('HH:mm') }}-{{
                    form.consultTime?.[1]?.format('HH:mm')
                  }}
                </div>
              </div>
            </div>

            <!-- 地点信息 -->
            <div v-if="form.consultLocation" class="flex items-center gap-3">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-[#F59E0B14]"
              >
                <IconifyIcon
                  icon="tabler:map-pin"
                  class="size-4 text-[#F59E0B]"
                />
              </div>
              <div>
                <div class="text-sm text-[#6B7280]">访谈地点</div>
                <div class="font-medium text-[#1F2937]">
                  {{ form.consultLocation }}
                </div>
              </div>
            </div>

            <!-- 类型信息 -->
            <div class="flex items-center gap-3">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B5CF614]"
              >
                <IconifyIcon icon="tabler:tag" class="size-4 text-[#8B5CF6]" />
              </div>
              <div>
                <div class="text-sm text-[#6B7280]">访谈类型</div>
                <div class="font-medium text-[#1F2937]">
                  {{ form.consultType || '未选择' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 通知提示 -->
        <div class="mt-4 flex items-center gap-2 rounded-lg bg-[#04DC7014] p-3">
          <IconifyIcon icon="tabler:bell" class="size-4 text-[#04DC70]" />
          <span class="text-sm text-[#04DC70]">
            确认后将向学生发送预约通知
          </span>
        </div>
      </div>
    </template>
  </ConfirmDialog>
</template>
