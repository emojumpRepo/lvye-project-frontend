<script setup lang="ts">
import type { QuestionnaireVO } from '@vben/types';

import type { QuestionnaireConfigVO } from '#/api/psychology/questionnaire/index';

import { nextTick, onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Modal, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteQuestionnaireConfig,
  getQuestionnaireConfigList,
} from '#/api/psychology/questionnaire/index';
import ConfirmDialog from '#/components/Dialog/ConfirmDialog/index.vue';

import { useQuestionConfigGridColumns } from '../data';
import QuestionnaireConfigDetail from './QuestionnaireConfigDetail.vue';
import QuestionnaireConfigForm from './QuestionnaireConfigForm.vue';

interface Props {
  visible: boolean;
  questionnaire: null | QuestionnaireVO;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'refresh'): void;
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

const [ConfirmModal, confirmModalApi] = useVbenModal({
  connectedComponent: ConfirmDialog,
});

const isAbnormalOptions = [
  { label: '正常', value: 0 },
  { label: '异常', value: 1 },
];

// 配置弹窗相关
const configDialogVisible = ref(false);
const selectedConfig = ref<null | QuestionnaireConfigVO>(null);

// 详情弹窗相关
const detailDialogVisible = ref(false);
const selectedDetailConfig = ref<null | QuestionnaireConfigVO>(null);

// 使用vben表格
const [ConfigGrid, configGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useQuestionConfigGridColumns(),
    height: '400px',
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!props.questionnaire?.id) {
            return { list: [], total: 0 };
          }
          const result = await getQuestionnaireConfigList(
            props.questionnaire.id,
          );
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
  configDialogVisible.value = true;
}

// 查看详情
function handleViewDetail(row: QuestionnaireConfigVO) {
  selectedDetailConfig.value = row;
  detailDialogVisible.value = true;
}

// 编辑配置
function handleEdit(row: QuestionnaireConfigVO) {
  selectedConfig.value = row;
  configDialogVisible.value = true;
}

// 删除配置
async function handleDelete(row: QuestionnaireConfigVO) {
  selectedConfig.value = row;
  confirmModalApi
    .setData({
      title: `确定要删除评分配置 - ${row.dimensionName || ''}吗？此操作会影响线上问卷结果生成。`,
    })
    .open();
}

async function handleConfirmDelete() {
  try {
    await deleteQuestionnaireConfig(selectedConfig.value?.id as number);
    message.success('删除成功');
    configGridApi.query();
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

// 监听弹窗显示状态
function handleVisibleChange(visible: boolean) {
  emit('update:visible', visible);
  if (visible && props.questionnaire) {
    // 延迟执行查询，确保表格组件已初始化
    nextTick(() => {
      configGridApi.query?.();
    });
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.questionnaire) {
      // 延迟执行查询，确保表格组件已初始化
      nextTick(() => {
        configGridApi.query?.();
      });
    }
  },
);

onMounted(() => {
  if (props.visible && props.questionnaire) {
    // 延迟执行查询，确保表格组件已初始化
    nextTick(() => {
      configGridApi.query?.();
    });
  }
});
</script>

<template>
  <Modal
    :open="visible"
    :title="`评分配置 - ${questionnaire?.title || ''}`"
    width="1200px"
    :footer="null"
    @update:open="handleVisibleChange"
  >
    <div class="flex flex-col gap-4">
      <!-- 工具栏 -->
      <div class="flex justify-end">
        <TableAction
          :actions="[
            {
              label: '新增评分配置',
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
          <span>{{
            row.questionIndex === 'all'
              ? '全部题目'
              : row.questionIndex
                  .split(',')
                  .map((item: string) => {
                    return `第${item}题`;
                  })
                  .join('、')
          }}</span>
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

        <template #action="{ row }">
          <Button type="link" size="small" @click="handleViewDetail(row)">
            详情
          </Button>
          <Button type="link" size="small" @click="handleEdit(row)">
            编辑
          </Button>
          <Button
            type="link"
            dander
            size="small"
            danger
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </template>
      </ConfigGrid>
    </div>

    <!-- 配置表单 -->
    <QuestionnaireConfigForm
      v-model:open="configDialogVisible"
      :title="selectedConfig ? '编辑评分配置' : '新增评分配置'"
      :questionnaire-id="questionnaire?.id || 0"
      :question-count="questionnaire?.questionCount || 0"
      :selected-config="selectedConfig"
      @success="
        () => {
          configGridApi.query();
          emit('refresh');
        }
      "
      @cancel="handleCancel"
    />

    <!-- 详情弹窗 -->
    <QuestionnaireConfigDetail
      v-model:open="detailDialogVisible"
      :config="selectedDetailConfig"
    />

    <!-- 确认删除弹窗 -->
    <ConfirmModal @confirm="handleConfirmDelete" />
  </Modal>
</template>
