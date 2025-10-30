<script setup lang="ts">
import type { ConsultationAppointmentByDate } from '@vben/types';

import type { PsychologyConsultationApi } from '#/api/psychology/consultation';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getConsultationAppointmentByDate } from '#/api/psychology/consultation';
import LyTag from '#/components/LyTag/index.vue';

const emit = defineEmits<{
  (
    e: 'viewDetail',
    payload: PsychologyConsultationApi.ConsultationRecord,
  ): void;
}>();

// 模拟数据
const appointments = ref<ConsultationAppointmentByDate['appointments']>([]);

// 当前日期
const currentDate = ref('');

// Drawer 配置
const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[800px]',
  contentClass: 'p-0',
  footer: false,
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      drawerApi.setState({ loading: true });
      const data = drawerApi.getData<{
        counselorUserId: number;
        date: string;
      }>();
      currentDate.value = data.date;
      try {
        const response = await getConsultationAppointmentByDate({
          counselorUserId: data.counselorUserId,
          date: data.date,
        });
        if (!response) return message.error('获取咨询预约数据失败');

        if (response.appointments.length > 0) {
          appointments.value = response.appointments;
        }
      } catch (error) {
        console.error('获取咨询预约数据失败', error);
        message.error('获取咨询预约数据失败');
      }
      drawerApi.setState({ loading: false });
    }
  },
});

// 查看详情
const handleViewDetails = (
  appointment: PsychologyConsultationApi.ConsultationRecord,
) => {
  drawerApi.close();
  emit('viewDetail', appointment);
};

// 暴露 API
defineExpose({
  open: drawerApi.open,
  close: drawerApi.close,
  setData: drawerApi.setData,
});
</script>

<template>
  <Drawer>
    <template #title>
      <div class="flex items-center gap-2 text-lg font-semibold">
        <img
          src="../../../static/icons/consulting/icon_yuyue.svg"
          class="w-5"
        />
        <span>预约列表</span>
        <span>/</span>
        <span>{{ currentDate }}</span>
        <span>(共{{ appointments.length }}个)</span>
      </div>
    </template>

    <!-- 抽屉内容 -->
    <div class="h-full overflow-y-auto p-6">
      <div class="space-y-4">
        <!-- 预约列表 -->
        <div
          v-for="appointment in appointments"
          :key="appointment.id"
          class="rounded-lg bg-gray-50 px-4 py-3"
        >
          <!-- 顶部：学生信息和时间 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img
                src="../../../static/icons/consulting/icon_more.svg"
                class="w-4"
              />
              <span class="font-semibold text-gray-900">
                {{ appointment.studentName }}（{{ appointment.className }}）
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-[#979899]">
              <span>
                {{
                  dayjs(appointment.appointmentStartTime).format(
                    'YYYY-MM-DD HH:mm',
                  )
                }}
                -
                {{
                  dayjs(appointment.appointmentEndTime).format(
                    'YYYY-MM-DD HH:mm',
                  )
                }}
              </span>
              <div class="h-[11px] w-[0.5px] bg-[#EAEBED]"></div>
              <span>{{ appointment.durationMinutes }}分钟</span>
            </div>
          </div>

          <div class="mb-4 mt-3 h-[0.5px] w-full bg-[#EAEBED]"></div>

          <!-- 详情信息 -->
          <div class="flex flex-wrap gap-12 text-sm">
            <div class="flex items-center">
              <span>咨询/访谈类型：</span>
              <span>
                {{ appointment.consultationType }}
              </span>
            </div>
            <div class="flex items-center">
              <span>对接老师：</span>
              <span>
                {{ appointment.counselorName }}
              </span>
            </div>
            <div class="flex items-center">
              <span>咨询/访谈地点：</span>
              <span class="">{{ appointment.location }}</span>
            </div>
            <div class="flex items-center">
              <span>状态：</span>
              <LyTag
                tag-category-key="counseling_status"
                :dict-value="appointment.status"
              />
            </div>
          </div>

          <!-- 查看详情按钮 -->
          <div class="mt-3 flex justify-end">
            <button
              class="text-sm text-green-600 hover:text-green-700"
              @click="handleViewDetails(appointment)"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>
