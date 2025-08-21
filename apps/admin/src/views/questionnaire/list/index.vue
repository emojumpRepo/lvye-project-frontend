<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  QuestionnairePageReqVO,
  QuestionnaireVO,
} from '#/api/questionnaire/index';

import { onMounted, ref } from 'vue';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteQuestionnaire,
  getQuestionnaireList,
  pauseQuestionnaire,
  publishQuestionnaire,
  syncQuestionnaireData,
  updateQuestionnaire,
} from '#/api/questionnaire/index';
import LyTag from '#/components/LyTag/index.vue';
import { $t } from '#/locales';
import { getDictLabel } from '#/utils/dict';

import QuestionnaireSearch from './components/QuestionnaireSearch.vue';
import { useQuestionGridColumns } from './data';

defineOptions({ name: 'QuestionnaireManagement' });

const loading = ref(false);

/** 子表的列表 */
const selectQuestionnaire = ref<QuestionnaireVO>();

// 处理加载状态
function handleLoading(isLoading: boolean) {
  loading.value = isLoading;
}

// 同步数据
async function handleSync() {
  const hideLoading = message.loading({
    content: '正在同步最新问卷数据...',
    duration: 0,
    key: 'sync_questionnaire',
  });

  try {
    await syncQuestionnaireData();
    message.success({
      content: '同步成功',
      key: 'sync_questionnaire',
    });
    onRefresh();
  } catch {
    message.error({
      content: '同步失败',
      key: 'sync_questionnaire',
    });
  } finally {
    hideLoading();
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

/** 删除问卷 */
async function onDelete(row: QuestionnaireVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteQuestionnaire(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 发布问卷 */
async function onPublish(row: QuestionnaireVO) {
  const hideLoading = message.loading({
    content: `${row.title} 发布中...`,
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    const res = await publishQuestionnaire({
      externalId: row.externalId as string,
      id: row.id as number,
      syncType: 1,
    });
    if (res.success) {
      message.success(`${row.title} 已发布`);
      onRefresh();
    } else {
      message.error(res.message);
    }
  } finally {
    hideLoading();
  }
}

/** 暂停问卷 */
async function onPause(row: QuestionnaireVO) {
  const hideLoading = message.loading({
    content: `${row.title} 暂停中...`,
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    const res = await pauseQuestionnaire({
      externalId: row.externalId as string,
      id: row.id as number,
      syncType: 2,
    });
    if (res.success) {
      message.success(`${row.title} 已暂停`);
      onRefresh();
    } else {
      message.error(res.message);
    }
    onRefresh();
  } finally {
    hideLoading();
  }
}

// 处理搜索
function handleSearch(params: QuestionnairePageReqVO) {
  gridApi.query({ ...params, pageNo: 1 });
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useQuestionGridColumns(),
    height: '600px',
    keepSource: true,
    editConfig: {
      mode: 'row',
      trigger: 'click',
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getQuestionnaireList({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      // refresh: { code: 'query' },
      refresh: false,
      search: false,
      zoom: false,
      custom: false,
    },
  } as VxeTableGridOptions<QuestionnaireVO>,
  gridEvents: {
    cellClick: ({ row }: { row: QuestionnaireVO }) => {
      selectQuestionnaire.value = row;
    },
  },
});

/** 是否处于编辑状态 */
function hasEditStatus(row: QuestionnaireVO) {
  return gridApi.grid?.isEditByRow(row);
}

/** 保存行事件 */
async function saveRowEvent(row: QuestionnaireVO) {
  await gridApi.grid?.clearEdit();
  gridApi.setLoading(true);
  try {
    await updateQuestionnaire(row as QuestionnaireVO);
    message.success($t('ui.actionMessage.operationSuccess'));
    gridApi.query();
  } catch {
    message.error($t('ui.actionMessage.operationFailed'));
  } finally {
    gridApi.setLoading(false);
  }
}

/** 取消行事件 */
function cancelRowEvent(row: QuestionnaireVO) {
  gridApi.grid?.clearEdit();
  gridApi.grid?.revertData(row);
}

onMounted(() => {
  gridApi.query();
});
</script>

<template>
  <div class="flex h-full flex-col p-6">
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div>
        <QuestionnaireSearch @loading="handleLoading" @search="handleSearch" />
      </div>
      <div>
        <Button type="primary" @click="handleSync">同步最新数据</Button>
      </div>
      <div class="min-h-0 flex-1 overflow-hidden">
        <Grid>
          <!-- 问卷类型列 -->
          <template #type="{ row }">
            <LyTag
              color-type="processing"
              :tag-label="
                getDictLabel('questionnaire_type', row.questionnaireType)
              "
            />
          </template>

          <!-- 状态列 -->
          <template #status="{ row }">
            <LyTag
              tag-category-key="questionnaire_status"
              :dict-value="row.status"
            />
          </template>

          <!-- 目标受众列 -->
          <template #targetAudience="{ row }">
            <LyTag
              tag-category-key="questionnaire_target_audience"
              :dict-value="row.targetAudience"
            />
          </template>

          <!-- 是否开放列 -->
          <template #isOpen="{ row }">
            <LyTag
              tag-category-key="questionnaire_is_open"
              :dict-value="String(row.isOpen)"
            />
          </template>

          <!-- 操作列 -->
          <template #operation="{ row }">
            <div v-if="hasEditStatus(row)" class="flex w-full items-center">
              <Button type="primary" size="small" @click="saveRowEvent(row)">
                保存
              </Button>
              <Button type="text" size="small" @click="cancelRowEvent(row)">
                取消
              </Button>
              <Button type="link" size="small" danger @click="onDelete(row)">
                删除
              </Button>
            </div>
            <div v-else class="flex w-full items-center">
              <Button
                v-if="row.status !== 1"
                type="link"
                size="small"
                @click="onPublish(row)"
              >
                发布
              </Button>
              <Button
                v-else-if="row.status === 1"
                type="link"
                size="small"
                @click="onPause(row)"
              >
                暂停
              </Button>
              <Button type="link" size="small" danger @click="onDelete(row)">
                删除
              </Button>
            </div>
          </template>
        </Grid>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.vxe-pager .vxe-pager--sizes {
  margin-right: 0 !important;
}

:deep(.vxe-pager) {
  background: transparent !important;
}

// .vxe-grid {
//   padding: 0 !important;
// }
</style>
