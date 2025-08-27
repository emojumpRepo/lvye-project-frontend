<script lang="ts" setup>
import { ref } from 'vue';

import { Empty } from 'ant-design-vue';

import RecordCard from './RecordCard.vue';

const consultRecord = ref([]);
</script>

<template>
  <div class="box-border h-full w-full overflow-y-auto px-4 pb-4">
    <template v-if="consultRecord.length > 0">
      <div class="grid grid-cols-2 gap-4">
        <template v-for="record in consultRecord" :key="record.name">
          <RecordCard :card-info="record" button-text="待教师上传" />
        </template>
      </div>
    </template>
    <template v-else>
      <Empty description="暂无数据" />
    </template>
  </div>
</template>
