<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

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

import LyLabel from '#/components/LyLabel/index.vue';

type RangeValue = [Dayjs, Dayjs];

interface Form {
  studentName: string;
  studentNo: string;
  classDeptId: string;
  consultantTime: RangeValue;
  duration: string;
  type: string;
  consultant: string;
  location: string;
  emphasis: string;
  status: string;
}

const [StudentAppointmentDetailDrawer, studentAppointmentDetailDrawerApi] =
  useVbenDrawer({
    class: 'w-[720px]',
    destroyOnClose: true,
  });

const form = ref<Form>({
  studentName: '',
  studentNo: '',
  classDeptId: '',
  consultantTime: [dayjs(), dayjs()],
  duration: '',
  type: '',
  consultant: '',
  location: '',
  emphasis: '',
  status: '',
});
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
              <AForm.Item name="classDeptId">
                <LyLabel
                  title="班级"
                  custom-title-class="font-normal text-sm"
                />
                <ASelect
                  v-model:value="form.classDeptId"
                  placeholder="请选择"
                />
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
            <LyLabel title="咨询信息" has-indicator />
            <div class="mt-6 grid grid-cols-3 gap-4">
              <AForm.Item name="type">
                <LyLabel
                  title="咨询类型"
                  custom-title-class="font-normal text-sm"
                />
                <AInput v-model:value="form.type" placeholder="请填写" />
              </AForm.Item>
              <AForm.Item name="consultant">
                <LyLabel
                  title="咨询老师"
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
                  title="咨询重点"
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

          <!-- 休息状态 -->
          <div>
            <LyLabel title="休息状态" has-indicator />
            <div class="mt-6 flex flex-col gap-6">
              <div class="text-sm">
                <span class="font-medium">当前状态：</span>
                <span class="text-[#4B4B4D]">{{ form.status }}</span>
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
