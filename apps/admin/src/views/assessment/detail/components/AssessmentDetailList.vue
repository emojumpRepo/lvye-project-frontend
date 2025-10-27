<script lang="ts" setup>
import type { TabItem } from '../types';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyAssessmentApi } from '#/api/psychology/assessment/index';

import { ref, watch } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Tabs as ATabs, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { DICT_Value_COLOR_MAP } from '#/api/constants';
import { getAssessmentTaskParticipantsQuestionnairePage } from '#/api/psychology/assessment/index';
import QuestionnaireResultDialog from '#/components/Dialog/QuestionnaireResultDialog/index.vue';
import StudentDrawer from '#/components/Drawer/StudentDrawer/index.vue';
import LyButton from '#/components/LyButton/index.vue';
import LyTag from '#/components/LyTag/index.vue';
import { exportAssessmentParticipantsToExcel } from '#/utils/export';

import { useGridColumns } from '../data';
import AssessmentDetailSearch from './AssessmentDetailSearch.vue';

interface Props {
  taskNo?: string;
  taskName?: string;
  questionnairesTabs?: { key: string; label: string }[];
}

const props = withDefaults(defineProps<Props>(), {
  taskNo: '',
  taskName: '',
  questionnairesTabs: () => [],
});

const emit = defineEmits<{
  (e: 'tabChange', key: any): void;
}>();

// 问卷Tab
const activeTab = defineModel<TabItem>('activeTab', {
  default: () => ({
    key: '',
    label: '',
  }),
});

const actionButtons = ref([
  {
    label: '批量发送提醒',
    value: 'batchSendReminder',
    onClick: handleBatchSendReminder,
    show: false,
  },
  {
    label: '批量转入评估',
    value: 'batchTransferToIntervention',
    onClick: handleBatchTransferToIntervention,
    show: true,
  },
  {
    label: '批量导出',
    value: 'batchExport',
    onClick: handleExport,
    show: true,
  },
]);

const selectedRowKeys = ref<number[]>([]);
const loading = ref(false);
const searchRef = ref<InstanceType<typeof AssessmentDetailSearch>>();
const queryParams =
  ref<PsychologyAssessmentApi.AssessmentTaskParticipantsQuestionnairePageReq>({
    pageNo: 1,
    pageSize: 10,
    taskNo: '',
    questionnaireId: 0,
  });

const [QuestionnaireResultModal, questionnaireResultModalApi] = useVbenModal({
  connectedComponent: QuestionnaireResultDialog,
});

// 详情抽屉
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: StudentDrawer,
});

