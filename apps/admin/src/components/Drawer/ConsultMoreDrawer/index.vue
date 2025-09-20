<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

// 定义预约数据类型
interface Appointment {
  id: string;
  studentName: string;
  studentClass: string;
  time: string;
  duration: number;
  type: string;
  teacher: string;
  location: string;
  status: 'booked' | 'closed' | 'completed-overdue';
  statusText: string;
}

// 模拟数据
const appointments = ref<Appointment[]>([
  {
    id: '1',
    studentName: '张小明',
    studentClass: '高一(3)班',
    time: '09:00',
    duration: 60,
    type: '学业压力咨询',
    teacher: '李老师',
    location: '心理咨询室A',
    status: 'booked',
    statusText: '已预约',
  },
  {
    id: '2',
    studentName: '张小明',
    studentClass: '高一(3)班',
    time: '10:30',
    duration: 45,
    type: '学业压力咨询',
    teacher: '李老师',
    location: '心理咨询室A',
    status: 'closed',
    statusText: '已闭环',
  },
  {
    id: '3',
    studentName: '张小明',
    studentClass: '高一(3)班',
    time: '14:00',
    duration: 50,
    type: '学业压力咨询',
    teacher: '李老师',
    location: '心理咨询室A',
    status: 'completed-overdue',
    statusText: '已完成(评估逾期)',
  },
  {
    id: '4',
    studentName: '张小明',
    studentClass: '高一(3)班',
    time: '15:30',
    duration: 30,
    type: '学业压力咨询',
    teacher: '李老师',
    location: '心理咨询室A',
    status: 'completed-overdue',
    statusText: '已完成(评估逾期)',
  },
  {
    id: '5',
    studentName: '张小明',
    studentClass: '高一(3)班',
    time: '16:00',
    duration: 40,
    type: '学业压力咨询',
    teacher: '李老师',
    location: '心理咨询室A',
    status: 'completed-overdue',
    statusText: '已完成(评估逾期)',
  },
]);

// 当前日期
const currentDate = ref('');

// 计算属性
const appointmentCount = computed(() => appointments.value.length);

// 状态样式
const getStatusClass = (status: string) => {
  switch (status) {
    case 'booked': {
      return 'text-gray-700';
    }
    case 'closed': {
      return 'text-gray-700';
    }
    case 'completed-overdue': {
      return 'text-orange-500';
    }
    default: {
      return 'text-gray-700';
    }
  }
};

// 查看详情
const handleViewDetails = (appointment: Appointment) => {
  console.log('查看详情:', appointment);
  // 这里可以打开详情抽屉或跳转到详情页面
};

// Drawer 配置
const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[800px]',
  contentClass: 'p-0',
  onOpenChange: (isOpen: boolean) => {
    if (isOpen) {
      const data = drawerApi.getData<{ currentDate: string }>();
      currentDate.value = data.currentDate;
    }
  },
});

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
        <span>(共{{ appointmentCount }}个)</span>
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
              <span class="font-semibold text-gray-900">{{
                appointment.studentName
              }}</span>
              <span class="text-sm text-[#979899]">{{
                appointment.studentClass
              }}</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-[#979899]">
              <span>{{ appointment.time }} </span>
              <div class="h-[11px] w-[0.5px] bg-[#EAEBED]"></div>
              <span>{{ appointment.duration }}分钟</span>
            </div>
          </div>

          <div class="mb-4 mt-3 h-[0.5px] w-full bg-[#EAEBED]"></div>

          <!-- 详情信息 -->
          <div class="flex flex-wrap gap-12 text-sm">
            <div class="flex items-center">
              <span>访谈类型：</span>
              <span class="text-[#979899]">{{ appointment.type }}</span>
            </div>
            <div class="flex items-center">
              <span>访谈老师：</span>
              <span class="text-[#979899]">{{ appointment.teacher }}</span>
            </div>
            <div class="flex items-center">
              <span>访谈地点：</span>
              <span class="text-[#979899]">{{ appointment.location }}</span>
            </div>
            <div class="flex items-center">
              <span>状态：</span>
              <span class="text-[#979899]">
                {{ appointment.statusText }}
              </span>
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
