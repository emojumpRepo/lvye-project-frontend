<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyScenarioApi } from '#/api/psychology/scenario';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Tag } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAssessmentScenario,
  getAssessmentScenario,
  getAssessmentScenarioPage,
  getAssessmentScenarioSlots,
} from '#/api/psychology/scenario';
import ScenarioDetailDialog from '#/components/Dialog/ScenarioDialog/ScenarioDetailDialog.vue';
import ScenarioFormDialog from '#/components/Dialog/ScenarioDialog/ScenarioFormDialog.vue';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

import { useScenarioGridSchema } from './data';

defineOptions({ name: 'AssessmentScenarioList' });

// ============== 数据状态 ==============
const loading = ref(false);

// ============== 弹窗管理 ==============
// 创建/编辑弹窗
const [CreateModal, createModalApi] = useVbenModal({
  connectedComponent: ScenarioFormDialog,
});

// 详情弹窗（当前未使用 API，仅挂载组件）
const [DetailModal] = useVbenModal({
  connectedComponent: ScenarioDetailDialog,
});

// ============== 表格配置 ==============
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '700px',
    rowConfig: { keyField: 'id' },
    pagerConfig: {
      align: 'right',
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
    },
    columns: useScenarioGridSchema(),
    toolbarConfig: { refresh: false, search: true, custom: false, zoom: false },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAssessmentScenarioPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
  } as VxeTableGridOptions<PsychologyScenarioApi.AssessmentScenario>,
});

// ============== 事件处理 ==============
// 新增场景
function handleAdd() {
  createModalApi.setData({ isEdit: false }).open();
}

// 编辑场景
async function handleEdit(row: PsychologyScenarioApi.AssessmentScenario) {
  // 预取详情与槽位，避免表单打开后槽位为空
  try {
    loading.value = true;
    const [detailRes, slots] = await Promise.all([
      getAssessmentScenario(row.id!),
      getAssessmentScenarioSlots(row.id!),
    ]);
    const detail = {
      ...detailRes,
      slots,
    } as any;
    createModalApi.setData({ isEdit: true, record: detail }).open();
  } catch {
    // 退化为直接打开，表单内有兜底加载
    createModalApi.setData({ isEdit: true, record: row }).open();
  } finally {
    loading.value = false;
  }
}

// 查看详情（如需启用请在操作列解注释触发）

// 删除场景
async function handleDelete(row: PsychologyScenarioApi.AssessmentScenario) {
  try {
    loading.value = true;
    await deleteAssessmentScenario(row.id!);
    message.success('删除成功');
    await gridApi.query();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败，请重试');
  } finally {
    loading.value = false;
  }
}

// 刷新数据
function handleRefresh() {
  gridApi.query();
}

// 组件挂载时加载数据
onMounted(() => {
  gridApi.query();
});
</script>

<template>
  <div class="flex h-full flex-col p-6">
    <!-- 数据表格 -->
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div class="box-border rounded-xl bg-white p-6">
        <LyCardTitle
          icon="lucide:list-check"
          title="测评场景"
          :hide-line="true"
          icon-bg="linear-gradient(143.39deg, #B6CDFF 11.39%, #DB88FF 89.3%)"
        >
          <template #right>
            <div class="flex items-center justify-end">
              <Button type="primary" @click="handleAdd">创建场景</Button>
            </div>
          </template>
        </LyCardTitle>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden">
        <Grid>
          <!-- 最大问卷数 -->
          <template #maxQuestionnaireCount="{ row }">
            <span>{{ row.maxQuestionnaireCount || '不限' }}</span>
          </template>

          <!-- 启用状态 -->
          <template #isActive="{ row }">
            <Tag :color="row.isActive ? 'success' : 'default'">
              {{ row.isActive ? '启用' : '禁用' }}
            </Tag>
          </template>

          <!-- 操作按钮 -->
          <template #actions="{ row }">
            <TableAction
              :actions="[
                // {
                //   label: '详情',
                //   type: 'link',
                //   onClick: () => handleDetail(row),
                // },
                {
                  label: '编辑',
                  type: 'link',
                  onClick: () => handleEdit(row),
                },
                {
                  label: '删除',
                  type: 'link',
                  danger: true,
                  popConfirm: {
                    title: '确认删除该场景？',
                    confirm: () => handleDelete(row),
                  },
                },
              ]"
            />
          </template>
        </Grid>
      </div>

      <!-- 弹窗组件 -->
      <CreateModal @success="handleRefresh" />
      <DetailModal />
    </div>
  </div>
</template>

<style scoped></style>
