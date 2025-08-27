<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyAssessmentApi } from '#/api/psychology/assessment/index';

import { ref, watch } from 'vue';

import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAssessmentTaskParticipantsQuestionnairePage } from '#/api/psychology/assessment/index';
import LyButton from '#/components/LyButton/index.vue';
import LyTag from '#/components/LyTag/index.vue';

import { useGridColumns } from '../data';
import AssessmentDetailSearch from './AssessmentDetailSearch.vue';

interface Props {
  taskNo?: string;
  questionnaireId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  taskNo: '',
  questionnaireId: '',
});

const actionButtons = ref([
  { label: '批量发送提醒', value: 'batchSendReminder' },
  { label: '批量转入干预', value: 'batchTransferToIntervention' },
  { label: '批量导出', value: 'batchExport' },
]);

const activeButton = ref('');
const checkedIds = ref<number[]>([]);
const loading = ref(false);
const searchRef = ref<InstanceType<typeof AssessmentDetailSearch>>();
const queryParams =
  ref<PsychologyAssessmentApi.AssessmentTaskParticipantsQuestionnairePageReq>({
    pageNo: 1,
    pageSize: 10,
    taskNo: '',
    questionnaireId: 0,
  });

/** 处理行选中 */
function handleRowCheckboxChange({ records }: { records: any[] }) {
  checkedIds.value = records
    .map((item) => item.studentProfileId)
    .filter(Boolean);
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: '400px',
    keepSource: true,
    pagerConfig: {
      enabled: true,
      pageSize: 10,
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (
            !queryParams.value.taskNo ||
            (!queryParams.value.questionnaireId && !queryParams.value.taskNo)
          ) {
            return { list: [], total: 0 };
          }

          try {
            const requestParams = {
              ...queryParams.value,
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              ...formValues,
            };

            const response =
              await getAssessmentTaskParticipantsQuestionnairePage(
                requestParams,
              );
            return response;
          } catch (error) {
            console.error('Failed to load assessment participants:', error);
            return { list: [], total: 0 };
          }
        },
      },
    },
    rowConfig: { keyField: 'seq', isHover: true },
    toolbarConfig: { refresh: true, search: true, custom: false, zoom: false },
  } as VxeTableGridOptions<PsychologyAssessmentApi.ParticipantsQuestionnairePageRes>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

watch(
  () => [props.taskNo, props.questionnaireId],
  ([newTaskNo, newQuestionnaireId]) => {
    if (newTaskNo || (newTaskNo && newQuestionnaireId)) {
      queryParams.value.taskNo = newTaskNo;
      queryParams.value.questionnaireId = Number(newQuestionnaireId) || 0;
      searchRef.value?.handleReset();
      checkedIds.value = [];
      gridApi?.query();
    }
  },
  { immediate: true },
);

/** 处理搜索 */
function handleSearch(
  params: PsychologyAssessmentApi.ParticipantsQuestionnairePageReq,
) {
  gridApi.query(params);
}

/** 处理加载状态 */
function handleLoading(isLoading: boolean) {
  loading.value = isLoading;
}

/** 查看详情 */
function viewDetail(record: any) {
  console.log('查看详情:', record);
}
</script>

<template>
  <div class="mb-6">
    <AssessmentDetailSearch
      ref="searchRef"
      @search="handleSearch"
      @loading="handleLoading"
    />

    <div class="my-6 flex gap-2">
      <LyButton
        v-for="item in actionButtons"
        :key="item.value"
        size="middle"
        type="default"
        :disabled="checkedIds.length === 0"
        @click="activeButton = item.value"
      >
        {{ item.label }}
      </LyButton>
    </div>
    <Grid>
      <template #status="{ row }">
        <LyTag
          :color-type="row.status === 1 ? 'success' : 'error'"
          :tag-label="row.status === 1 ? '已完成' : '未完成'"
        />
      </template>
      <template #finishTime="{ row }">
        <span v-if="!row.finishTime">--</span>
        <span v-else>
          {{ dayjs(row.finishTime).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>
      <template #score="{ row }">
        <span v-if="!row.score">--</span>
        <span v-else class="text-primary font-bold">{{ row.score }}</span>
      </template>
      <template #riskLevel="{ row }">
        <LyTag
          v-if="row.riskLevel"
          tag-category-key="questionnaire_result_risk_level"
          :dict-value="row.riskLevel"
        />
        <span v-else>--</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看报告',
              type: 'link',
              color: 'success',
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
  // padding-top: 0 !important;
  // padding-right: 0 !important;
  // padding-left: 0 !important;
}

:deep(.vxe-pager) {
  background: transparent !important;
}

:deep(.vxe-pager--wrapper) {
  align-items: center !important;
}

:deep(.vxe-pager--sizes) {
  width: 8em !important;
  margin-right: 0 !important;
}
</style>
