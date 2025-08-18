<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Divider, Tabs } from 'ant-design-vue';

import AssessmentListTab from '#/components/Drawer/StudentDrawer/components/AssessmentListTab.vue';
import ConsultationListTab from '#/components/Drawer/StudentDrawer/components/ConsultationListTab.vue';
import PersonalInfoTab from '#/components/Drawer/StudentDrawer/components/PersonalInfoTab.vue';
import TimelineTab from '#/components/Drawer/StudentDrawer/components/TimelineTab.vue';
import LyButton from '#/components/LyButton/index.vue';

interface FooterButton {
  label: string;
  value: string;
  icon: string;
  type: 'dashed' | 'primary';
  color: string;
  class: string;
}

const [Drawer] = useVbenDrawer({
  class: 'w-[800px]',
  contentClass: 'bg-gray-50 p-0',
  showCancelButton: false,
  showConfirmButton: false,
});

const baseInfo = ref([
  { label: '姓名', value: '张明' },
  { label: '性别', value: '男' },
  { label: '年龄', value: '18岁' },
  { label: '年级', value: '初三（2）班' },
  { label: '学号', value: '20210101' },
]);

const mentalStates = ref({
  normal: { bg: '#E4FFF0', borderColor: '#8CFFC6', color: '#04DC70' },
  general: { bg: '#1966FF14', borderColor: '#1966FF66', color: '#1966FF' },
  serious: { bg: '#FF9C0514', borderColor: '#FF9C0566', color: '#FF9C05' },
  major: { bg: '#FF08310D', borderColor: '#FF083166', color: '#FF0831' },
  observe: { bg: '#1E96FF14', borderColor: '#1E96FF66', color: '#1E96FF' },
});

const coreProblemTags = ref(['人际关系', '情绪管理', '适应困难', '学习困难']);

const footerButtons = ref<FooterButton[]>([
  {
    label: '评估',
    value: 'assessment',
    icon: 'solar:health-bold',
    type: 'dashed',
    color: '#578FFF',
    class: 'border-[#578FFF] text-[#578FFF] hover:bg-[#578FFF]/10',
  },
  {
    icon: 'ep:warn-triangle-filled',
    label: '上报异常',
    value: 'reportAbnormal',
    type: 'dashed',
    color: '#FF9C05',
    class: 'border-[#FF9C05] text-[#FF9C05] hover:bg-[#FF9C05]/10',
  },
  {
    icon: 'solar:chat-round-line-bold',
    label: '预约访谈',
    value: 'interview',
    type: 'primary',
    color: '#578FFF',
    class: 'border-[#578FFF] bg-[#578FFF] text-white hover:bg-[#578FFF]/80',
  },
  {
    icon: 'material-symbols:event-note',
    label: '发起测评',
    value: 'startAssessment',
    type: 'primary',
    color: '#04DC70',
    class: 'border-[#04DC70] bg-[#04DC70] text-white hover:bg-[#04DC70]/80',
  },
]);
</script>
<template>
  <Drawer title="学生360°档案">
    <template #title>
      <div class="flex items-center gap-2">
        <img
          src="../../../static/icons/student/360file_student.png"
          class="w-5"
        />
        <span class="text-lg font-bold">学生360°档案</span>
      </div>
    </template>
    <div class="flex h-full flex-col gap-3">
      <div class="bg-white px-4 pb-3 pt-6">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2.5">
            <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
            <span class="font-bold">基础信息</span>
          </div>
          <div class="flex items-center justify-between">
            <div v-for="item in baseInfo" :key="item.label" class="text-xs">
              <span class="font-medium">{{ item.label }}：</span>
              <span class="text-[#4B4B4D]">{{ item.value }}</span>
            </div>
          </div>
        </div>
        <div
          class="my-7 flex items-center justify-between rounded-lg border border-solid border-[#8CFFC6] bg-[#14E77E14] px-4 py-3"
        >
          <div class="flex items-center gap-1 text-sm font-bold">
            <IconifyIcon
              icon="solar:health-bold"
              :color="mentalStates.normal.color"
              class="size-5"
            />
            <span>心理状态：</span>
            <span :style="{ color: mentalStates.normal.color }">正常</span>
          </div>
          <div class="text-xs text-[#979899]">
            <span>张信心</span>
            <span>老师更新于</span>
            <span>2024-01-01 12:00:00</span>
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <Divider type="vertical" class="m-0 h-3 w-0.5 bg-[#04DC70]" />
            <span class="text-sm font-bold">核心问题标签</span>
          </div>
          <div class="flex items-center gap-2.5">
            <div v-for="tag in coreProblemTags" :key="tag">
              <span
                class="inline-block rounded-md border border-solid border-gray-200 p-2 text-xs text-gray-700"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-x-hidden bg-white pb-5 pt-2">
        <div class="relative h-full w-full">
          <Tabs :tab-bar-gutter="24">
            <Tabs.TabPane tab="综合时间线" key="timeline">
              <TimelineTab />
            </Tabs.TabPane>
            <Tabs.TabPane tab="测评历史" key="history">
              <AssessmentListTab />
            </Tabs.TabPane>
            <Tabs.TabPane tab="咨询与干预记录" key="consultation">
              <ConsultationListTab />
            </Tabs.TabPane>
            <Tabs.TabPane tab="完善个人信息" key="personalInfo">
              <PersonalInfoTab />
            </Tabs.TabPane>
          </Tabs>
          <LyButton
            type="success"
            size="middle"
            class="absolute right-7 top-1.5"
          >
            导出信息
          </LyButton>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <button
          v-for="button in footerButtons"
          :key="button.value"
          class="flex items-center gap-1 rounded-md border border-solid px-7 py-2 text-sm"
          :class="button.class"
        >
          <IconifyIcon
            :icon="button.icon"
            :color="button.type === 'dashed' ? button.color : '#fff'"
            class="size-4"
          />
          <span class="text-xs">{{ button.label }}</span>
        </button>
      </div>
    </template>
  </Drawer>
</template>

<style lang="scss" scoped>
:deep(.ant-tabs) {
  height: 100%;
}

:deep(.ant-tabs-nav) {
  padding: 0 16px;
}

:deep(.ant-tabs-content-top) {
  height: 100%;
}

:deep(.ant-tabs-tab-btn) {
  font-size: 14px;
  font-weight: 500 !important;
  color: #979899;
}

:deep(.ant-tabs-nav::before) {
  display: none !important;
}

:deep(.ant-tabs-ink-bar) {
  height: 4px !important;
  background: #04dc70 !important;
}
</style>
