<script setup lang="ts">
import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

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

import { getConsultationRecord } from '#/api/psychology/consultation';
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

// ==================== 内部类型定义与工具 ====================
interface StudentOption {
  class: string;
  label: string;
  name: string;
  studentNo: string;
  value: string;
}

interface FormModel {
  student: StudentOption | undefined;
  consultDate: dayjs.Dayjs | undefined;
  consultTime: [dayjs.Dayjs, dayjs.Dayjs] | undefined;
  consultType: string;
  consultTeacher: string;
  consultLocation: string;
  consultFocus: string;
}

interface DrawerSnapshot {
  currentDate: string;
  form: FormModel;
  timeRange:
    | undefined
    | { date: Date; end: Date | string; start: Date | string };
}

function buildStudentOption(res: any): StudentOption {
  return {
    label: [res.studentName, res.studentNumber, res.className]
      .filter(Boolean)
      .join(' - '),
    name: res.studentName || '',
    studentNo: res.studentNumber || '',
    class: res.className || '',
    value: String(res.studentProfileId ?? ''),
  } as any;
}

function mapConsultType(
  rawType: number | string | undefined,
  options: string[],
): string {
  if (typeof rawType === 'string') {
    const incoming = rawType.trim();
    if (!incoming) return '';
    if (!options.includes(incoming)) options.push(incoming);
    return incoming;
  }
  if (typeof rawType === 'number') {
    return options[rawType - 1] ?? options[rawType] ?? '';
  }
  return '';
}

function takeSnapshot(): DrawerSnapshot {
  return {
    currentDate: currentDate.value,
    form: {
      student: form.value.student ? { ...form.value.student } : undefined,
      consultDate: form.value.consultDate
        ? dayjs(form.value.consultDate)
        : undefined,
      consultTime: form.value.consultTime
        ? [dayjs(form.value.consultTime[0]), dayjs(form.value.consultTime[1])]
        : undefined,
      consultType: form.value.consultType,
      consultTeacher: form.value.consultTeacher,
      consultLocation: form.value.consultLocation,
      consultFocus: form.value.consultFocus,
    },
    timeRange: timeRange.value
      ? {
          date: new Date(timeRange.value.date),
          start:
            typeof timeRange.value.start === 'string'
              ? timeRange.value.start
              : new Date(timeRange.value.start as Date),
          end:
            typeof timeRange.value.end === 'string'
              ? timeRange.value.end
              : new Date(timeRange.value.end as Date),
        }
      : undefined,
  };
}

function restoreSnapshot(snap: DrawerSnapshot) {
  form.value.student = snap.form.student as any;
  form.value.consultDate = snap.form.consultDate as any;
  form.value.consultTime = snap.form.consultTime as any;
  form.value.consultType = snap.form.consultType;
  form.value.consultTeacher = snap.form.consultTeacher;
  form.value.consultLocation = snap.form.consultLocation;
  form.value.consultFocus = snap.form.consultFocus;
  currentDate.value = snap.currentDate;
  timeRange.value = snap.timeRange as any;
}

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

// ==================== 咨询预约详情基础状态 ====================
const currentConsultationRecordId = ref<number>();
const currentConsultationRecord =
  ref<PsychologyConsultationApi.ConsultationRecord>();
const isEdit = ref(false); // 是否是编辑状态
const isReadOnly = computed(
  () => !!currentConsultationRecordId.value && !isEdit.value,
);
// 用于“取消编辑”时恢复到详情初始状态
const originalSnapshot = ref<DrawerSnapshot | null>(null);
const isDetail = computed(() => !!currentConsultationRecordId.value);
const footerSecondaryText = computed(() =>
  isDetail.value ? (isReadOnly.value ? '关闭' : '取消') : '取消',
);
const footerPrimaryText = computed(() =>
  isDetail.value ? (isReadOnly.value ? '编辑' : '保存') : '确认创建',
);
function onFooterSecondaryClick() {
  // 详情只读：关闭
  if (isDetail.value && isReadOnly.value) {
    drawerApi.close();
    return;
  }
  // 详情编辑：恢复快照并切回只读
  if (isDetail.value && isEdit.value) {
    if (originalSnapshot.value) {
      restoreSnapshot(originalSnapshot.value);
    }
    isEdit.value = false;
    return;
  }
  // 其他：关闭
  drawerApi.close();
}
function onFooterPrimaryClick() {
  if (isDetail.value && isReadOnly.value) {
    isEdit.value = true;
    return;
  }
  submitConsult();
}

