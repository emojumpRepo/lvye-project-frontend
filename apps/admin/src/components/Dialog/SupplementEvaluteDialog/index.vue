<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { Dayjs } from 'dayjs';

import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  DatePicker as ADatePicker,
  Form as AForm,
  Textarea as ATextarea,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

const emit = defineEmits<{
  (
    e: 'confirm',
    form: { actualTime: Dayjs; id: number; notes: string },
    consultRecord: PsychologyConsultationApi.ConsultationRecord,
  ): void;
}>();

const appointmentStartTime = ref<Dayjs>();
const consultRecord = ref<PsychologyConsultationApi.ConsultationRecord>();
const form = ref<{
  actualTime: Dayjs;
  id: number;
  notes: string;
}>({
  id: 0,
  actualTime: dayjs(),
  notes: '',
});

const rules: Record<string, Rule[]> = {
  actualTime: [
    { required: true, message: '请选择实际咨询时间', trigger: 'change' },
  ],
  notes: [{ required: false, message: '请输入补录说明', trigger: 'blur' }],
};

// 禁用早于预约时间的日期
const disabledDate = (current: Dayjs) => {
  if (!appointmentStartTime.value) return false;
  // 禁用早于预约日期的所有日期
  return current && current.isBefore(appointmentStartTime.value, 'day');
};

// 禁用早于或等于预约时间的时间（只能选择预约时间之后的时间）
const disabledTime = (current: Dayjs | null) => {
  if (!current || !appointmentStartTime.value) {
    return {};
  }

  // 如果选择的日期不是预约当天，不禁用时间
  if (!current.isSame(appointmentStartTime.value, 'day')) {
    return {};
  }

  // 如果是预约当天，禁用早于或等于预约时间的小时、分钟、秒
  const appointmentHour = appointmentStartTime.value.hour();
  const appointmentMinute = appointmentStartTime.value.minute();
  const appointmentSecond = appointmentStartTime.value.second();

  return {
    disabledHours: () => {
      const hours: number[] = [];
      for (let i = 0; i < appointmentHour; i++) {
        hours.push(i);
      }
      return hours;
    },
    disabledMinutes: (selectedHour: number) => {
      if (selectedHour === appointmentHour) {
        const minutes: number[] = [];
        // 禁用小于预约分钟的所有分钟（预约分钟本身可选）
        for (let i = 0; i < appointmentMinute; i++) {
          minutes.push(i);
        }
        return minutes;
      }
      return [];
    },
    disabledSeconds: (selectedHour: number, selectedMinute: number) => {
      if (
        selectedHour === appointmentHour &&
        selectedMinute === appointmentMinute
      ) {
        const seconds: number[] = [];
        // 禁用小于或等于预约秒的所有秒
        for (let i = 0; i <= appointmentSecond; i++) {
          seconds.push(i);
        }
        return seconds;
      }
      return [];
    },
  };
};

const [SupplementEvaluteModal, supplementEvaluteModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  onOpenChange: async () => {
    const data =
      supplementEvaluteModalApi.getData() as PsychologyConsultationApi.ConsultationRecord;
    if (!data) return message.error('咨询记录不存在');
    consultRecord.value = data;
    data.id && (form.value.id = data.id);

    // 将时间戳转换为 dayjs 对象
    if (data.appointmentStartTime) {
      appointmentStartTime.value = dayjs(data.appointmentStartTime);
      // 设置默认值为预约开始时间之后1分钟
      form.value.actualTime = dayjs(data.appointmentStartTime).add(1, 'minute');
    }
  },
  onConfirm: () =>
    emit(
      'confirm',
      form.value,
      consultRecord.value as PsychologyConsultationApi.ConsultationRecord,
    ),
});
</script>

<template>
  <SupplementEvaluteModal title="补录咨询">
    <div class="px-2 pt-2">
      <AForm :model="form" :rules="rules">
        <AForm.Item label="实际完成时间" name="actualTime">
          <ADatePicker
            v-model:value="form.actualTime"
            placeholder="请选择实际咨询时间"
            show-time
            class="w-full"
            :disabled-date="disabledDate"
            :disabled-time="disabledTime"
          />
        </AForm.Item>

        <!-- 补录说明 -->
        <AForm.Item label="补录说明" name="notes">
          <ATextarea
            v-model:value="form.notes"
            placeholder="请输入补录说明"
            :maxlength="200"
            show-count
            :rows="4"
          />
        </AForm.Item>
      </AForm>
    </div>
  </SupplementEvaluteModal>
</template>
