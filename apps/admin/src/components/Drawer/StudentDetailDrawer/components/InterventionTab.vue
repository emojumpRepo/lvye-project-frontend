<script lang="ts" setup>
import type {
  AssessmentRecord,
  InterventionPlan,
  RecordInfo,
} from '@vben/types';

import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { inject, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';

import { Empty, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getInterventionPlanList,
  getStudentRiskAssessmentRecords,
} from '#/api/psychology';
import AssessmentReportDialog from '#/components/Dialog/AssessmentReportDialog/index.vue';
import CrisisInterventionDialog from '#/components/Dialog/CrisisInterventionDialog/index.vue';
import { getDictLabel, getDictObj } from '#/utils/dict';

import RecordCard from './RecordCard.vue';

const props = defineProps<{
  activeInterventionTabKey: number;
  studentProfile?: PsychologyStudentProfileApi.StudentProfile;
  studentProfileId?: number;
}>();

const viewEvent = inject<
  ((student: any, interventionId: number) => void) | undefined
>('viewEvent', undefined);

/** 风险评估弹窗 */
const [AssessmentReportModal, assessmentReportModalApi] = useVbenModal({
  connectedComponent: AssessmentReportDialog,
});

/** 危机干预弹窗 */
const [CrisisInterventionModal, crisisInterventionModalApi] = useVbenModal({
  connectedComponent: CrisisInterventionDialog,
});

const route = useRoute();
const records = ref<RecordInfo[]>([]);
const evaluationRecords = ref<AssessmentRecord[]>([]);
const interventionPlanList = ref<InterventionPlan[]>([]);

/** 加载风险评估记录 */
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

/** 加载干预计划列表 */
async function loadInterventionPlanList(id: number) {
  if (!id) return;
  try {
    const response = await getInterventionPlanList(id);
    if (response && response.length > 0) {
      interventionPlanList.value = response;
      records.value = response.map((item) => {
        const interventionPlanStatus = getDictObj(
          'intervention_plan_status',
          item.status,
        );

        return {
          id: item.id,
          title: item.title,
          status: {
            label: interventionPlanStatus?.label,
            value: interventionPlanStatus?.value,
            colorType: interventionPlanStatus?.colorType,
            cssClass: interventionPlanStatus?.colorType,
          },
          labelList: [
            {
              label: '干预计划负责人',
              value: item.creatorName,
            },
            {
              label: '开启干预时间',
              value: item.createTime
                ? dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')
                : '',
            },
            {
              label: '结束干预时间',
              value: item.updateTime
                ? dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss')
                : '',
            },
          ],
          buttonText: '查看详情',
          showButton: true,
        } as RecordInfo;
      });
    }
  } catch (error) {
    console.error('获取干预计划列表失败', error);
  }
}

watch(
  () => props.activeInterventionTabKey,
  async (newVal) => {
    await (props.studentProfileId && newVal === 1
      ? loadAssessmentRecords(props.studentProfileId)
      : loadInterventionPlanList(props.studentProfileId ?? 0));
  },
  { immediate: true },
);

/** 查看报告/详情 */
function viewEvaluationReport(recordId: number) {
  if (!recordId) return;

  if (props.activeInterventionTabKey === 1) {
    const record = evaluationRecords.value.find((item) => item.id === recordId);
    if (record) {
      assessmentReportModalApi
        .setData({
          assessmentReport: record,
        })
        .open();
    }
  } else if (props.activeInterventionTabKey === 2) {
    const record = interventionPlanList.value.find(
      (item) => item.id === recordId,
    );
    if (record) {
      if (route.path === '/crisis') {
        viewEvent?.(
          {
            studentProfileId: props.studentProfileId,
            studentName: props.studentProfile?.name,
            className: props.studentProfile?.className,
          },
          record.id,
        );
      } else {
        crisisInterventionModalApi
          .setData({
            studentInfo: {
              studentProfileId: props.studentProfileId,
              studentName: props.studentProfile?.name,
              className: props.studentProfile?.className,
            },
            interventionPlanId: record.id,
            fullScreen: true,
          })
          .open();
      }
    }
  }
}
</script>

<template>
  <div class="scroll-area box-border h-full w-full overflow-y-auto pb-4">
    <template v-if="records.length > 0">
      <div class="grid grid-cols-2 gap-4">
        <template v-for="record in records" :key="record.id">
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
    <CrisisInterventionModal />
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
