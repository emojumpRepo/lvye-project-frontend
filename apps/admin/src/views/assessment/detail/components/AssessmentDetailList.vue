<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { QuestionnaireApi } from '#/api/assessment/questionnaire/index';

import { ref } from 'vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import LyButton from '#/components/LyButton/index.vue';

import { useGridColumns } from '../data';
import AssessmentDetailSearch from './AssessmentDetailSearch.vue';

const actionButtons = ref([
  { label: '批量发送提醒', value: 'batchSendReminder' },
  { label: '批量转入干预', value: 'batchTransferToIntervention' },
  { label: '批量导出', value: 'batchExport' },
  { label: '创建测评', value: 'createAssessment' },
]);

const activeButton = ref('');
const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: QuestionnaireApi.Questionnaire[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: '400px',
    pagerConfig: {
      enabled: true,
      pageSize: 10,
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
    },
    proxyConfig: { ajax: { query: async () => [] } },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: false, search: true, custom: false, zoom: false },
  } as VxeTableGridOptions<QuestionnaireApi.Questionnaire>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

function viewDetail(record: any) {
  console.log('查看详情:', record);
}
</script>

<template>
  <div class="mb-6">
    <AssessmentDetailSearch />
    <div class="my-6 flex gap-2">
      <LyButton
        v-for="item in actionButtons"
        :key="item.value"
        size="middle"
        type="default"
        @click="activeButton = item.value"
      >
        {{ item.label }}
      </LyButton>
    </div>
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看报告',
              type: 'link',
              color: '#2C68FF',
              onClick: viewDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>

<style lang="scss" scoped>
.action-button {
  @apply flex h-10 cursor-pointer items-center justify-center rounded-md text-xs;

  width: 100px;
}

:deep(.vxe-cell--col-resizable) {
  display: none !important;
}

:deep(.vxe-grid) {
  padding-top: 0 !important;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

:deep(.vxe-pager) {
  background: transparent !important;
}

:deep(.vxe-pager--goto) {
  width: 2.4em !important;
  margin: 0 4px !important;
}

:deep(.vxe-pager--wrapper) {
  align-items: center !important;
}

:deep(.vxe-pager--sizes) {
  width: 8em !important;
  margin-right: 0 !important;
}

:deep(.vxe-icon-caret-down) {
  margin-top: 3px !important;
}

:deep(.vxe-input--inner) {
  padding-right: 0 !important;
}
</style>
