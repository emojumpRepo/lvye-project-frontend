<script lang="ts" setup>
import type { AssessmentRecord, RecordInfo } from '@vben/types';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Empty, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getStudentRiskAssessmentRecords } from '#/api/psychology';
import AssessmentReportDialog from '#/components/Dialog/AssessmentReportDialog/index.vue';
import { getDictLabel } from '#/utils/dict';

import RecordCard from './RecordCard.vue';

const props = defineProps<{
  activeInterventionTabKey: number;
  studentProfileId?: number;
}>();

const [AssessmentReportModal, assessmentReportModalApi] = useVbenModal({
  connectedComponent: AssessmentReportDialog,
});

const records = ref<RecordInfo[]>([]);
const evaluationRecords = ref<AssessmentRecord[]>([]);

async function loadAssessmentRecords(id: number) {
  try {
    const response = await getStudentRiskAssessmentRecords(id);
    if (response && response.length > 0) {
      evaluationRecords.value = response;
      records.value = response.map((item) => {
        return {
          id: item.id,
          title: '风险评估事件',
          status: {
            label: '已定级',
            value: '5',
            colorType: 'success',
            cssClass: 'success',
          },
          labelList: [
            {
              label: '评估负责人',
              value: item.assessorName,
            },
            {
              label: '评估结果',
              value: getDictLabel('risk_level', item.riskLevel),
            },
            {
              label: '评估时间',
              value: item.createTime
                ? dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')
                : '',
            },
          ],
          buttonText: '查看结果',
          showButton: true,
        } as RecordInfo;
      });
    }
  } catch (error) {
    console.error('获取危机干预历史记录失败', error);
    message.error('获取危机干预历史记录失败');
  }
}

watch(
  () => props.activeInterventionTabKey,
  async (newVal) => {
    if (props.studentProfileId && newVal === 1) {
      await loadAssessmentRecords(props.studentProfileId);
    } else {
      records.value = [];
    }
  },
  { immediate: true },
);

/** 查看报告 */
function viewEvaluationReport(recordId: number) {
  if (!recordId) return;
  const record = evaluationRecords.value.find((item) => item.id === recordId);
  if (record) {
    assessmentReportModalApi
      .setData({
        assessmentReport: record,
      })
      .open();
  }
}
</script>

<template>
  <div class="scroll-area box-border h-full w-full overflow-y-auto px-4 pb-4">
    <template v-if="records.length > 0">
      <div class="grid grid-cols-2 gap-4">
        <template v-for="record in records" :key="record.title">
          <RecordCard
            :card-info="record"
            button-text="查看报告"
            @handle-record="viewEvaluationReport"
          />
        </template>
      </div>
    </template>
    <template v-else>
      <div class="flex-center h-full">
        <Empty description="暂无数据" />
      </div>
    </template>

    <AssessmentReportModal />
  </div>
</template>

<style lang="scss" scoped>
.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 35%);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 999px;
}
</style>
