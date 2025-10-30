<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Form as AForm,
  Input as AInput,
  RangePicker as ARangePicker,
  Select as ASelect,
  Textarea as ATextarea,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getConsultationRecord } from '#/api/psychology/consultation';
import LyLabel from '#/components/LyLabel/index.vue';
import { getDictLabel } from '#/utils/dict';

type RangeValue = [Dayjs, Dayjs];

interface Form {
  studentName: string;
  studentNo: string;
  className: string;
  consultantTime: RangeValue;
  duration: string;
  type: string;
  consultant: string;
  location: string;
  emphasis: string;
  status: number;
}

const [StudentAppointmentDetailDrawer, studentAppointmentDetailDrawerApi] =
  useVbenDrawer({
    class: 'w-[720px]',
    destroyOnClose: true,
    onOpenChange(isOpen: boolean) {
      if (isOpen) {
        const data = studentAppointmentDetailDrawerApi.getData<{
          id: number;
        }>();
        currentConsultationRecordId.value = data.id;
        loadConsultationRecord();
      }
    },
  });

const currentConsultationRecord =
  ref<PsychologyConsultationApi.ConsultationRecord>();

const currentConsultationRecordId = ref<number>();

const form = ref<Form>({
  studentName: '',
  studentNo: '',
  className: '',
  consultantTime: [dayjs(), dayjs()],
  duration: '',
  type: '',
  consultant: '',
  location: '',
  emphasis: '',
  status: 0,
});

async function loadConsultationRecord() {
  if (!currentConsultationRecordId.value) {
    return;
  }
  const res = await getConsultationRecord(currentConsultationRecordId.value);
  currentConsultationRecord.value = res;

  console.log(
    'currentConsultationRecord.value',
    currentConsultationRecord.value,
  );

  form.value.studentName = currentConsultationRecord.value.studentName || '';
  form.value.studentNo = currentConsultationRecord.value.studentNumber || '';
  form.value.className = currentConsultationRecord.value.className || '';
  form.value.type = currentConsultationRecord.value.consultationType || '';
  form.value.consultant = currentConsultationRecord.value.counselorName || '';
  form.value.location = currentConsultationRecord.value.location || '';
  form.value.emphasis = currentConsultationRecord.value.notes || '';
  form.value.status = currentConsultationRecord.value.status || 0;
  form.value.consultantTime = [
    dayjs(currentConsultationRecord.value.appointmentStartTime),
    dayjs(currentConsultationRecord.value.appointmentEndTime),
  ];
}
</script>

<template>
  <StudentAppointmentDetailDrawer title="预约详情">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/consulting/counseling_appointment_detail_icon.png"
          class="w-5"
        />
        <span class="text-lg font-bold">预约详情</span>
      </div>
    </template>

    <div>
      <AForm :model="form">
        <div class="space-y-6">
          <!-- 学生信息 -->
          <div>
            <LyLabel title="学生信息" has-indicator />
            <div class="mt-6 grid grid-cols-3 gap-4">
              <AForm.Item name="studentName">
                <LyLabel
                  title="学生信息"
                  custom-title-class="font-normal text-sm"
                />
                <AInput v-model:value="form.studentName" placeholder="请填写" />
              </AForm.Item>
              <AForm.Item name="studentNo">
                <LyLabel
                  title="学号"
                  custom-title-class="font-normal text-sm"
                />
                <AInput v-model:value="form.studentNo" placeholder="请填写" />
              </AForm.Item>
              <AForm.Item name="className">
                <LyLabel
                  title="班级"
                  custom-title-class="font-normal text-sm"
                />
                <AInput v-model:value="form.className" placeholder="请选择" />
              </AForm.Item>
              <AForm.Item name="consultantTime" class="col-span-2 w-full">
                <LyLabel
                  title="时间安排"
                  custom-title-class="font-normal text-sm"
                />
                <ARangePicker
                  v-model:value="form.consultantTime"
                  :placeholder="['开始时间', '结束时间']"
                  class="w-full"
                />
              </AForm.Item>
              <AForm.Item name="duration">
                <LyLabel
                  title="持续时间"
                  custom-title-class="font-normal text-sm"
                />
                <ASelect v-model:value="form.duration" placeholder="请选择" />
              </AForm.Item>
            </div>
          </div>

          <!-- 咨询信息 -->
          <div>
            <LyLabel title="咨询/访谈信息" has-indicator />
            <div class="mt-6 grid grid-cols-3 gap-4">
              <AForm.Item name="type">
                <LyLabel
                  title="咨询/访谈类型"
                  custom-title-class="font-normal text-sm"
                />
                <AInput v-model:value="form.type" placeholder="请填写" />
              </AForm.Item>
              <AForm.Item name="consultant">
                <LyLabel
                  title="对接老师"
                  custom-title-class="font-normal text-sm"
                />
                <AInput v-model:value="form.consultant" placeholder="请填写" />
              </AForm.Item>
              <AForm.Item name="location">
                <LyLabel
                  title="地点"
                  custom-title-class="font-normal text-sm"
                />
                <AInput v-model:value="form.location" placeholder="请填写" />
              </AForm.Item>
              <AForm.Item name="emphasis" class="col-span-3 w-full">
                <LyLabel
                  title="咨询/访谈重点"
                  custom-title-class="font-normal text-sm"
                />
                <ATextarea
                  v-model:value="form.emphasis"
                  placeholder="请填写"
                  :rows="4"
                />
              </AForm.Item>
            </div>
          </div>

          <!-- 状态信息 -->
          <div>
            <LyLabel title="状态信息" has-indicator />
            <div class="mt-6 flex flex-col gap-6">
              <div class="text-sm">
                <span class="font-medium">当前状态：</span>
                <span class="text-[#4B4B4D]">{{
                  getDictLabel('counseling_status', form.status)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </AForm>
    </div>
  </StudentAppointmentDetailDrawer>
</template>

<style lang="scss" scoped>
textarea {
  resize: none;
}
</style>
