<script lang="ts" setup>
import { ref } from 'vue';
import RecordCard from './RecordCard.vue';

const historyList = ref([
  { name: 'XXX量表量表', status: '待填写', createTime: '2024-01-01', type: '单人测评' },
  { name: 'XXX量表量表', status: '待填写', createTime: '2024-01-01', type: '单人测评' },
  { name: 'XXX量表量表', status: '待填写', createTime: '2024-01-01', type: '单人测评' },
]);
</script>

<template>
  <div class="box-border grid h-full w-full grid-cols-2 gap-4 overflow-y-auto px-4 pb-4">
    <RecordCard v-for="item in historyList" :key="item.name" :card-info="item" button-text="提醒填写" />
  </div>
</template>




