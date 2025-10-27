<script setup lang="ts">
import type { AssessmentScenario, AssessmentScenarioSlot } from '@vben/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteModuleResultConfig,
  listModuleResultConfigsBySlotId,
} from '#/api/psychology/module-result-config';
import ModuleResultConfigForm from '#/components/Dialog/ScenarioDialog/module-result/ModuleResultConfigForm.vue';

// no emits

const selectedScenario = ref<AssessmentScenario | null>(null);
const selectedSlot = ref<AssessmentScenarioSlot | null>(null);

// 主弹窗
const [ConfigDialog, configDialogApi] = useVbenModal({
  title: '模块结果配置',
  class: 'w-[75%]',
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = configDialogApi.getData<{
        scenario: AssessmentScenario;
        scenarioSlot: AssessmentScenarioSlot;
      }>();
      if (data) {
        selectedScenario.value = data.scenario || null;
        selectedSlot.value = data.scenarioSlot || null;
        setTimeout(() => {
          if (configGridApi && typeof configGridApi.query === 'function') {
            configGridApi.query();
          }
        }, 200);
      }
    }
  },
});

// 表单弹窗
const [FormDialog, formDialogApi] = useVbenModal({
  connectedComponent: ModuleResultConfigForm,
  destroyOnClose: true,
});

// 表格
const [ConfigGrid, configGridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '500px',
    columns: [
      { field: 'id', title: 'ID', width: 80 },
      { field: 'configName', title: '配置名称', minWidth: 160 },
      {
        field: 'ruleType',
        title: '规则类型',
        width: 120,
        slots: { default: 'ruleType' },
      },
      { field: 'level', title: '等级', width: 120 },
      {
        field: 'status',
        title: '状态',
        width: 100,
        slots: { default: 'status' },
      },
      {
        field: 'updateTime',
        title: '更新时间',
        width: 180,
        formatter: 'formatDateTime',
      },
      {
        field: 'action',
        title: '操作',
        width: 160,
        fixed: 'right',
        slots: { default: 'action' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!selectedSlot.value?.id) return { list: [], total: 0 };
          const res = await listModuleResultConfigsBySlotId(
            Number(selectedSlot.value.id),
          );
          const list = Array.isArray(res) ? res : [];
          return { list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      refresh: false,
      search: false,
      zoom: false,
      custom: false,
    },
  },
});

function handleAdd() {
  formDialogApi
    .setData({
      scenario: selectedScenario.value,
      scenarioSlot: selectedSlot.value,
      onSuccess: () => configGridApi.query?.(),
    })
    .open();
}

function handleEdit(row: any) {
  formDialogApi
    .setData({
      scenario: selectedScenario.value,
      scenarioSlot: selectedSlot.value,
      selectedConfig: row,
      onSuccess: () => configGridApi.query?.(),
    })
    .open();
}

async function handleDelete(row: any) {
  await deleteModuleResultConfig(row.id);
  configGridApi.query?.();
}
</script>

<template>
  <ConfigDialog>
    <div class="flex flex-col gap-4">
      <div class="flex justify-between">
        <div class="text-gray-600">
          槽位：{{ selectedSlot?.slotName || selectedSlot?.slotKey }}
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

      <ConfigGrid>
        <template #ruleType="{ row }">
          <Tag
            :color="
              row.ruleType === 0
                ? 'blue'
                : row.ruleType === 1
                  ? 'green'
                  : 'purple'
            "
          >
            {{
              row.ruleType === 0
                ? '等级规则'
                : row.ruleType === 1
                  ? '评语规则'
                  : '综合规则'
            }}
          </Tag>
        </template>
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
  </ConfigDialog>

  <!-- 表单弹窗 -->
  <FormDialog />
  <!-- 供外部引用 -->
  <slot></slot>
</template>
