<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { RadioGroup as ARadioGroup, Select as ASelect } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

const exportReportType = ref([
  {
    title: '学生基础信息与家庭报告',
    subTitle: '包含学籍,家庭背景等静态信息',
    value: 'studentBaseInfo',
    icon: 'mdi:account-card-details',
    iconColor: '#1890ff',
  },
  {
    title: '学生动态时间线',
    subTitle: '导出完整的综合时间线记录',
    value: 'studentDynamicTimeline',
    icon: 'mdi:timeline-clock',
    iconColor: '#52c41a',
  },
  {
    title: '全部心理测评报告',
    subTitle: '将所有历史测评报告合并为一个文件',
    value: 'studentAssessmentReport',
    icon: 'mdi:clipboard-pulse',
    iconColor: '#fa8c16',
  },
  {
    title: '全部心理咨询报告',
    subTitle: '将所有历史咨询/访谈报告合并为一个文件',
    value: 'studentConsultationRecord',
    icon: 'mdi:file-document-multiple',
    iconColor: '#722ed1',
  },
  {
    title: '单份心理咨询报告',
    subTitle: '选择具体某一次咨询进行导出',
    value: 'studentConsultationReport',
    icon: 'mdi:file-document',
    iconColor: '#eb2f96',
  },
]);

const exportType = ref([
  {
    label: 'PDF文件',
    value: 'pdf',
  },
  {
    label: 'ZIP压缩包',
    value: 'zip',
  },
]);

const selectedExportReportType = ref<string[]>([]);
const consultantRecord = ref([]);
const currentConsultantRecord = ref();
const currentExportType = ref('zip');

const [ExportStudnetInfoDialog] = useVbenModal({
  title: '选择导出信息',
  fullscreenButton: false,
  destroyOnClose: true,
  class: '!w-[720px]',
});

function handleSelectExportReportType(value: string) {
  if (selectedExportReportType.value.includes(value)) {
    selectedExportReportType.value = selectedExportReportType.value.filter(
      (item) => item !== value,
    );
  } else {
    selectedExportReportType.value.push(value);
  }
}
</script>
<template>
  <ExportStudnetInfoDialog>
    <div class="px-2 py-1">
      <div class="mb-4 text-sm font-bold">请选择要导出的报表类型 (可多选)</div>

      <!-- 报表类型 -->
      <div class="space-y-3">
        <div
          v-for="item in exportReportType"
          :key="item.value"
          class="cursor-pointer rounded-xl border border-solid px-6 py-4"
          :class="
            selectedExportReportType.includes(item.value)
              ? 'border-[#04DC70] bg-[#04DC7014]'
              : 'border-[#D9D9D9] bg-white'
          "
          @click="handleSelectExportReportType(item.value)"
        >
          <div class="flex items-center gap-4">
            <!-- 图标区域 -->
            <IconifyIcon
              :icon="item.icon"
              :color="item.iconColor"
              class="size-6"
            />
            <!-- 文本内容区域 -->
            <div class="flex-1 space-y-1">
              <div class="text-sm font-bold">{{ item.title }}</div>
              <div class="text-xs text-[#979899]">{{ item.subTitle }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 咨询记录 -->
      <ASelect
        v-model:value="currentConsultantRecord"
        :options="consultantRecord"
        placeholder="请选择咨询记录"
        class="mt-4 w-full"
      />

      <!-- 导出格式 -->
      <div class="mt-4">
        <div class="mb-3 text-sm font-bold">导出格式</div>
        <ARadioGroup v-model:value="currentExportType" :options="exportType" />
      </div>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between p-2">
        <div class="text-xs text-[#979899]">注意：导出操作会通知上级管理员</div>
        <div class="flex gap-2">
          <LyButton type="default" size="middle">取消</LyButton>
          <LyButton type="success" size="middle">确认</LyButton>
        </div>
      </div>
    </template>
  </ExportStudnetInfoDialog>
</template>
