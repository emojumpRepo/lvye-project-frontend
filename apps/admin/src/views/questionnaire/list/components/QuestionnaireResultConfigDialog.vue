<script setup lang="ts">
import type { QuestionnaireVO } from '@vben/types';

import type {
  QuestionnaireDimensionVO,
  QuestionnaireResultConfigVO,
} from '#/api/psychology/questionnaire/index';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { QUESTIONNAIRE_CONFIG_CALCULATE_TYPE } from '#/api/constants';
import {
  deleteQuestionnaireResultConfig,
  getQuestionnaireResultConfigPage,
} from '#/api/psychology/questionnaire/index';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';

import { useResultConfigGridColumns } from '../data';
import { formatQuestionIndex } from '../utils/question-index';
import QuestionnaireResultConfigForm from './QuestionnaireResultConfigForm.vue';

interface Emits {
  (e: 'refresh'): void;
}

const emit = defineEmits<Emits>();

const [ConfirmModal, confirmModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

const selectedDimension = ref<null | QuestionnaireDimensionVO>(null);
const selectedQuestionnaire = ref<null | QuestionnaireVO>(null);

// 创建主弹窗
const [ConfigDialog, configDialogApi] = useVbenModal({
  title: '结果配置',
  class: 'w-[75%]',
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = configDialogApi.getData<{
        dimension: null | QuestionnaireDimensionVO;
        questionnaire: null | QuestionnaireVO;
      }>();
      if (data) {
        selectedDimension.value = data.dimension;
        selectedQuestionnaire.value = data.questionnaire;
        // 延迟执行查询，确保表格组件已初始化
        setTimeout(() => {
          if (configGridApi && typeof configGridApi.query === 'function') {
            configGridApi.query();
          }
        }, 200);
      }
    }
  },
});

const isAbnormalOptions = [
  { label: '正常', value: 0 },
  { label: '异常', value: 1 },
];

// 结果配置表单弹窗相关
const configDialogVisible = ref(false);
const selectedConfig = ref<null | QuestionnaireResultConfigVO>(null);

const [
  QuestionnaireResultConfigFormDialog,
  questionnaireResultConfigFormDialogApi,
] = useVbenModal({
  connectedComponent: QuestionnaireResultConfigForm,
  destroyOnClose: true,
});

// 使用vben表格
const [ConfigGrid, configGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useResultConfigGridColumns(),
    height: '500px',
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          if (!selectedDimension.value?.id) {
            return { list: [], total: 0 };
          }
          const result = await getQuestionnaireResultConfigPage({
            dimensionId: selectedDimension.value.id,
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

// 新增配置
function handleAdd() {
  selectedConfig.value = null;
  questionnaireResultConfigFormDialogApi
    .setData({
      dimension: selectedDimension.value,
      questionnaire: selectedQuestionnaire.value,
    })
    .open();
}

// 编辑配置
function handleEdit(row: QuestionnaireResultConfigVO) {
  selectedConfig.value = row;
  questionnaireResultConfigFormDialogApi
    .setData({
      dimension: selectedDimension.value,
      questionnaire: selectedQuestionnaire.value,
      selectedConfig: row,
    })
    .open();
}

// 删除配置
async function handleDelete(row: QuestionnaireResultConfigVO) {
  selectedConfig.value = row;
  confirmModalApi
    .setData({
      title: `确定要删除结果配置吗？此操作会影响线上问卷结果生成。`,
    })
    .open();
}

async function handleConfirmDelete() {
  try {
    await deleteQuestionnaireResultConfig(selectedConfig.value?.id as number);
    message.success('删除成功');
    if (configGridApi && typeof configGridApi.query === 'function') {
      configGridApi.query();
    }
    emit('refresh');
  } catch {
    message.error('删除失败');
  } finally {
    confirmModalApi.close();
  }
}

// 取消表单
function handleCancel() {
  configDialogVisible.value = false;
  selectedConfig.value = null;
}

function getCalculateTypeLabel(calculateType: number) {
  switch (calculateType) {
    case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.AGE_SEX_SCORE: {
      return '年龄性别与分数区间';
    }
    case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.MOST_CHOOSE: {
      return '最多选择';
    }
    case QUESTIONNAIRE_CONFIG_CALCULATE_TYPE.SCORE: {
      return '分数区间';
    }
    default: {
      return '未知类型';
    }
  }
}
</script>

<template>
  <ConfigDialog>
    <div class="flex flex-col gap-4">
      <!-- 工具栏 -->
      <div class="flex justify-between">
        <div class="text-gray-600">
          问卷：{{ selectedQuestionnaire?.title || '未知' }} / 维度：{{
            selectedDimension?.dimensionName || '未知'
          }}
        </div>
        <TableAction
          :actions="[
            {
              label: '新增结果配置',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleAdd,
            },
          ]"
        />
      </div>

      <!-- 配置列表 -->
      <ConfigGrid>
        <!-- 题目索引 -->
        <template #questionIndex="{ row }">
          <a-tooltip :title="formatQuestionIndex(row.questionIndex).fullText">
            <span>{{ formatQuestionIndex(row.questionIndex).text }}</span>
          </a-tooltip>
        </template>

        <!-- 计算类型 -->
        <template #calculateType="{ row }">
          <span>{{ getCalculateTypeLabel(row.calculateType) }}</span>
        </template>

        <!-- 是否异常 -->
        <template #isAbnormal="{ row }">
          <Tag :color="row.isAbnormal ? 'red' : 'green'">
            {{
              isAbnormalOptions.find((opt) => opt.value === row.isAbnormal)
                ?.label || '正常'
            }}
          </Tag>
        </template>

        <!-- 状态 -->
        <template #status="{ row }">
          <Tag :color="row.status === 1 ? 'green' : 'red'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </Tag>
        </template>

        <template #action="{ row }">
          <Button type="link" size="small" @click="handleEdit(row)">
            编辑
          </Button>
          <Button type="link" size="small" danger @click="handleDelete(row)">
            删除
          </Button>
        </template>
      </ConfigGrid>
    </div>

    <!-- 配置表单 -->
    <QuestionnaireResultConfigFormDialog
      @success="
        () => {
          if (configGridApi && typeof configGridApi.query === 'function') {
            configGridApi.query();
          }
          emit('refresh');
        }
      "
      @cancel="handleCancel"
    />

    <!-- 确认删除弹窗 -->
    <ConfirmModal @confirm="handleConfirmDelete" />
  </ConfigDialog>
</template>
