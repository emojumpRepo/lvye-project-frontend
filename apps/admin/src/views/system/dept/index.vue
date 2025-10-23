<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDept, deleteDeptList, getDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';
import { loadDeptList } from '#/utils/transformDeptToTree';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const userList = ref<SystemUserApi.User[]>([]);
const checkedIds = ref<number[]>([]);

/** 获取负责人名称 */
function getLeaderName(userIds: number[]) {
  if (!userIds || userIds.length === 0) {
    return undefined;
  }
  return userIds
    .map(
      (userId) => userList.value.find((user) => user.id === userId)?.nickname,
    )
    .filter(Boolean)
    .join('、');
}

/** 刷新表格 */
async function onRefresh() {
  await loadDeptList();
  gridApi.query();
}

/** 切换树形展开/收缩状态 */
const isExpanded = ref(true);

/** 切换树形展开/收缩状态 */
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  gridApi.grid.setAllTreeExpand(isExpanded.value);
}

/** 创建部门 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 计算部门层级深度 - 通过在树形结构中查找位置来确定层级 */
function getDeptLevel(
  dept: SystemDeptApi.Dept,
  allDepts: SystemDeptApi.Dept[],
): number {
  // 处理边界情况
  if (!allDepts || allDepts.length === 0) return 0;

  // 递归查找函数
  function findDeptInLevel(
    depts: SystemDeptApi.Dept[],
    targetId: number,
    currentLevel: number,
  ): number {
    for (const item of depts) {
      // 如果在当前层找到了目标部门
      if (item.id === targetId) {
        return currentLevel;
      }
      // 如果当前部门有子级，继续在子级中查找
      if (item.children && item.children.length > 0) {
        const foundLevel = findDeptInLevel(
          item.children,
          targetId,
          currentLevel + 1,
        );
        if (foundLevel > 0) {
          return foundLevel;
        }
      }
    }
    return 0; // 未找到
  }

  // 从第一层开始查找
  return findDeptInLevel(allDepts, dept.id as number, 1);
}

/** 添加下级部门 */
function handleAppend(row: SystemDeptApi.Dept) {
  // 获取当前所有部门数据
  const allDepts = gridApi.grid.getTableData().fullData as SystemDeptApi.Dept[];

  // 计算当前部门的层级
  const currentLevel = getDeptLevel(row, allDepts);

  // 检查是否已经是第三级
  if (currentLevel >= 3) {
    message.warning('最多只能创建三级部门！');
    return;
  }

  formModalApi.setData({ parentId: row.id }).open();
}

/** 编辑部门 */
function handleEdit(row: SystemDeptApi.Dept) {
  formModalApi.setData(row).open();
}

/** 删除部门 */
async function handleDelete(row: SystemDeptApi.Dept) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteDept(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    await onRefresh();
  } finally {
    hideLoading();
  }
}

/** 选中行变更 */
function handleRowCheckboxChange({
  records,
}: {
  records: SystemDeptApi.Dept[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 批量删除部门 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDeptList(checkedIds.value);
    message.success($t('ui.actionMessage.deleteSuccess'));
    await onRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async () => {
          return await getDeptList();
        },
      },
    },
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    treeConfig: {
      transform: true,
      rowField: 'id',
      parentField: 'parentId',
      expandAll: true,
      accordion: false,
    },
  } as VxeTableGridOptions<SystemDeptApi.Dept>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 初始化 */
onMounted(async () => {
  userList.value = await getSimpleUserList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="部门列表">
      <!-- 工具栏 -->
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['部门']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:dept:create'],
              onClick: handleCreate,
            },
            {
              label: isExpanded ? '收缩' : '展开',
              type: 'primary',
              onClick: toggleExpand,
            },
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              disabled: isEmpty(checkedIds),
              icon: ACTION_ICON.DELETE,
              auth: ['system:dept:delete'],
              onClick: handleDeleteBatch,
            },
          ]"
        />
      </template>

      <!-- 负责人列 -->
      <template #leaderUserIds="{ row }">
        <span>{{ getLeaderName(row.leaderUserIds) }}</span>
      </template>

      <!-- 操作列 -->
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '新增下级',
              type: 'link',
              icon: ACTION_ICON.ADD,
              auth: ['system:dept:create'],
              onClick: handleAppend.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['system:dept:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:dept:delete'],
              disabled: !!(row.children && row.children.length > 0),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
