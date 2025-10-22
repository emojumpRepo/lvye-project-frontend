<script lang="ts" setup>
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { Empty } from 'ant-design-vue';

// import { getStudentProfileTimeline } from '#/api/psychology/student-profile';
import RecordCard from './RecordCard.vue';

defineProps<{
  studentAssessmentHistory: PsychologyStudentProfileApi.StudentAssessmentHistory[];
}>();
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
