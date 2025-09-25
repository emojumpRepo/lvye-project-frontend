<script lang="ts" setup>
import type { CrisisBoardData } from '@vben/types';

import { onMounted, ref } from 'vue';

import { Spin as ASpin } from 'ant-design-vue';

import { getCrisisBoardData } from '#/api/psychology/crisis';

import CrisisSearch from './components/CrisisSearch.vue';
import InterventionCard from './components/InterventionCard.vue';

defineOptions({ name: 'CrisisIntervention' });

const loading = ref(true);
const interventionList = ref<CrisisBoardData[]>([]);

onMounted(async () => {
  try {
    const response = await getCrisisBoardData({
      pageNo: 1,
      pageSize: 10,
    });
    console.log('五级看板数据', response);
    if (response.length > 0) {
      interventionList.value = response;
    }
  } catch (error) {
    console.error('五级看板数据', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <!-- 搜索表单 -->
    <CrisisSearch :loading="loading" />

    <!-- 列表 -->
    <ASpin :spinning="loading" class="flex-center">
      <div class="grid grid-cols-5 gap-5" :class="{ 'h-[300px]': loading }">
        <template v-for="item in interventionList" :key="item.type">
          <InterventionCard :intervention-item="item" />
        </template>
      </div>
    </ASpin>
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-pager--sizes) {
  margin-right: 0 !important;
}

:deep(.ant-progress-text) {
  color: #979899;
}

:deep(.ant-btn-link) {
  color: #2c68ff;
}

:deep(.ant-pagination-simple-pager) {
  margin-inline-end: 0 !important;
}
</style>
