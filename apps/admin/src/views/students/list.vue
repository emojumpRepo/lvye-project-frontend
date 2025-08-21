<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { onMounted, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  message,
  Radio,
} from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteStudentProfile,
  getStudentProfilePage,
} from '#/api/psychology/student-profile';
import DeleteStudentDialog from '#/components/Dialog/DeleteStudentDialog/index.vue';
import CreateStudentDrawer from '#/components/Drawer/CreateStudentDrawer/index.vue';
import GradeGraduationDrawer from '#/components/Drawer/GradeGraduationDrawer/index.vue';
import GraduatedStudentFileDrawer from '#/components/Drawer/GraduatedStudentFileDrawer/index.vue';
import StudentBulkClassTransferDrawer from '#/components/Drawer/StudentBulkClassTransferDrawer/index.vue';
import StudentBulkImportDrawer from '#/components/Drawer/StudentBulkImportDrawer/index.vue';
import StudentDrawer from '#/components/Drawer/StudentDrawer/index.vue';

import StudentSearch from './components/StudentSearch.vue';

defineOptions({ name: 'StudentArchive' });

// 数据状态
const loading = ref(false);
const graduationDrawerOpen = ref<boolean>(false);

// 抽屉
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: StudentDrawer,
});

const [CreateDrawer, createDrawerApi] = useVbenDrawer({
  connectedComponent: CreateStudentDrawer,
});

const [BulkClassTransferDrawer, bulkClassTransferDrawerApi] = useVbenDrawer({
  connectedComponent: StudentBulkClassTransferDrawer,
});

const [BulkImportDrawer, bulkImportDrawerApi] = useVbenDrawer({
  connectedComponent: StudentBulkImportDrawer,
});

const [DeleteStudentModal, deleteStudentModalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: DeleteStudentDialog,
  onConfirm: async () => {
    const data = deleteStudentModalApi.getData();
    await deleteStudentProfile(data.id);
    message.success('删除成功');
    gridApi.query();
    deleteStudentModalApi.close();
  },
});

const [GraduatedFileDrawer, graduatedFileDrawerApi] = useVbenDrawer({
  connectedComponent: GraduatedStudentFileDrawer,
});

// 视图模式与选择
const viewMode = ref<'group' | 'list'>('list');
const selectedRowKeys = ref<number[]>([]);
// const confirmDialogVisible = ref(false);

// Grid 定义
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '600px',
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true },
    pagerConfig: {
      align: 'right',
      pageSize: 100,
      pageSizes: [10, 20, 50, 100],
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
    },
    columns: [
      { type: 'checkbox', width: 48 },
      { field: 'studentNo', title: '学号', width: 120 },
      { field: 'name', title: '姓名', minWidth: 140, showOverflow: 'tooltip' },
      {
        field: 'className',
        title: '班级',
        minWidth: 120,
        showOverflow: 'tooltip',
      },
      { field: 'sex', title: '性别', width: 80, slots: { default: 'sex' } },
      { field: 'gradeName', title: '年级', width: 100 },
      { field: 'mobile', title: '联系电话', width: 140 },
      {
        field: 'psychologicalStatus',
        title: '心理状态',
        width: 100,
        slots: { default: 'psychologicalStatus' },
      },
      {
        field: 'graduationStatus',
        title: '毕业状态',
        width: 100,
        slots: { default: 'graduationStatus' },
      },
      {
        field: 'actions',
        title: '操作',
        width: 140,
        fixed: 'right',
        align: 'center',
        slots: { default: 'actions' },
      },
    ],
    toolbarConfig: { refresh: false, search: true, custom: false, zoom: false },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getStudentProfilePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    onCheckboxChange: ({
      records,
    }: {
      records: PsychologyStudentProfileApi.StudentProfile[];
    }) => {
      selectedRowKeys.value = (records || [])
        .map((r: any) => r.id)
        .filter((v: any) => v != null);
    },
    onCheckboxAll: ({
      records,
    }: {
      records: PsychologyStudentProfileApi.StudentProfile[];
    }) => {
      selectedRowKeys.value = (records || [])
        .map((r: any) => r.id)
        .filter((v: any) => v != null);
    },
  } as VxeTableGridOptions<PsychologyStudentProfileApi.StudentProfile>,
});

// 加载学生列表数据交由 Grid 代理

// 处理搜索
function handleSearch(
  params: PsychologyStudentProfileApi.StudentProfilePageReq,
) {
  gridApi.query({ ...params, pageNo: 1 });
}

// 处理分页变化由 Grid 管理