/** 处理行选中 */
function handleRowCheckboxChange({ records }: { records: any[] }) {
  selectedRowKeys.value = records
    .map((item) => item.studentProfileId)
    .filter(Boolean);
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(activeTab.value.key),
    // height: '400px',
    keepSource: true,
    pagerConfig: {
      enabled: true,
      pageSize: 10,
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
      pageSizes: [10, 20, 30, 40, 50, 60],
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
              ...searchRef.value?.assessmentDetailSearchParams,
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
    rowConfig: { keyField: 'seq' },
    toolbarConfig: { refresh: false, search: true, custom: false, zoom: false },
  } as VxeTableGridOptions<PsychologyAssessmentApi.ParticipantsQuestionnairePageRes>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

watch(
  () => [props.taskNo, activeTab.value.key],
  async ([newTaskNo, newActiveTabKey]) => {
    // 更新列配置
    if (gridApi) {
      gridApi.setGridOptions({
        columns: useGridColumns(newActiveTabKey),
      });
    }

    if (newTaskNo || newActiveTabKey) {
      queryParams.value.taskNo = newTaskNo!;
      queryParams.value.questionnaireId = Number(newActiveTabKey) || 0;
      searchRef.value?.handleReset();
      selectedRowKeys.value = [];
      if ((gridApi as any)?.grid?.commitProxy) {
        gridApi.grid.setCurrentPage(1);
        await gridApi.query();
      }
    }
  },
  { immediate: true, flush: 'post' },
);

/** 处理搜索 */
function handleSearch() {
  gridApi.grid.setCurrentPage(1);
  gridApi.query({ pageNo: 1 });
}

/** 处理加载状态 */
function handleLoading(isLoading: boolean) {
  loading.value = isLoading;
}

/** 批量发送提醒 */
function handleBatchSendReminder() {
  message.warning('即将上线');
}

/** 批量转入干预 */
function handleBatchTransferToIntervention() {
  message.warning('即将上线');
}

/** 切换tab */
function handleTabChange(key: any) {
  emit('tabChange', key);
}

/** 查看详情 */
function viewDetail(
  row: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes,
) {
  if (activeTab.value.key) {
    questionnaireResultModalApi
      .setData({
        id: row?.id,
        name: row?.name,
        questionnaireName: row?.questionnaireName,
        questionnaireId: activeTab.value.key,
      })
      .open();
  } else {
    questionnaireResultModalApi
      .setData({
        id: row?.id,
        name: row?.name,
        taskName: props.taskName,
        questionnairesTabs: props.questionnairesTabs,
      })
      .open();
  }
}

// 导出数据
async function handleExport() {
  try {
    loading.value = true;

    if (selectedRowKeys.value.length === 0) {
      message.warning('请先选择要导出的学生数据');
      return;
    }

    const completedStudents = gridApi.grid
      .getCheckboxRecords()
      .filter((item) => item.status === 1);

    if (completedStudents.length === 0) {
      message.warning('学生未完成测评，无法导出');
      return;
    }

    exportAssessmentParticipantsToExcel(completedStudents, activeTab.value);
  } catch (error) {
    console.error(error);
    message.error('导出失败，请重试');
  } finally {
    loading.value = false;
  }
}

/** 查看详情 */
function viewStudentInfo(id: number) {
  drawerApi.setData({ id }).open();
}
</script>

<template>
  <div class="mb-6">
    <!-- 问卷Tabs -->
    <ATabs
      :tab-bar-gutter="10"
      class="mb-3 mt-2"
      v-model:active-key="activeTab.key"
      @change="handleTabChange"
    >
      <ATabs.TabPane v-for="tab in props.questionnairesTabs" :key="tab.key">
        <template #tab>
          <span
            class="rounded-full bg-white px-3 py-2 text-center text-xs font-medium text-[#979899] transition-all duration-300"
            :class="{
              '!bg-primary !text-white': activeTab.key === tab.key,
            }"
          >
            {{ tab.label }}
          </span>
        </template>
      </ATabs.TabPane>
    </ATabs>

    <AssessmentDetailSearch
      ref="searchRef"
      @search="handleSearch"
      @loading="handleLoading"
    />

    <div class="my-6 flex gap-2">
      <template v-for="button in actionButtons" :key="button.value">
        <LyButton
          v-if="button.show"
          size="middle"
          type="default"
          :disabled="selectedRowKeys.length === 0"
          @click="button.onClick && button.onClick()"
        >
          {{ button.label }}
        </LyButton>
      </template>
    </div>
    <Grid>
      <!-- 学生名称 -->
      <template #name="{ row }">
        <span
          class="cursor-pointer"
          @click="viewStudentInfo(row.studentProfileId)"
        >
          {{ row.name }}
        </span>
      </template>

      <!-- 完成状态  -->
      <template #status="{ row }">
        <LyTag
          :color-type="row.status === 1 ? 'success' : 'error'"
          :tag-label="row.status === 1 ? '已完成' : '未完成'"
        />
      </template>

      <!-- 完成时间 -->
      <template #finishTime="{ row }">
        <span v-if="!row.finishTime">--</span>
        <span v-else>
          {{ dayjs(row.finishTime).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>

      <!-- 风险等级/测评结果 -->
      <template #riskLevel="{ row }">
        <template v-if="row.riskLevel">
          <LyTag
            v-if="
              activeTab.key &&
              (activeTab.label.includes('睡眠质量') ||
                activeTab.label.includes('电子游戏使用情况')) &&
              row.level
            "
            :color-type="DICT_Value_COLOR_MAP[row.riskLevel] || 'default'"
            :tag-label="row.level"
          />

          <LyTag
            v-else
            tag-category-key="questionnaire_result_risk_level"
            :dict-value="row.riskLevel"
          />
        </template>

        <span v-else>--</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          v-if="row.status === 1"
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

    <QuestionnaireResultModal />
    <Drawer />
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
