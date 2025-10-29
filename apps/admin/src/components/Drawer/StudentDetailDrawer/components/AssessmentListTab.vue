<script lang="ts" setup>
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { onMounted, ref } from 'vue';

import { Empty } from 'ant-design-vue';

import { getStudentAssessmentHistory } from '#/api/psychology';

import RecordCard from './RecordCard.vue';

const props = defineProps<{
  studentProfileId?: number;
}>();

const studentAssessmentHistory = ref<
  PsychologyStudentProfileApi.StudentAssessmentHistory[]
>([]);

/**
 * 加载学生测评历史数据
 * @param id 学生id
 */
async function loadStudentAssessmentHistory(id: number) {
  try {
    const assessmentHistory = await getStudentAssessmentHistory(id);
    if (assessmentHistory.length === 0) return;
    studentAssessmentHistory.value = assessmentHistory;
  } catch (error) {
    console.error('加载学生测评历史数据失败', error);
  }
}

onMounted(async () => {
  if (props.studentProfileId) {
    await loadStudentAssessmentHistory(props.studentProfileId);
  }
});
</script>

<template>
  <div class="box-border h-full w-full overflow-y-auto px-4 pb-4">
    <template v-if="studentAssessmentHistory.length > 0">
      <div class="grid grid-cols-2 gap-4">
        <template v-for="item in studentAssessmentHistory" :key="item.taskId">
          <RecordCard
            :card-info="item"
            :button-text="item.status === 1 ? '开始评估' : '提醒填写'"
          />
        </template>
      </div>
    </template>
    <template v-else>
      <Empty description="暂无数据" />
    </template>
  </div>
</template>