// 详情抽屉打开在后续行事件中接入

function openDeleteStudentModal(id: number, studentNo: string, name: string) {
  deleteStudentModalApi.setData({ id, studentNo, name }).open();
}

// 批量删除
async function handleBulkDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的学生');
    return;
  }
  try {
    loading.value = true;
    await Promise.all(
      selectedRowKeys.value.map((id) => deleteStudentProfile(id)),
    );
    message.success('批量删除成功');
    selectedRowKeys.value = [];
    await gridApi.query();
  } catch (error) {
    console.error('批量删除失败:', error);
    message.error('批量删除失败，请重试');
  } finally {
    loading.value = false;
  }
}

// 处理加载状态
function handleLoading(isLoading: boolean) {
  loading.value = isLoading;
}

// 新增学生
function handleAdd() {
  createDrawerApi.open();
}

// 批量导入
function handleImport() {
  bulkImportDrawerApi.open();
}

// 批量换班
function handleBulkChangeClass() {
  bulkClassTransferDrawerApi.open();
}

// 已毕业学生档案
function handleGraduatedStudentFile() {
  graduatedFileDrawerApi.open();
}

// 年级毕业
function handleGraduated() {
  // graduationDrawerApi.open();
  graduationDrawerOpen.value = true;
}

// 导出数据
function handleExport() {
  console.log('导出数据');
  // TODO: 实现导出功能
  message.info('导出功能待实现');
}

function refresh() {
  gridApi.query();
}

// 组件挂载时加载数据
onMounted(() => {
  gridApi.query();
});
</script>

<template>
  <div class="flex h-full flex-col p-6">
    <!-- 搜索组件 -->
    <StudentSearch @search="handleSearch" @loading="handleLoading" />

    <!-- 数据表格 -->
    <div class="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button @click="handleGraduatedStudentFile">已毕业学生档案</Button>
          <Dropdown>
            <template #overlay>
              <Menu>
                <MenuItem key="1" @click="handleGraduated">年级毕业</MenuItem>
                <MenuItem key="2" @click="handleExport">导出数据</MenuItem>
                <MenuItem key="3" @click="handleImport">批量导入</MenuItem>
              </Menu>
            </template>
            <Button>
              <div class="flex items-center">
                <span class="mr-1">更多操作</span>
                <IconifyIcon icon="lucide:chevron-right" />
              </div>
            </Button>
          </Dropdown>
          <Button type="primary" @click="handleAdd">创建学生</Button>
          <Button
            danger
            @click="handleBulkDelete"
            v-show="selectedRowKeys.length > 0"
            :disabled="selectedRowKeys.length === 0"
          >
            批量删除
          </Button>
          <Button
            v-show="selectedRowKeys.length > 0"
            :disabled="selectedRowKeys.length === 0"
            @click="handleBulkChangeClass"
          >
            批量换班
          </Button>
        </div>
        <Radio.Group v-model:value="viewMode">
          <Radio.Button value="list">列表视图</Radio.Button>
          <Radio.Button value="group">分组视图</Radio.Button>
        </Radio.Group>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden">
        <Grid>
          <template #sex="{ row }">
            <span>{{
              row.sex === 1 ? '男' : row.sex === 2 ? '女' : '未知'
            }}</span>
          </template>
          <template #psychologicalStatus="{ row }">
            <span>{{
              row.psychologicalStatus === 1
                ? '良好'
                : row.psychologicalStatus === 2
                  ? '较差'
                  : '一般'
            }}</span>
          </template>
          <template #graduationStatus="{ row }">
            <span>{{ row.graduationStatus === 1 ? '已毕业' : '未毕业' }}</span>
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: '查看详情',
                  type: 'link',
                  onClick: () => drawerApi.open(),
                },
                {
                  label: '删除',
                  type: 'link',
                  danger: true,
                  onClick: () =>
                    openDeleteStudentModal(
                      row.id as number,
                      row.studentNo,
                      row.name,
                    ),
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <Drawer />
    <CreateDrawer @refresh="refresh" />
    <BulkClassTransferDrawer />
    <BulkImportDrawer />
    <DeleteStudentModal />
    <GraduatedFileDrawer />
    <GradeGraduationDrawer v-model:open="graduationDrawerOpen" />
  </div>
</template>
<style lang="scss">
.vxe-pager .vxe-pager--sizes {
  margin-right: 0 !important;
}

:deep(.vxe-pager) {
  background: transparent !important;
}

.vxe-grid {
  padding: 0 !important;
}
</style>
