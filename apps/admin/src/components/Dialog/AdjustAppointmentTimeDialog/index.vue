<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { DatePicker as ADatePicker } from 'ant-design-vue';
import dayjs from 'dayjs';

const newConsultTime = ref<Dayjs>(dayjs());
const originalConsultTime = ref<Dayjs>(dayjs());

const [AdjustAppointmentTimeModal, appointmentTimeModalApi] = useVbenModal({
  fullscreenButton: false,
  destroyOnClose: true,
  async onOpenChange(isOpen) {
    if (isOpen) {
      originalConsultTime.value = await appointmentTimeModalApi.getData();
    }
  },
});
</script>

<template>
  <AdjustAppointmentTimeModal title="调整预约时间">
    <div>
      <!-- 时间选择 -->
      <div class="flex items-center gap-2">
        <h4 class="text-sm font-medium text-gray-700">选择时间：</h4>
        <ADatePicker
          v-model:value="newConsultTime"
          format="YYYY-MM-DD HH:mm:ss"
          show-time
        />
      </div>

      <!-- 时间对比 -->
      <div class="time-comparison mt-4 rounded-lg bg-gray-50 p-4">
        <h4 class="mb-3 text-sm font-medium text-gray-700">时间对比</h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">原预约时间：</span>
            <span class="text-sm font-medium text-gray-900">
              {{
                originalConsultTime
                  ? dayjs(originalConsultTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'
              }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">新预约时间：</span>
            <span class="text-sm font-medium text-blue-600">
              {{
                newConsultTime
                  ? dayjs(newConsultTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'
              }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </AdjustAppointmentTimeModal>
</template>
