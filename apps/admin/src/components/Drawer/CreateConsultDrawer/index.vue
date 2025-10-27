<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

import { computed, ref, watch } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import {
  DatePicker,
  Form,
  Input,
  message,
  Select,
  Spin,
  TimeRangePicker,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import { COUNSELING_STATUS } from '#/api/constants';
import {
  checkTimeConflict,
  createConsultationRecord,
  getConsultationRecord,
  getWeeklyAppointment,
  updateConsultationRecord,
} from '#/api/psychology/consultation';
import { getTeacherUserList } from '#/api/system/user';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import { getDictLabel } from '#/utils/dict';
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
  value: number;
}

interface FormModel {
  student: StudentOption | undefined;
  consultDate: dayjs.Dayjs | undefined;
  consultTime: [dayjs.Dayjs, dayjs.Dayjs] | undefined;
  consultType: string;
  consultTeacher: number | undefined;
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

const userStore = useUserStore();
// ==================== 使用 composables ====================
const { calculateDurationText, getDisabledTimeConfig } = useTimeCalculation();

const {
  studentSearchState,
  searchingText,
  fetchStudents,
  handleStudentChange,
  clearSearchState,
} = useStudentSearch();
// ==================== 咨询预约详情基础状态 ====================
const currentConsultationRecordId = ref<number>();
const currentConsultationRecord =
  ref<PsychologyConsultationApi.ConsultationRecord>();
const loadingWeekDays = ref(false);
const isEdit = ref(false); // 是否是编辑状态
const isReadOnly = computed(
  () => !!currentConsultationRecordId.value && !isEdit.value,
);
const teacherOptions = ref<{ label: string; value: number }[]>([]);
// ==================== 自定义访谈类型 ====================
const showAddTypeInput = ref(false);
const newTypeName = ref('');

// ==================== 周视图相关 ====================
const weekViewDate = ref(dayjs());
const weekOffset = ref(0);
const weekDays = ref<
  Array<{
    appointments: PsychologyConsultationApi.ConsultationRecord[];
    date: string;
    dayName: string;
    fullDate: dayjs.Dayjs;
    key: number;
  }>
>([]);
const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// ==================== 时间冲突检查 ====================
const timeError = ref('');
const conflictError = ref('');
const dateTip = ref('');
// ==================== 创建咨询预约的基础状态 ====================
const currentDate = ref('');
const timeRange = ref<{
  date: Date;
  end: Date | string;
  start: Date | string;
}>();
const formRef = ref();
const showConfirmDialog = ref(false);
// ==================== 表单相关 ====================
const consultTypeOptions = ref([
  '初次访谈',
  '复诊访谈',
  '紧急访谈',
  '家长访谈',
]);

const form = ref<FormModel>({
  student: undefined,
  consultDate: undefined,
  consultTime: undefined,
  consultType: '',
  consultTeacher: undefined,
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

// ==================== 计算属性 ====================
// 用于“取消编辑”时恢复到详情初始状态
const originalSnapshot = ref<DrawerSnapshot | null>(null);
const isDetail = computed(() => !!currentConsultationRecordId.value);
const footerSecondaryText = computed(() =>
  isDetail.value ? (isReadOnly.value ? '关闭' : '取消') : '取消',
);
const footerPrimaryText = computed(() =>
  isDetail.value ? (isReadOnly.value ? '编辑' : '保存') : '确认创建',
);

const durationText = computed(() => {
  if (!form.value.consultTime?.[0] || !form.value.consultTime?.[1]) return '';

  return calculateDurationText({
    start: form.value.consultTime[0],
    end: form.value.consultTime[1],
  });
});

// ==================== Dialog弹窗 ====================
// 确认弹窗
const [ConfirmModal, confirmModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

// ==================== Drawer 配置 ====================
const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-2/3',
  contentClass: 'p-0',
  confirmText: '创建预约',
  destroyOnClose: true,
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      drawerApi.setState({ loading: true });
      const data = drawerApi.getData<{
        currentDate?: string;
        id?: number;
        studentProfile?: {
          className: string;
          studentName: string;
          studentNumber: string;
          studentProfileId: number;
        };
        timeRange?: { date: Date; end: Date | string; start: Date | string };
      }>();

      if (data.studentProfile) {
        form.value.student = buildStudentOption(data.studentProfile);
      }

      if (data.id) {
        currentConsultationRecordId.value = data.id;
        isEdit.value = false;
        await loadConsultationRecord();
      } else {
        currentDate.value = data.currentDate || '';
        timeRange.value = data.timeRange;
        isEdit.value = true;
      }
      // 加载教师数据
      await fetchTeacherOptions();
      await generateWeekDays(dayjs());
      await loadWeeklyAppointment();
      drawerApi.setState({ loading: false });
    }
  },
  onConfirm: submitConsult,
});

