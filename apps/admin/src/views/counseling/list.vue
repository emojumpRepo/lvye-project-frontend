<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDictLabel } from '#/utils/dict';

import CounselingSearch from './components/CounselSearch.vue';
import { mockQuery, useGridColumns } from './data';

defineOptions({ name: 'CounselingList' });

const loading = ref(false);

// 表格
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: { query: mockQuery },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      refresh: false,
      search: false,
      custom: false,
      zoom: false,
    },
    cellConfig: {
      height: 60,
    },
  } as VxeTableGridOptions,
});

/** 处理搜索 */
function handleSearch(params: any) {
  gridApi.query({ ...params });
}

/** 查看详情 */
function handleViewDetail(row: any) {
  message.warning('即将上线');
}

/** 评估 */
function handleEvalute(row: any) {
  message.warning('即将上线');
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 overflow-hidden">
    <!-- 咨询记录搜索栏 -->
    <CounselingSearch v-model:loading="loading" @search="handleSearch" />
    <!-- 表格 -->
    <div class="flex-1 overflow-hidden">
      <Grid>
        <!-- 学生信息 -->
        <template #studentName="{ row }">
          <div class="flex flex-col gap-1 px-2">
            <div class="font-bold text-[#4C4C4D]">
              {{ row.studentName }}
            </div>
            <p
              class="line-clamp-2 whitespace-normal text-xs leading-normal text-[#4C4C4D]"
            >
              {{ row.className }}
            </p>
          </div>
        </template>

        <!-- 时间 -->
        <template #consultTime="{ row }">
          <div class="flex flex-col gap-1 px-2">
            <div class="font-bold text-[#4C4C4D]">
              {{ dayjs(row.consultTime).format('YYYY-MM-DD HH:mm:ss') }}
            </div>
            <p class="w-full text-xs leading-normal text-[#4C4C4D]">
              {{ row.consultDuration }}分钟
            </p>
          </div>
        </template>

        <!-- 状态 -->
        <template #stauts="{ row }">
          <div class="text-[#4C4C4D]">
            <span>{{ getDictLabel('counseling_status', row.status) }}</span>
            <span class="text-[#FF0831]">（评估预期）</span>
          </div>
        </template>

        <!-- 进度 -->
        <template #progress="{ row }"> ---- </template>

        <!-- 操作 -->
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: '详情',
                type: 'link',
                onClick: handleViewDetail.bind(null, row),
              },
              {
                label: '评估',
                type: 'link',
                onClick: handleEvalute.bind(null, row),
              },
            ]"
          />
        </template>
      </Grid>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-cell--label) {
  color: #4c4c4d !important;
}

:deep(.ant-btn-link) {
  color: #2c68ff !important;
}
</style>
