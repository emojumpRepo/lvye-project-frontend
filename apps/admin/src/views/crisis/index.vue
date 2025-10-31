<script lang="ts" setup>
import type { CrisisBoardData } from '@vben/types';

import type { CrisisBoardDataPageReq } from '#/api/psychology/crisis';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Spin as ASpin } from 'ant-design-vue';

import { getCrisisBoardData } from '#/api/psychology/crisis';

import CrisisSearch from './components/CrisisSearch.vue';
import InterventionCard from './components/InterventionCard.vue';

defineOptions({ name: 'CrisisIntervention' });

const loading = ref(true);
const interventionList = ref<CrisisBoardData[]>([]);
const crisisSearchRef = ref<InstanceType<typeof CrisisSearch>>();

/**
 * 加载五级看板数据
 * @param params 搜索参数
 */
async function loadCrisisBoardData(params?: CrisisBoardDataPageReq) {
  loading.value = true;
  try {
    const response = await getCrisisBoardData({
      pageNo: 1,
      pageSize: 5,
      ...params,
    });
    if (response.length > 0) {
      interventionList.value = response;
    }
  } catch (error) {
    console.error('获取五级看板数据失败:', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 更新指定干预卡片的学生列表数据
 * @param dictValue 风险等级字典值
 * @param studentPage 学生分页数据
 */
function handleUpdateStudentPage(
  dictValue: number,
  studentPage: CrisisBoardData['studentPage'],
) {
  const item = interventionList.value.find(
    (item) => item.dictValue === dictValue,
  );
  if (item) {
    item.studentPage = studentPage;
  }
}

onMounted(async () => {
  await loadCrisisBoardData();
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4 p-2">
      <!-- 搜索表单 -->
      <CrisisSearch
        ref="crisisSearchRef"
        @search="loadCrisisBoardData"
        :loading="loading"
      />

      <!-- 列表 -->
      <ASpin :spinning="loading" class="flex-center">
        <div class="grid grid-cols-5 gap-5" :class="{ 'h-[300px]': loading }">
          <template v-for="item in interventionList" :key="item.type">
            <InterventionCard
              :intervention-item="item"
              :search-params="crisisSearchRef?.crisisEventListReq"
              @update-student-page="
                (studentPage) =>
                  handleUpdateStudentPage(item.dictValue, studentPage)
              "
            />
          </template>
        </div>
      </ASpin>
    </div>
  </Page>
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