/** 加载咨询预约详情 */
async function loadConsultationRecord() {
  if (!isDetail.value) {
    return;
  }
  const res = await getConsultationRecord(
    currentConsultationRecordId.value as number,
  );
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
    form.value.consultTeacher = (res as any).counselorUserId || '';
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

/** 获取教师列表 */
async function fetchTeacherOptions() {
  try {
    const list = await getTeacherUserList();
    teacherOptions.value = (list || []).map((u: any) => ({
      label: u.nickname,
      value: u.id,
    }));
    // 如果当前用户在教师列表中，默认选中当前用户
    const currentUserId = userStore.userInfo?.id;
    if (
      currentUserId &&
      teacherOptions.value.some((teacher) => teacher.value === currentUserId)
    ) {
      form.value.consultTeacher = currentUserId;
    }
  } catch (error) {
    console.error('获取教师列表失败:', error);
  }
}

/** 生成指定周的日期列表 */
function generateWeekDays(weekDate: Dayjs) {
  const startOfWeek = weekDate.startOf('week');
  const days = [];

  for (let i = 0; i < 7; i++) {
    const currentDay = startOfWeek.add(i, 'day');
    days.push({
      appointments: [] as PsychologyConsultationApi.ConsultationRecord[],
      date: currentDay.format('M/D'),
      dayName: dayNames[i] || '',
      fullDate: currentDay,
      key: i + 1,
    });
  }

  weekDays.value = days;

  return days;
}

/** 加载每周预约 */
async function loadWeeklyAppointment() {
  try {
    const response = await getWeeklyAppointment(weekOffset.value);
    if (response && response.dailyAppointments.length > 0) {
      // 根据 key 筛选对应天的预约数据
      weekDays.value.forEach((day) => {
        const dailyAppointment = response.dailyAppointments.find(
          (item) => item.key === day.key,
        );
        if (dailyAppointment) {
          day.appointments = dailyAppointment?.appointments || [];
        }
      });
    }
  } catch (error) {
    console.error('加载每周预约失败:', error);
    message.error('加载每周预约失败');
  }
}

/** 构建学生选项 */
function buildStudentOption(res: any): StudentOption {
  return {
    label: [res.studentName, res.className, res.studentNumber]
      .filter(Boolean)
      .join(' - '),
    name: res.studentName || '',
    studentNo: res.studentNumber || '',
    class: res.className || '',
    value: String(res.studentProfileId ?? ''),
  } as any;
}

/** 映射咨询类型 */
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

/** 创建快照 */
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

/** 恢复快照 */
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

/** 点击取消按钮 */
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

/** 点击确认按钮 */
function onFooterPrimaryClick() {
  if (isDetail.value && isReadOnly.value) {
    isEdit.value = true;
    return;
  }
  submitConsult();
}

// ==================== 周视图相关函数 ====================
function formatWeekViewDate(value: dayjs.Dayjs) {
  return [
    `${dayjs(value).startOf('week').format('YYYY-MM-DD')}`,
    `${dayjs(value).endOf('week').format('YYYY-MM-DD')}`,
  ];
}

/** 点击上一周按钮 */
async function handlePreviousWeek() {
  loadingWeekDays.value = true;
  weekViewDate.value = weekViewDate.value.subtract(1, 'week');
  weekOffset.value -= 1;
  await generateWeekDays(weekViewDate.value);
  await loadWeeklyAppointment();
  loadingWeekDays.value = false;
}

/** 点击下周按钮 */
async function handleNextWeek() {
  loadingWeekDays.value = true;
  weekViewDate.value = weekViewDate.value.add(1, 'week');
  weekOffset.value += 1;
  await generateWeekDays(weekViewDate.value);
  await loadWeeklyAppointment();
  loadingWeekDays.value = false;
}

// ==================== 自定义访谈类型函数 ====================
/** 显示增加类型输入框 */
function showAddCustomType() {
  showAddTypeInput.value = true;
  newTypeName.value = '';
  formRef.value?.clearValidate('consultType');
}

/** 确认增加类型 */
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

/** 取消增加类型 */
function cancelAddType() {
  showAddTypeInput.value = false;
  newTypeName.value = '';
  if (!form.value.consultType) {
    formRef.value?.validateFields(['consultType']);
  }
}

/** 时间范围变化时校验 */
async function onTimeRangeChange(
  value: [dayjs.Dayjs | null | string, dayjs.Dayjs | null | string] | null,
  _dateString?: [string, string],
) {
  timeError.value = '';
  conflictError.value = '';

  if (!value || !form.value.consultDate) return;
  if (value[0] === null || value[1] === null) return;

  // 统一转换为 dayjs 对象
  const startTime = dayjs.isDayjs(value[0])
    ? value[0]
    : dayjs(value[0] as string);

  const endTime = dayjs.isDayjs(value[1])
    ? value[1]
    : dayjs(value[1] as string);

  // 将选择的日期与时间组合，形成完整的日期时间
  const consultDate = form.value.consultDate;
  const startDT = consultDate
    .hour(startTime.hour())
    .minute(startTime.minute())
    .second(0);
  const endDT = consultDate
    .hour(endTime.hour())
    .minute(endTime.minute())
    .second(0);

  // 1. 检查开始时间是否在过去
  if (startDT.isBefore(dayjs())) {
    timeError.value = '不能选择过去时间';
    return; // 有错误就提前返回，不进行后续检查
  }

  // 2. 检查结束时间是否在过去
  if (endDT.isBefore(dayjs())) {
    timeError.value = '不能选择过去时间';
    return;
  }

  // 3. 检查结束时间是否晚于开始时间
  if (endDT.isBefore(startDT) || endDT.isSame(startDT)) {
    timeError.value = '结束时间必须晚于开始时间';
    return;
  }

  // 4. 只有在没有时间错误时才进行冲突检查
  if (form.value.consultTeacher) {
    const result = await checkTimeConflict({
      appointmentEndTime: endDT.valueOf(),
      appointmentStartTime: startDT.valueOf(),
      counselorUserId: form.value.consultTeacher as number,
    });

    conflictError.value = result.hasConflict
      ? '该时间段已有预约，请选择其他时间段'
      : '';
  } else {
    conflictError.value = '';
  }
}

/** 选择日期时校验 */
async function selectDateChange() {
  // 如果已经选择了时间范围，则重新校验
  if (
    form.value.consultDate &&
    form.value.consultTime &&
    form.value.consultTime[0] &&
    form.value.consultTime[1]
  ) {
    await onTimeRangeChange(form.value.consultTime);
  }
}
/** 选择老师时校验时间冲突 */
async function onTeacherChange(value: any) {
  if (value) {
    form.value.consultTeacher = value;
    const result = await checkTimeConflict({
      appointmentEndTime: form.value.consultTime?.[1]?.valueOf() as number,
      appointmentStartTime: form.value.consultTime?.[0]?.valueOf() as number,
      counselorUserId: value,
    });
    conflictError.value = result.hasConflict
      ? '该时间段已有预约，请选择其他时间段'
      : '';
  } else {
    conflictError.value = '';
  }
}

// ==================== 表单提交相关 ====================
/** 提交咨询预约 */
async function submitConsult() {
  formRef.value?.validate().then(async () => {
    if (isDetail.value) {
      await handleConfirmCreateOrUpdate();
    } else {
      confirmModalApi.open();
    }
  });
}

/** 确认创建或更新咨询预约 */
async function handleConfirmCreateOrUpdate() {
  formRef.value?.validate().then(async () => {
    drawerApi.lock();
    // 组合日期(年月日)与时间(时分秒)
    const dateStr = form.value.consultDate
      ? dayjs(form.value.consultDate).format('YYYY-MM-DD')
      : '';
    const startTimeStr = form.value.consultTime?.[0]
      ? dayjs(form.value.consultTime[0]).format('HH:mm:ss')
      : '';
    const endTimeStr = form.value.consultTime?.[1]
      ? dayjs(form.value.consultTime[1]).format('HH:mm:ss')
      : '';
    const startDateTime =
      dateStr && startTimeStr ? dayjs(`${dateStr} ${startTimeStr}`) : undefined;
    const endDateTime =
      dateStr && endTimeStr ? dayjs(`${dateStr} ${endTimeStr}`) : undefined;

    const params: PsychologyConsultationApi.ConsultationRecordSaveReq = {
      studentProfileId: form.value.student?.value as number,
      counselorUserId: form.value.consultTeacher as number,
      consultationType: form.value.consultType,
      location: form.value.consultLocation,
      // 使用时间戳(毫秒)以避免 toISOString 导致的时区偏移
      appointmentStartTime: startDateTime?.valueOf() as number,
      appointmentEndTime: endDateTime?.valueOf() as number,
      notes: form.value.consultFocus,
    };

    try {
      if (isDetail.value) {
        params.id = currentConsultationRecordId.value as number;
        await updateConsultationRecord(params);
      } else {
        await createConsultationRecord(params);
      }

      showConfirmDialog.value = false;
      message.success('创建咨询预约成功');
      drawerApi.close();
      emit('refresh');
    } catch (error) {
      console.error('创建咨询预约失败:', error);
    } finally {
      drawerApi.unlock();
    }
  });
}

/** 重置表单 */
function resetForm() {
  formRef.value?.resetFields();
  clearSearchState();
  timeError.value = '';
  conflictError.value = '';
  dateTip.value = '';
}

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

// 监听 timeRange 变化，更新表单时间（）
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
/** 禁用时间范围 */
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
          currentConsultationRecordId ? '访谈预约详情' : '新建访谈预约'
        }}</span>
      </div>
    </template>

    <!-- 抽屉内容 -->
    <div class="grid h-full w-full grid-cols-2 overflow-hidden">
      <!-- 左侧预约访谈部分 -->
      <div class="col-span-1 overflow-y-auto border-r border-[#F2F3F5] p-6">
        <Form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="w-full"
          :class="{ 'custom-disable': isReadOnly }"
        >
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
              :disabled="isReadOnly"
              :options="teacherOptions"
              @change="onTeacherChange"
            />
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
                :allow-clear="false"
                class="w-full"
                :disabled="isReadOnly"
                :disabled-date="
                  (current) =>
                    current && current.isBefore(dayjs().startOf('day'))
                "
                @change="selectDateChange"
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
                :allow-clear="false"
                :disabled="isReadOnly"
                :disabled-time="disabledRangeTime"
                @change="onTimeRangeChange"
              />
            </Form.Item>
          </div>
          <!-- 错误信息（时间报错优先于时间冲突） -->
          <div
            v-if="timeError || conflictError"
            class="mb-6 mt-2 flex items-center gap-2 rounded bg-[#FF083114] px-4 py-2 text-sm text-[#FF0831]"
          >
            <IconifyIcon
              icon="material-symbols:error"
              class="size-4 text-[#FF0831]"
            />
            {{ timeError || conflictError }}
          </div>
          <!-- 时长信息（仅在没有错误时显示） -->
          <div
            v-else-if="durationText"
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
              :disabled="isReadOnly"
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
              :disabled="isReadOnly"
            />
          </Form.Item>
        </Form>

        <!-- 咨询详情的状态信息部分 -->
        <template
          v-if="currentConsultationRecordId && currentConsultationRecord"
        >
          <LyLabel
            title="状态信息"
            custom-title-class="font-semibold"
            has-indicator
          />
          <div class="mt-5 text-sm text-gray-500">
            <span class="font-semibold text-black">当前状态：</span>
            {{
              getDictLabel(
                'counseling_status',
                currentConsultationRecord.status,
              )
            }}
          </div>
        </template>
      </div>

      <!-- 右侧周视图部分 -->
      <div
        class="col-span-1 flex flex-col gap-4 overflow-hidden overflow-y-auto py-6"
      >
        <div class="box-border flex items-center justify-between px-6">
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
        <div class="box-border flex-1 overflow-y-auto px-6">
          <Spin :spinning="loadingWeekDays">
            <div class="space-y-4">
              <div
                v-for="dayInfo in weekDays"
                :key="dayInfo.fullDate.format('YYYY-MM-DD')"
                class="box-border flex max-h-[152px] flex-col overflow-hidden rounded-lg border border-gray-200 p-4"
              >
                <div class="mb-2 flex shrink-0 items-center justify-between">
                  <span class="font-medium">{{ dayInfo.dayName }}</span>
                  <span class="text-sm text-gray-500">{{ dayInfo.date }}</span>
                </div>

                <!-- 显示事件列表 -->
                <div
                  v-if="dayInfo.appointments.length > 0"
                  class="scroll-area flex-1 space-y-2 overflow-y-auto text-xs text-[#4C4C4D]"
                >
                  <div
                    v-for="(appointment, index) in dayInfo.appointments"
                    :key="appointment.id"
                  >
                    <div
                      class="flex items-center gap-2 rounded p-1.5"
                      :style="{
                        backgroundColor:
                          getEventStyleOptions(index)?.backgroundColor ||
                          '#f5f5f5',
                      }"
                    >
                      <span
                        class="h-2 w-2 rounded-full"
                        :style="{
                          backgroundColor:
                            getEventStyleOptions(index)?.dotColor || '#ccc',
                        }"
                      ></span>
                      <div class="flex gap-1">
                        <span>
                          {{
                            dayjs(appointment.appointmentStartTime).format(
                              'HH:mm',
                            )
                          }}-{{
                            dayjs(appointment.appointmentEndTime).format(
                              'HH:mm',
                            )
                          }}
                        </span>
                        <span>
                          {{ appointment.studentName }} - （{{
                            appointment.counselorName
                          }}）
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 其他天显示暂无预约 -->
                <div v-else class="text-sm text-gray-400">暂无预约</div>
              </div>
            </div>
          </Spin>
        </div>
      </div>
    </div>
    <!-- 自定义 Drawer footer：只读显示 关闭/编辑；可编辑显示 取消/确认创建 -->
    <template #footer>
      <div class="flex w-full items-center justify-end gap-3 px-4 py-2">
        <LyButton size="middle" @click="onFooterSecondaryClick">
          {{ footerSecondaryText }}
        </LyButton>

        <template
          v-if="
            !isDetail ||
            currentConsultationRecord?.status === COUNSELING_STATUS.APPOINTMENT
          "
        >
          <LyButton size="middle" type="success" @click="onFooterPrimaryClick">
            {{ footerPrimaryText }}
          </LyButton>
        </template>
      </div>
    </template>

    <ConfirmModal
      confirm-text="确认创建"
      cancel-text="取消"
      @confirm="handleConfirmCreateOrUpdate"
    >
      <template #title>
        <div class="flex items-center gap-3 text-lg font-semibold">
          <IconifyIcon
            icon="tabler:calendar-check"
            class="size-5 text-[#04DC70]"
          />
          确认创建咨询预约
        </div>
      </template>

      <!-- 预约信息卡片 -->
      <div class="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-sm">
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
              <IconifyIcon icon="tabler:clock" class="size-4 text-[#3B82F6]" />
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
        <span class="text-sm text-[#04DC70]"> 确认后将向学生发送预约通知 </span>
      </div>
    </ConfirmModal>
  </Drawer>
</template>

<style lang="scss" scoped>
:deep(.ant-spin) {
  height: 100% !important;
}

:deep(.ant-spin-nested-loading) {
  height: 100% !important;
}

:deep(.ant-spin-container) {
  height: 100% !important;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 35%);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 999px;
}
</style>
