<script lang="ts" setup>
import { ref } from 'vue';

import RecordCard from './RecordCard.vue';

const consultRecord = ref([
  {
    name: '个体心理咨询',
    status: 'filled',
    createTime: '2024-01-01',
    teacher: '张晓红',
    tags: ['人际关系', '学习困难'],
  },
  {
    name: '个体心理咨询',
    status: 'filled',
    createTime: '2024-01-01',
    teacher: '张晓红',
    tags: ['人际关系', '学习困难'],
  },
]);
</script>

<template>
  <div class="box-border h-full w-full overflow-y-auto px-4 pb-4">
    <div class="grid grid-cols-2 gap-4">
      <template v-for="record in consultRecord" :key="record.name">
        <RecordCard :card-info="record" button-text="待教师上传" />
      </template>
    </div>
  </div>
</template>
