<script lang="ts" setup>
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { onMounted, ref } from 'vue';

import { Empty } from 'ant-design-vue';

import { getStudentProfileTimeline } from '#/api/psychology/student-profile';

import RecordCard from './RecordCard.vue';

const props = defineProps<{
  studentProfileId: number | undefined;
}>();

const timelineList = ref<PsychologyStudentProfileApi.StudentProfileTimeline[]>(
  [],
);

onMounted(async () => {
  if (props.studentProfileId) {
    const data = await getStudentProfileTimeline(props.studentProfileId);
    timelineList.value = data;
  }
});
</script>

<template>
  <div class="box-border h-full w-full overflow-y-auto px-4 pb-4">
    <template v-if="timelineList.length > 0">
      <div class="grid grid-cols-2 gap-4">
        <template v-for="item in timelineList" :key="item.taskId">
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