// ==================== 创建咨询预约的基础状态 ====================
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
  '初次咨询',
  '复诊咨询',
  '紧急咨询',
  '家长咨询',
]);

const teacherOptions = [
  { label: '张老师', value: 'teacher1' },
  { label: '李老师', value: 'teacher2' },
  { label: '王老师', value: 'teacher3' },
  { label: '赵老师', value: 'teacher4' },
];

const form = ref<FormModel>({
  student: undefined,
  consultDate: undefined,
  consultTime: undefined,
  consultType: '',
  consultTeacher: '',
  consultLocation: '',
  consultFocus: '',
});

const rules = ref({
  student: [{ required: true, message: '请选择学生' }],
  consultDate: [{ required: true, message: '请选择咨询日期' }],
  consultTime: [{ required: true, message: '请选择咨询时间' }],
  consultType: [{ required: true, message: '请选择咨询类型' }],
  consultTeacher: [{ required: true, message: '请选择咨询老师' }],
});

// ==================== 自定义咨询类型 ====================
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

// ==================== 自定义咨询类型函数 ====================
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

// ==================== 咨询预约详情相关 ====================

async function loadConsultationRecord() {
  if (!currentConsultationRecordId.value) {
    return;
  }
  const res = await getConsultationRecord(currentConsultationRecordId.value);
  currentConsultationRecord.value = res;
  // 将详情数据回填到表单
  try {
    const startMs = (res as any).appointmentStartTime as number | undefined;
    const endMs = (res as any).appointmentEndTime as number | undefined;

    // 回填学生信息（Select 使用 label-in-value）
    form.value.student = buildStudentOption(res);

    // 回填日期与时间
    if (startMs) {
      form.value.consultDate = dayjs(startMs);
    }
    if (startMs && endMs) {
      form.value.consultTime = [dayjs(startMs), dayjs(endMs)] as any;
    }

    // 回填类型（后端可能返回字符串或数字），基于 consultTypeOptions 做映射
    form.value.consultType = mapConsultType(
      (res as any).consultationType,
      consultTypeOptions.value,
    );

    // 回填老师与地点、重点
    form.value.consultTeacher = (res as any).counselorName || '';
    form.value.consultLocation = (res as any).location || '';
    form.value.consultFocus = (res as any).notes || '';

    // 同步周视图驱动数据
    if (startMs) {
      currentDate.value = dayjs(startMs).format('YYYY-MM-DD');
    }
    if (startMs && endMs) {
      timeRange.value = {
        date: new Date(startMs),
        start: new Date(startMs),
        end: new Date(endMs),
      } as any;
    }

    // 记录原始快照用于“取消编辑”恢复
    originalSnapshot.value = takeSnapshot();
  } catch (error) {
    console.error('回填预约详情到表单失败:', error);
  }
}

