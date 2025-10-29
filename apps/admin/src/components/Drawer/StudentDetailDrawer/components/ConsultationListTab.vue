<script lang="ts" setup>
import type { RecordInfo } from '@vben/types';

import { onMounted, ref } from 'vue';

import { Empty, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getConsultationRecordByStudentProfileId } from '#/api/psychology';
import { getDictObj } from '#/utils/dict';

import RecordCard from './RecordCard.vue';

const props = defineProps<{
  studentProfileId?: number;
}>();

const consultRecords = ref<RecordInfo[]>([]);

onMounted(async () => {
  if (props.studentProfileId) {
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
});
</script>

<template>
  <div class="box-border h-full w-full overflow-y-auto px-4 pb-4">
    <template v-if="consultRecords.length > 0">
      <div class="grid grid-cols-2 gap-4">
        <template v-for="record in consultRecords" :key="record.name">
          <RecordCard :card-info="record" button-text="查看报告" />
        </template>
      </div>
    </template>
    <template v-else>
      <Empty description="暂无数据" />
    </template>
  </div>
</template>
