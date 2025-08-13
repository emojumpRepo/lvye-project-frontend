<script lang="ts" setup>
import { ref, onMounted } from 'vue';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenDrawer, Page } from '@vben/common-ui';
import { message, Button, Radio } from 'ant-design-vue';
import { useVbenVxeGrid, TableAction } from '#/adapter/vxe-table';

import StudentDrawer from '#/components/Drawer/StudentDrawer/index.vue';
import StudentSearch from './components/StudentSearch.vue';
import {
  getStudentProfilePage,
  deleteStudentProfile,
  type PsychologyStudentProfileApi
} from '#/api/psychology/student-profile';

defineOptions({ name: 'StudentArchive' });

// 数据状态
const loading = ref(false);
// 由 Grid 接管数据源
// 由 Grid 自带分页接管

// 抽屉
const [Drawer, drawerApi] = useVbenDrawer({ connectedComponent: StudentDrawer });

// 视图模式与选择
const viewMode = ref<'list' | 'group'>('list');
const selectedRowKeys = ref<number[]>([]);

// Grid 定义
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: 'auto',
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
      { field: 'className', title: '班级', minWidth: 120, showOverflow: 'tooltip' },
      { field: 'sex', title: '性别', width: 80, slots: { default: 'sex' } },
      { field: 'gradeName', title: '年级', width: 100 },
      { field: 'mobile', title: '联系电话', width: 140 },
      { field: 'psychologicalStatus', title: '心理状态', width: 100, slots: { default: 'psychologicalStatus' } },
      { field: 'graduationStatus', title: '毕业状态', width: 100, slots: { default: 'graduationStatus' } },
      { field: 'actions', title: '操作', width: 140, fixed: 'right', align: 'center', slots: { default: 'actions' } },
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
    onCheckboxChange: ({ records }: { records: PsychologyStudentProfileApi.StudentProfile[] }) => {
      selectedRowKeys.value = (records || []).map((r: any) => r.id).filter((v: any) => v != null);
    },
    onCheckboxAll: ({ records }: { records: PsychologyStudentProfileApi.StudentProfile[] }) => {
      selectedRowKeys.value = (records || []).map((r: any) => r.id).filter((v: any) => v != null);
    },
  } as VxeTableGridOptions<PsychologyStudentProfileApi.StudentProfile>,
});

// 加载学生列表数据交由 Grid 代理

// 处理搜索
function handleSearch(params: PsychologyStudentProfileApi.StudentProfilePageReq) {
  gridApi.query({ ...params, pageNo: 1 });
}

// 处理分页变化由 Grid 管理

// 详情抽屉打开在后续行事件中接入

// 批量删除
async function handleBulkDelete() {
  if (!selectedRowKeys.value.length) {
    message.warning('请先选择要删除的学生');
    return;
  }
  try {
    loading.value = true;
    await Promise.all(selectedRowKeys.value.map((id) => deleteStudentProfile(id)));
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
  console.log('新增学生');
  // TODO: 实现新增功能
  message.info('新增功能待实现');
}

// 批量导入
function handleImport() {
  console.log('批量导入');
  // TODO: 实现导入功能
  message.info('导入功能待实现');
}

// 导出数据
function handleExport() {
  console.log('导出数据');
  // TODO: 实现导出功能
  message.info('导出功能待实现');
}

// 组件挂载时加载数据
onMounted(() => {
  gridApi.query();
});
</script>

<template>
  <Page auto-content-height>
  <div class="flex h-full flex-col p-4">
    <!-- 搜索组件 -->
    <StudentSearch
      @search="handleSearch"
      @loading="handleLoading"
    />

    <!-- 数据表格 -->
    <div class="mt-4 flex flex-1 min-h-0 flex-col overflow-hidden">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button danger @click="handleBulkDelete" :disabled="!selectedRowKeys.length">批量删除</Button>
          <Button @click="handleImport">批量导入</Button>
          <Button @click="handleExport">导出数据</Button>
          <Button type="primary" @click="handleAdd">创建学生</Button>
        </div>
        <Radio.Group v-model:value="viewMode">
          <Radio.Button value="list">列表视图</Radio.Button>
          <Radio.Button value="group">分组视图</Radio.Button>
        </Radio.Group>
      </div>

      <div class="flex-1 min-h-0 overflow-hidden">
      <Grid>
        <template #sex="{ row }">
          <span>{{ row.sex === 1 ? '男' : row.sex === 2 ? '女' : '未知' }}</span>
        </template>
        <template #psychologicalStatus="{ row }">
          <span>{{ row.psychologicalStatus === 1 ? '良好' : row.psychologicalStatus === 2 ? '较差' : '一般' }}</span>
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
                popConfirm: {
                  title: `确定删除学生 “${row.name}” 吗？`,
                  confirm: async () => {
                    await deleteStudentProfile(row.id as number);
                    message.success('删除成功');
                    gridApi.query();
                  },
                },
              },
            ]"
          />
        </template>
      </Grid>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <Drawer />
  </div>
  </Page>
</template>
<style lang="scss">
.vxe-pager .vxe-pager--sizes {
  margin-right: 0 !important;
}
</style>