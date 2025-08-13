<script lang="ts" setup>
import { ref } from 'vue';
import RecordCard from './RecordCard.vue';

const consultRecord = ref([
  { name: '个体心理咨询', status: 'filled', createTime: '2024-01-01', teacher: '张晓红', tags: ['人际关系', '学习困难'] },
  { name: '个体心理咨询', status: 'filled', createTime: '2024-01-01', teacher: '张晓红', tags: ['人际关系', '学习困难'] },
]);
</script>

<template>
  <div class="box-border grid h-full w-full grid-cols-2 gap-4 overflow-y-auto px-4 pb-4">
    <RecordCard v-for="record in consultRecord" :key="record.name" :card-info="record" button-text="待教师上传" />
  </div>
</template>



