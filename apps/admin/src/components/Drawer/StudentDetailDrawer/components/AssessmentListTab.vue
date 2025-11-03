<script lang="ts" setup>
import type { RecordInfo } from '@vben/types';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Empty, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getStudentAssessmentHistory } from '#/api/psychology';
import QuestionnaireResultDialog from '#/components/Dialog/QuestionnaireResultDialog/index.vue';
import { getDictLabel } from '#/utils/dict';

import RecordCard from './RecordCard.vue';

const props = defineProps<{
  studentName?: string;
  studentProfileId?: number;
}>();

const [QuestionnaireResultDialogModal, questionnaireResultDialogModalApi] =
  useVbenModal({
    connectedComponent: QuestionnaireResultDialog,
  });

const records = ref<RecordInfo[]>([]);

/**
 * 加载学生测评历史数据
 * @param id 学生id
 */
async function loadStudentAssessmentHistory(id: number) {
  try {
    const assessmentHistory = await getStudentAssessmentHistory(id);
    if (assessmentHistory.length === 0) return;
    records.value = assessmentHistory.map((item) => ({
      id: Number(item.taskResultId),
      title: item.taskName,
      status: {
        label: item.status === 2 ? '已完成' : '待填写',
        value: String(item.status),
        colorType: item.status === 2 ? 'success' : 'warning',
      },
      labelList: [
        {
          label: '测评对象',
          value: getDictLabel(
            'assessment_target_audience',
            item.targetAudience,
          ),
        },
        {
          label: '测评时间',
          value: dayjs(item.startline).format('YYYY-MM-DD HH:mm:ss'),
        },
      ],
      buttonText: item.status === 2 ? '查看报告' : '提醒填写',
      showButton: true,
    }));
  } catch (error) {
    console.error('加载学生测评历史数据失败', error);
  }
}

/** 查看报告 */
function viewReport(recordId: number) {
  if (!recordId) return message.warning('即将上线');
  const record = records.value.find((item) => item.id === recordId);
  if (record) {
    questionnaireResultDialogModalApi
      .setData({
        id: recordId,
        name: props.studentName,
        taskName: record.title,
      })
      .open();
  }
}

onMounted(async () => {
  if (props.studentProfileId) {
    await loadStudentAssessmentHistory(props.studentProfileId);
  }
});
</script>

<template>
  <div class="scroll-area box-border h-full w-full overflow-y-auto px-4 pb-4">
    <template v-if="records.length > 0">
      <div class="grid grid-cols-2 gap-4">
        <template v-for="item in records" :key="item.taskId">
          <RecordCard :card-info="item" @handle-record="viewReport" />
        </template>
      </div>
    </template>
    <template v-else>
      <div class="flex-center h-full">
        <Empty description="暂无数据" />
      </div>
    </template>

    <QuestionnaireResultDialogModal />
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
