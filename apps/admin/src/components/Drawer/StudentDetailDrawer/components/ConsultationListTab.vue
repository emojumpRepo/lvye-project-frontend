<script lang="ts" setup>
import type { RecordInfo } from '@vben/types';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Empty, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getConsultationRecordByStudentProfileId } from '#/api/psychology';
import UploadEvaluationReportDialog from '#/components/Dialog/UploadEvaluationReportDialog/index.vue';
import { getDictObj } from '#/utils/dict';

import RecordCard from './RecordCard.vue';

const props = defineProps<{
  studentProfileId?: number;
}>();

const emits = defineEmits<{
  (e: 'viewConsultReport', recordId: number): void;
}>();

const consultRecords = ref<RecordInfo[]>([]);

/** 上传纪要弹窗 */
const [UploadEvaluationReportModal, uploadEvaluationReportModalApi] =
  useVbenModal({
    connectedComponent: UploadEvaluationReportDialog,
  });

/** 处理咨询记录 */
function handleConsultRecord(recordId: number, status: string | undefined) {
  if (!status) return;
  if (Number(status) === 2) {
    uploadEvaluationReportModalApi.setData({ id: recordId }).open();
  } else if (Number(status) === 3) {
    emits('viewConsultReport', recordId);
  }
}

/** 加载咨询记录 */
async function loadConsultRecords() {
  if (!props.studentProfileId) return;

  try {
    const response = await getConsultationRecordByStudentProfileId(
      props.studentProfileId,
    );
    if (response && response.length > 0) {
      consultRecords.value = response.map((item) => {
        const dict = getDictObj('counseling_status', item.status);
        let buttonText: string | undefined;
        if (item.status === 2) {
          buttonText = '待教师上传';
        } else if (item.status === 3) {
          buttonText = '查看报告';
        }
        return {
          id: item.id,
          title: '个体心理咨询',
          status: dict
            ? {
                label: dict.label,
                value: String(dict.value),
                colorType: dict.colorType,
                cssClass: dict.cssClass,
              }
            : undefined,
          labelList: [
            {
              label: '时间',
              value: dayjs(item.appointmentStartTime).format(
                'YYYY-MM-DD HH:mm:ss',
              ),
            },
            {
              label: '老师',
              value: item.counselorName,
            },
            {
              label: '咨询类型',
              value: item.consultationType,
            },
          ],
          buttonText,
          showButton: item.status === 2 || item.status === 3,
        } as RecordInfo;
      });
    }
  } catch (error) {
    console.error('获取咨询记录失败', error);
    message.error('获取咨询记录失败');
  }
}

onMounted(async () => {
  if (props.studentProfileId) {
    await loadConsultRecords();
  }
});
</script>

<template>
  <div class="scroll-area box-border h-full w-full overflow-y-auto px-4 pb-4">
    <template v-if="consultRecords.length > 0">
      <div class="grid grid-cols-2 gap-4">
        <template v-for="record in consultRecords" :key="record.name">
          <RecordCard
            :card-info="record"
            @handle-record="
              handleConsultRecord(record.id, record.status?.value)
            "
          />
        </template>
      </div>
    </template>
    <template v-else>
      <div class="flex-center h-full">
        <Empty description="暂无数据" />
      </div>
    </template>
    <UploadEvaluationReportModal @refresh="loadConsultRecords" />
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
