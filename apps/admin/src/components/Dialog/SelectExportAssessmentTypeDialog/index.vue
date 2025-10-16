<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

const emit = defineEmits<{
  (e: 'export', type: string): void;
}>();

const params = ref<{
  selectedRowKeys: number[];
  totalCount: number;
}>({
  selectedRowKeys: [],
  totalCount: 0,
});

const [SelectAssessmentTypeModal, selectAssessmentTypeModalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  showCancelButton: false,
  onOpenChange: async (open) => {
    if (open) {
      params.value = (await selectAssessmentTypeModalApi.getData()) as {
        selectedRowKeys: number[];
        totalCount: number;
      };
    }
  },
  onConfirm: () => {
    if (!selectedExportType.value) {
      message.warning('请选择导出类型');
      return;
    }

    emit('export', selectedExportType.value);
    selectAssessmentTypeModalApi.close();
  },
});

const exportTypeButtons = [
  {
    label: '测评结果汇总（Excel）',
    value: 'exportAllCompletedStatus',
  },
  {
    label: '答题记录汇总（Excel）',
    value: 'exportAnswerResults',
  },
  {
    label: '个体分析报告（PDF）',
    value: 'exportAnalysisReport',
  },
  {
    label: '个体分析报告 + 答题记录（PDF）',
    value: 'exportAnalysisReportAndAnswerResults',
  },
];

const selectedExportType = ref('');
</script>

<template>
  <SelectAssessmentTypeModal title="请选择导出类型">
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon
          icon="mingcute:file-export-fill"
          color="#04DC70"
          class="size-6"
        />
        <span>请选择导出类型</span>
      </div>
    </template>

    <div class="flex-center my-5 flex-col gap-8">
      <div class="flex text-center">
        <span>是否导出本次测评下的</span>
        <span v-if="params.selectedRowKeys.length === 0">全部</span>
        <span>
          （共{{
            params.selectedRowKeys.length > 0
              ? params.selectedRowKeys.length
              : params.totalCount
          }}名用户）的结果
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="flex-center flex-col gap-4">
        <template v-for="button in exportTypeButtons" :key="button.value">
          <LyButton
            :type="selectedExportType === button.value ? 'success' : 'default'"
            @click="selectedExportType = button.value"
            size="small"
          >
            {{ button.label }}
          </LyButton>
        </template>
      </div>
    </div>
  </SelectAssessmentTypeModal>
</template>
