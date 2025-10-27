<script setup lang="ts">
import type { QuestionnaireVO } from '@vben/types';

import type { QuestionnaireDimensionVO } from '#/api/psychology/questionnaire/index';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteQuestionnaireDimension,
  getQuestionnaireDimensionPage,
} from '#/api/psychology/questionnaire/index';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';

import { useDimensionGridColumns } from '../data';
import QuestionnaireDimensionForm from './QuestionnaireDimensionForm.vue';
import QuestionnaireResultConfigDialog from './QuestionnaireResultConfigDialog.vue';

interface Emits {
  (e: 'refresh'): void;
}

const emit = defineEmits<Emits>();

const [ConfirmModal, confirmModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

// 维度表单弹窗相关
const selectedDimension = ref<null | QuestionnaireDimensionVO>(null);
const selectedQuestionnaire = ref<null | QuestionnaireVO>(null);
const selectedDimensionForConfig = ref<null | QuestionnaireDimensionVO>(null);

const [DimensionDialog, dimensionDialogApi] = useVbenModal({
  title: '维度配置',
  class: 'w-[80%] h-[80%]',
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      selectedQuestionnaire.value = dimensionDialogApi.getData().questionnaire;
      // 延迟执行查询，确保表格组件已初始化
      setTimeout(() => {
        if (dimensionGridApi && typeof dimensionGridApi.query === 'function') {
          dimensionGridApi.query();
        }
      }, 200); // 增加延迟时间以确保表格完全初始化
    }
  },
});

const [DimensionFormDialog, dimensionFormDialogApi] = useVbenModal({
  connectedComponent: QuestionnaireDimensionForm,
  destroyOnClose: true,
});

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

// 结果配置弹窗相关
const [ResultConfigDialog, resultConfigDialogApi] = useVbenModal({
  connectedComponent: QuestionnaireResultConfigDialog,
  destroyOnClose: true,
});

// 使用vben表格
const [DimensionGrid, dimensionGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDimensionGridColumns(),
    height: '600px',
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          if (!selectedQuestionnaire.value?.id) {
            return { list: [], total: 0 };
          }
          const result = await getQuestionnaireDimensionPage({
            questionnaireId: selectedQuestionnaire.value.id,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });
          return {
            list: result?.list || [],
            total: result?.total || 0,
          };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: false,
      search: false,
      zoom: false,
      custom: false,
    },
  },
});

// 新增维度
function handleAddDimension() {
  selectedDimension.value = null;
  dimensionFormDialogApi
    .setData({
      questionnaireId: selectedQuestionnaire.value?.id || 0,
    })
    .open();
}

// 编辑维度
function handleEditDimension(row: QuestionnaireDimensionVO) {
  selectedDimension.value = row;
  dimensionFormDialogApi
    .setData({
      questionnaireId: selectedQuestionnaire.value?.id || 0,
      selectedDimension: row,
    })
    .open();
}

// 管理结果配置
function handleManageConfig(row: QuestionnaireDimensionVO) {
  selectedDimensionForConfig.value = row;
  resultConfigDialogApi
    .setData({
      dimension: row,
      questionnaire: selectedQuestionnaire.value,
    })
    .open();
}

// 删除维度
async function handleDeleteDimension(row: QuestionnaireDimensionVO) {
  selectedDimension.value = row;
  confirmModalApi
    .setData({
      title: `确定要删除维度 - ${row.dimensionName || ''}吗？此操作会删除该维度下的所有配置。`,
    })
    .open();
}

async function handleConfirmDeleteDimension() {
  try {
    await deleteQuestionnaireDimension(selectedDimension.value?.id as number);
    message.success('删除成功');
    if (dimensionGridApi && typeof dimensionGridApi.query === 'function') {
      dimensionGridApi.query();
    }
    emit('refresh');
  } catch {
    message.error('删除失败');
  } finally {
    confirmModalApi.close();
  }
}

// 取消维度表单
function handleCancelDimension() {
  dimensionFormDialogApi.close();
  selectedDimension.value = null;
}

function handleRefresh() {
  if (dimensionGridApi && typeof dimensionGridApi.query === 'function') {
    dimensionGridApi.query();
  }
  emit('refresh');
}
</script>

<template>
  <DimensionDialog>
    <div class="flex h-full flex-col gap-4">
      <!-- 工具栏 -->
      <div class="flex justify-end">
        <TableAction
          :actions="[
            {
              label: '新增维度',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleAddDimension,
            },
          ]"
        />
      </div>

      <!-- 维度列表 -->
      <DimensionGrid>
        <!-- 状态 -->
        <template #status="{ row }">
          <Tag :color="row.status === 1 ? 'green' : 'red'">
            {{
              statusOptions.find((opt) => opt.value === row.status)?.label ||
              '未知'
            }}
          </Tag>
        </template>

        <!-- 参与模块计算 -->
        <template #participateModuleCalc="{ row }">
          <Tag :color="row.participateModuleCalc ? 'blue' : 'default'">
            {{ row.participateModuleCalc ? '是' : '否' }}
          </Tag>
        </template>

        <!-- 参与测评计算 -->
        <template #participateAssessmentCalc="{ row }">
          <Tag :color="row.participateAssessmentCalc ? 'blue' : 'default'">
            {{ row.participateAssessmentCalc ? '是' : '否' }}
          </Tag>
        </template>

        <!-- 参与排行 -->
        <template #participateRanking="{ row }">
          <Tag :color="row.participateRanking ? 'blue' : 'default'">
            {{ row.participateRanking ? '是' : '否' }}
          </Tag>
        </template>

        <template #action="{ row }">
          <Button type="link" size="small" @click="handleManageConfig(row)">
            结果配置
          </Button>
          <Button type="link" size="small" @click="handleEditDimension(row)">
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            @click="handleDeleteDimension(row)"
          >
            删除
          </Button>
        </template>
      </DimensionGrid>
    </div>

    <!-- 维度表单 -->
    <DimensionFormDialog
      @success="handleRefresh"
      @cancel="handleCancelDimension"
    />

    <!-- 结果配置弹窗 -->
    <ResultConfigDialog @refresh="handleRefresh" />

    <!-- 确认删除弹窗 -->
    <ConfirmModal @confirm="handleConfirmDeleteDimension" />
  </DimensionDialog>
</template>
