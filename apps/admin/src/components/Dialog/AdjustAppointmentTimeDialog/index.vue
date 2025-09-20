<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { DatePicker, Form, message, TimeRangePicker } from 'ant-design-vue';
import dayjs from 'dayjs';

import { adjustConsultationRecordTime } from '#/api/psychology/consultation';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const newConsultTime = ref<Dayjs>(dayjs());
const originalConsultTime = ref<Dayjs>(dayjs());

// 备份原始表单数据
const originalFormData = ref<{
  consultDate: Dayjs;
  consultTime: [Dayjs, Dayjs];
}>({
  consultDate: dayjs(),
  consultTime: [dayjs(), dayjs()],
});

const form = ref<{
  consultDate: Dayjs;
  consultTime: [Dayjs, Dayjs];
}>({
  consultDate: dayjs(),
  consultTime: [dayjs(), dayjs()],
});

const [AdjustAppointmentTimeModal, appointmentTimeModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  class: 'w-[600px]',
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = appointmentTimeModalApi.getData();

      if (data && data.appointmentStartTime && data.appointmentEndTime) {
        // 将时间戳转换为dayjs对象
        const startTime = dayjs(data.appointmentStartTime);
        const endTime = dayjs(data.appointmentEndTime);

        // 设置表单数据
        form.value.consultDate = startTime;
        form.value.consultTime = [startTime, endTime];

        // 备份原始表单数据
        originalFormData.value.consultDate = startTime;
        originalFormData.value.consultTime = [startTime, endTime];

        // 设置原始时间用于对比显示
        originalConsultTime.value = startTime;
        newConsultTime.value = startTime;
      }
    }
  },
  onConfirm: async () => {
    const data = appointmentTimeModalApi.getData();
    if (data) {
      try {
        // 将日期和时间组合起来
        const startDateTime = form.value.consultDate
          .hour(form.value.consultTime[0].hour())
          .minute(form.value.consultTime[0].minute())
          .second(form.value.consultTime[0].second());

        const endDateTime = form.value.consultDate
          .hour(form.value.consultTime[1].hour())
          .minute(form.value.consultTime[1].minute())
          .second(form.value.consultTime[1].second());

        await adjustConsultationRecordTime(data.id, {
          newAppointmentStartTime: startDateTime.valueOf(), // 转换为时间戳
          newAppointmentEndTime: endDateTime.valueOf(), // 转换为时间戳
        });
        appointmentTimeModalApi.close();
        message.success('调整预约时间成功');
        emit('refresh');
      } catch {
        message.error('调整预约时间失败');
      }
    }
  },
});

/**
 * 获取禁用时间配置（用于今天的时间选择）
 */
function getDisabledTimeConfig(selectedDate: dayjs.Dayjs | string | undefined) {
  if (!selectedDate) return {};
  const d = dayjs.isDayjs(selectedDate) ? selectedDate : dayjs(selectedDate);
  if (!d.isSame(dayjs(), 'day')) return {};

  const curHour = dayjs().hour();
  const curMinute = dayjs().minute();
  return {
    disabledHours: () => Array.from({ length: curHour }, (_, i) => i),
    disabledMinutes: (selectedHour: number) =>
      selectedHour === curHour
        ? Array.from({ length: curMinute }, (_, i) => i)
        : [],
    disabledSeconds: () => [],
  };
}

function disabledRangeTime(
  _date: dayjs.Dayjs | null | string,
  _type: 'end' | 'start',
) {
  return getDisabledTimeConfig(form.value.consultDate);
}

// 监听表单变化，实时更新新预约时间
watch(
  () => [form.value.consultDate, form.value.consultTime],
  () => {
    if (
      form.value.consultDate &&
      form.value.consultTime &&
      form.value.consultTime[0]
    ) {
      // 组合日期和时间作为新的预约时间
      const newTime = form.value.consultDate
        .hour(form.value.consultTime[0].hour())
        .minute(form.value.consultTime[0].minute())
        .second(form.value.consultTime[0].second());
      newConsultTime.value = newTime;
    }
  },
  { deep: true },
);
</script>

<template>
  <AdjustAppointmentTimeModal title="调整预约时间">
    <div>
      <!-- 时间选择 -->
      <div class="flex gap-2">
        <div class="flex w-full items-center gap-4">
          <Form.Item name="consultDate" label="选择时间">
            <DatePicker
              v-model:value="form.consultDate"
              placeholder="请选择访谈日期"
              show-today
              class="w-full"
              :disabled-date="
                (current) => current && current.isBefore(dayjs().startOf('day'))
              "
            />
          </Form.Item>
          <Form.Item name="consultTime" class="flex-1">
            <TimeRangePicker
              v-model:value="form.consultTime"
              class="w-full"
              :disabled-time="disabledRangeTime"
            />
          </Form.Item>
        </div>
      </div>

      <!-- 时间对比 -->
      <div class="time-comparison rounded-lg bg-gray-50 p-4">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">原预约时间：</span>
            <span class="text-sm font-medium text-gray-900">
              {{
                originalFormData.consultDate &&
                originalFormData.consultTime.length > 0
                  ? `${dayjs(originalFormData.consultDate).format(
                      'YYYY-MM-DD',
                    )} ${dayjs(originalFormData.consultTime[0]).format(
                      'HH:mm:ss',
                    )} - ${dayjs(originalFormData.consultTime[1]).format(
                      'HH:mm:ss',
                    )}`
                  : '-'
              }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">新预约时间：</span>
            <span class="text-sm font-medium text-blue-600">
              {{
                form.consultDate && form.consultTime.length > 0
                  ? `${dayjs(form.consultDate).format('YYYY-MM-DD')} ${dayjs(
                      form.consultTime[0],
                    ).format(
                      'HH:mm:ss',
                    )} - ${dayjs(form.consultTime[1]).format('HH:mm:ss')}`
                  : '-'
              }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </AdjustAppointmentTimeModal>
</template>