// ==================== Drawer 配置 ====================
const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[1200px]',
  contentClass: 'p-0',
  confirmText: '创建预约',
  // 关闭时卸载内容，避免残留状态
  destroyOnClose: true as any,
  onConfirm: submitConsult,
  onClosed: () => {
    // 彻底清理所有本地状态
    resetForm();
    isEdit.value = false;
    currentConsultationRecordId.value = undefined;
    currentConsultationRecord.value = undefined as any;
    currentDate.value = '';
    timeRange.value = undefined;
    weekViewDate.value = dayjs();
    showConfirmDialog.value = false;
    clearSearchState();
  },
  onOpenChange: (isOpen: boolean) => {
    if (isOpen) {
      const data = drawerApi.getData<{
        currentDate?: string;
        id?: number;
        timeRange?: { date: Date; end: Date | string; start: Date | string };
      }>();
      if (data.id) {
        currentConsultationRecordId.value = data.id;
        isEdit.value = false;
        loadConsultationRecord();
      } else {
        isEdit.value = true;
        currentDate.value = data.currentDate || '';
        timeRange.value = data.timeRange;
      }
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
        <span>{{
          currentConsultationRecordId ? '咨询预约详情' : '新建咨询预约'
        }}</span>
      </div>
    </template>
    <!-- 抽屉内容 -->
    <div class="grid h-full w-full grid-cols-2 overflow-hidden">
      <!-- 左侧预约咨询部分 -->
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
              :disabled="isReadOnly"
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

          <!-- 咨询时间 -->
          <LyLabel
            title="咨询时间"
            :required="true"
            custom-title-class="font-semibold text-sm"
          />
          <div class="flex w-full items-center gap-4">
            <Form.Item name="consultDate" :class="{ 'mb-0': durationText }">
              <DatePicker
                v-model:value="form.consultDate"
                placeholder="请选择咨询日期"
                show-today
                class="w-full"
                :disabled="isReadOnly"
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
                :disabled="isReadOnly"
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

          <!-- 咨询类型 -->
          <LyLabel
            title="咨询类型"
            :required="true"
            custom-title-class="font-semibold text-sm"
          />
          <Form.Item
            name="consultType"
            :rules="showAddTypeInput ? [] : rules.consultType"
          >
            <div class="consult-type-group flex flex-wrap gap-2">
              <LyButton
                v-for="option in consultTypeOptions"
                :key="option"
                size="middle"
                class="w-18 h-9"
                :class="{
                  'border border-[#04DC70] bg-[#04DC7014] text-[#04DC70]':
                    form.consultType === option,
                  'is-selected': form.consultType === option,
                }"
                :disabled="isReadOnly"
                @click="isReadOnly ? undefined : (form.consultType = option)"
              >
                {{ option }}
              </LyButton>
              <!-- 添加按钮或输入框 -->
              <template v-if="!showAddTypeInput">
                <LyButton
                  size="middle"
                  class="w-18 h-9"
                  :disabled="isReadOnly"
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
                    :disabled="isReadOnly"
                    @keyup.enter="confirmAddType"
                  />
                  <LyButton
                    type="success"
                    size="small"
                    :disabled="isReadOnly"
                    @click="confirmAddType"
                  >
                    确认
                  </LyButton>
                  <LyButton
                    size="small"
                    :disabled="isReadOnly"
                    @click="cancelAddType"
                  >
                    取消
                  </LyButton>
                </div>
              </template>
            </div>
          </Form.Item>

          <!-- 咨询老师 -->
          <LyLabel
            title="咨询老师"
            :required="true"
            custom-title-class="font-semibold text-sm"
          />
          <Form.Item name="consultTeacher">
            <Select
              v-model:value="form.consultTeacher"
              placeholder="请选择老师"
              class="w-full"
              :disabled="isReadOnly"
              :options="teacherOptions"
            />
          </Form.Item>

          <!-- 咨询地点 -->
          <LyLabel
            title="咨询地点"
            custom-title-class="font-semibold text-sm"
          />
          <Form.Item name="consultLocation">
            <Input
              v-model:value="form.consultLocation"
              placeholder="请填写地点"
              class="w-full"
              :disabled="isReadOnly"
            />
          </Form.Item>

          <!-- 咨询重点 -->
          <LyLabel
            title="咨询重点"
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
              :disabled="isReadOnly"
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
    <!-- 自定义 Drawer footer：只读显示 关闭/编辑；可编辑显示 取消/确认创建 -->
    <template #footer>
      <div class="flex w-full items-center justify-end gap-3 px-4 py-2">
        <LyButton size="middle" @click="onFooterSecondaryClick">
          {{ footerSecondaryText }}
        </LyButton>
        <LyButton size="middle" type="success" @click="onFooterPrimaryClick">
          {{ footerPrimaryText }}
        </LyButton>
      </div>
    </template>
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
        确认创建咨询预约
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
                <div class="text-sm text-[#6B7280]">咨询时间</div>
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
                <div class="text-sm text-[#6B7280]">咨询地点</div>
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
                <div class="text-sm text-[#6B7280]">咨询类型</div>
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

<style lang="scss" scoped>
/* 统一的禁用态优化：更柔和的颜色，允许文本选择，光标为默认 */
:deep(
  .ant-input[disabled],
  .ant-picker-input > input[disabled],
  .ant-select-disabled .ant-select-selector,
  .ant-picker-disabled,
  .ant-picker-range .ant-picker-input input[disabled],
  textarea[disabled]
) {
  color: #4c4c4d !important;
  cursor: default !important;
  background-color: #f8f9fb !important;
  border-color: #eceff5 !important;
  opacity: 1 !important; /* 避免过度灰化 */
  -webkit-text-fill-color: #4c4c4d !important; /* 修复 Safari 文本颜色 */
}

/* 日期/时间选择器容器在禁用时也使用默认光标 */
:deep(.ant-picker.ant-picker-disabled),
:deep(.ant-picker.ant-picker-disabled *),
:deep(.ant-picker-range .ant-picker-input input[disabled]) {
  color: #4c4c4d !important;
  cursor: default !important;
}

/* 禁用的选择器也不显示禁用手势 */
:deep(.ant-select-disabled .ant-select-selector) {
  color: #4c4c4d !important;
  cursor: default !important;
  background-color: #f8f9fb !important; /* 与输入框保持一致 */
  border-color: #eceff5 !important;
}

/* 禁用的按钮保持轻微可见但不可点 */
:deep(.ant-btn[disabled]) {
  cursor: not-allowed;
  opacity: 1 !important; /* 避免过度灰化 */
}

/* 标签和只读区域的提示颜色更柔和 */
:deep(.ant-form-item-label > label) {
  color: #6b7280;
}

/* 日期选择器禁用态边框统一 */
:deep(.ant-picker.ant-picker-disabled),
:deep(.ant-picker.ant-picker-status-error.ant-picker-disabled) {
  color: #4c4c4d !important;
  background-color: #f8f9fb !important;
  border-color: #eceff5 !important;
}

/* 自定义类型按钮的禁用态样式 */
:deep(.ant-btn[disabled].ant-btn-default) {
  color: #4c4c4d !important; /* 字体更清晰，用于预览 */
  cursor: default !important; /* 光标默认，不要禁用手势 */
  background-color: #f5f7fa !important; /* 轻灰背景 */
  border-color: #e6e9f0 !important;
}

/* 咨询类型按钮：统一禁用态与选中态视觉，并在禁用时仍突出选中项 */
:deep(.ant-btn.ant-btn-default.is-selected) {
  color: #04dc70 !important;
  background-color: #04dc7014 !important;
  border-color: #04dc70 !important;
}

:deep(.ant-btn[disabled].ant-btn-default.is-selected) {
  color: #04dc70 !important; /* 选中项在禁用时也明显 */
  cursor: default !important;
  background-color: #e8fbf3 !important;
  border-color: #88e7b3 !important;
}

/* 组内所有被禁用的按钮，统一默认光标 */
:deep(.consult-type-group .ant-btn[disabled]) {
  cursor: default !important;
}

/* 让禁用态可以选中文本，便于查看信息 */
:deep(.ant-input[disabled]),
:deep(textarea[disabled]) {
  user-select: text;
}
</style>
