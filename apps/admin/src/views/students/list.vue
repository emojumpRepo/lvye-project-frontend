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
import BulkDeleteStudentDialog from '#/components/Dialog/BulkDeleteStudentDialog/index.vue';
import DeleteStudentDialog from '#/components/Dialog/DeleteStudentDialog/index.vue';
import CreateStudentDrawer from '#/components/Drawer/CreateStudentDrawer/index.vue';
import GraduatedStudentProfileDrawer from '#/components/Drawer/GraduatedStudentProfileDrawer/index.vue';
import StudentBulkClassTransferDrawer from '#/components/Drawer/StudentBulkClassTransferDrawer/index.vue';
import StudentBulkImportDrawer from '#/components/Drawer/StudentBulkImportDrawer/index.vue';
import StudentDrawer from '#/components/Drawer/StudentDrawer/index.vue';
import StudentGradeGraduationDrawer from '#/components/Drawer/StudentGradeGraduationDrawer/index.vue';
import LyTag from '#/components/LyTag/index.vue';
import { getDictLabel } from '#/utils/dict';
import { exportStudentsToExcel } from '#/utils/export';
import {
  formatDeptListToTree,
  getDeptListCache,
  getDeptTreeList,
} from '#/utils/transformDeptToTree';

import StudentSearch from './components/StudentSearch.vue';
import {
  useStudentProfileGridSchema,
  useStudentProfileGroupGridSchema,
} from './data';

defineOptions({ name: 'StudentArchive' });

// ============== 数据状态 ==============
const loading = ref(false);
const graduationDrawerOpen = ref<boolean>(false);
const deptListLoaded = ref(false);
const studentSearchRef = ref();

// ============== 抽屉 ==============
// 详情抽屉
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: StudentDrawer,
});

// 新增学生抽屉
const [CreateDrawer, createDrawerApi] = useVbenDrawer({
  connectedComponent: CreateStudentDrawer,
});

// 批量换班抽屉
const [BulkClassTransferDrawer, bulkClassTransferDrawerApi] = useVbenDrawer({
  connectedComponent: StudentBulkClassTransferDrawer,
});

// 批量导入抽屉
const [BulkImportDrawer, bulkImportDrawerApi] = useVbenDrawer({
  connectedComponent: StudentBulkImportDrawer,
});

// 删除学生确认框
const [DeleteStudentModal, deleteStudentModalApi] = useVbenModal({
  connectedComponent: DeleteStudentDialog,
  onConfirm: async () => {
    const data = deleteStudentModalApi.getData();
    const result = await deleteStudentProfile(data.id);
    if (result) {
      message.success('删除成功');
      gridApi.query();
      deleteStudentModalApi.close();
    } else {
      message.error('删除失败');
    }
  },
});

// 批量删除学生确认框
const [BulkDeleteStudentModal, bulkDeleteStudentModalApi] = useVbenModal({
  connectedComponent: BulkDeleteStudentDialog,
});

// 已毕业学生档案抽屉
const [GraduatedFileDrawer, graduatedFileDrawerApi] = useVbenDrawer({
  connectedComponent: GraduatedStudentProfileDrawer,
});

// ============== 视图模式与选择 ==============
const viewMode = ref<'group' | 'list'>('list');
const selectedRowKeys = ref<number[]>([]);

// Grid 定义
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '600px',
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true },
    pagerConfig: {
      align: 'right',
      layouts: ['Total', 'PrevPage', 'Number', 'NextPage', 'FullJump', 'Sizes'],
    },
    columns: useStudentProfileGridSchema(),
    toolbarConfig: { refresh: false, search: true, custom: false, zoom: false },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getStudentProfilePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...studentSearchRef.value?.searchParams,
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
        .filter((r: any) => !r.hasChildField)
        .map((r: any) => r.id)
        .filter((v: any) => v !== null);
    },
    onCheckboxAll: ({
      records,
    }: {
      records: PsychologyStudentProfileApi.StudentProfile[];
    }) => {
      selectedRowKeys.value = (records || [])
        .filter((r: any) => !r.hasChildField)
        .map((r: any) => r.id)
        .filter((v: any) => v !== null);
    },
  } as VxeTableGridOptions<PsychologyStudentProfileApi.StudentProfile>,
});

// ============== 事件 ==============
// 处理搜索
async function handleSearch() {
  if (viewMode.value === 'group') return;
  gridApi.grid.setCurrentPage(1);
  await gridApi.query({ pageNo: 1 });
}

// 处理视图模式切换
function handleViewModeChange({ target }: { target: any }) {
  selectedRowKeys.value = [];
  gridApi.grid?.clearCheckboxRow();
  gridApi.grid.clearData();
  gridApi.grid.clearAll();
  if (target.value === 'group') {
    gridApi.setGridOptions({
      pagerConfig: { enabled: false },
      columns: useStudentProfileGroupGridSchema(),
      columnConfig: {
        resizable: true,
      },
      rowConfig: {
        resizable: true,
        isHover: false,
      },
      proxyConfig: {
        ajax: {
          query: async () => {
            return await getDeptTreeList();
          },
        },
      },
      treeConfig: {
        parentField: 'gradeDeptId',
        rowField: 'classDeptId',
        transform: true,
        accordion: false,
        lazy: true,
        hasChildField: 'hasChildField',
        trigger: 'row',
        loadMethod: async ({ row }: any) => {
          return await formatDeptListToTree(row.classDeptId, row.children);
        },
      },
      showHeader: false,
      cellConfig: {
        height: 60,
      },
    });
  } else {
    gridApi.setGridOptions({
      pagerConfig: { enabled: true },
      columns: useStudentProfileGridSchema(),
      rowConfig: {
        isHover: false,
      },
      proxyConfig: {
        ajax: {
          query: async ({ page }: any, formValues: any) => {
            return await getStudentProfilePage({
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              ...studentSearchRef.value?.searchParams,
              ...formValues,
            });
          },
        },
      },
      showHeader: true,
      cellConfig: {
        height: 40,
      },
    });
  }
  gridApi.reload();
}

// 打开删除学生对话框
function openDeleteStudentModal(id: number, studentNo: string, name: string) {
  deleteStudentModalApi.setData({ id, studentNo, name }).open();
}

// 批量删除弹窗
async function handleBulkDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的学生');
    return;
  }

  const selectedStudents = await gridApi.grid.getCheckboxRecords();
  const filteredStudents = selectedStudents.filter(
    (student: any) => !student.hasChildField && student.id !== null,
  );
  bulkDeleteStudentModalApi
    .setData({
      selectedStudents: filteredStudents,
    })
    .open();
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
  message.warning('即将上线');
  //   const selectedStudents = gridApi.grid.getCheckboxRecords();
  //   bulkClassTransferDrawerApi.setData({ selectedStudents }).open();
}

// 已毕业学生档案
function handleGraduatedStudentFile() {
  message.warning('即将上线');
  // graduatedFileDrawerApi.open();
}

// 年级毕业
function handleGraduated() {
  message.warning('即将上线');
  // graduationDrawerOpen.value = true;
}

// 导出数据
async function handleExport() {
  try {
    loading.value = true;

    if (selectedRowKeys.value.length > 0) {
      // 导出选中的数据
      const selectedStudents = gridApi.grid.getCheckboxRecords();
      if (selectedStudents && selectedStudents.length > 0) {
        exportStudentsToExcel(selectedStudents);
      } else {
        message.warning('请先选择要导出的学生数据');
      }
    } else {
      // 导出全部数据
      const studentProfileList = gridApi.grid.getData();
      if (studentProfileList.length > 0) {
        exportStudentsToExcel(studentProfileList);
      } else {
        message.warning('没有数据可导出');
      }
    }
  } catch (error) {
    console.error(error);
    message.error('导出失败，请重试');
  } finally {
    loading.value = false;
  }
}

/** 刷新表格 */
function refresh() {
  gridApi.query();
}

// 组件挂载时加载数据
onMounted(async () => {
  await getDeptListCache();
  deptListLoaded.value = true;
});
</script>

<template>
  <div class="flex h-full flex-col p-6">
    <!-- 搜索组件 -->
    <StudentSearch
      ref="studentSearchRef"
      :dept-list-loaded="deptListLoaded"
      @search="handleSearch"
      @loading="handleLoading"
    />

    <!-- 数据表格 -->
    <div class="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- <Button @click="handleGraduatedStudentFile">已毕业学生档案</Button> -->
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
        <Radio.Group v-model:value="viewMode" @change="handleViewModeChange">
          <Radio.Button value="list">列表视图</Radio.Button>
          <Radio.Button value="group">分组视图</Radio.Button>
        </Radio.Group>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden">
        <template v-if="viewMode === 'list'">
          <Grid>
            <!-- 性别 -->
            <template #sex="{ row }">
              <span>
                {{ row.sex ? getDictLabel('system_user_sex', row.sex) : '--' }}
              </span>
            </template>

            <!-- 心理状态 -->
            <template #psychologicalStatus="{ row }">
              <LyTag
                v-if="row?.psychologicalStatus"
                tag-category-key="student_psychological_status"
                :dict-value="row?.psychologicalStatus"
              />
              <LyTag v-else />
            </template>

            <!-- 毕业状态 -->
            <template #graduationStatus="{ row }">
              <LyTag
                tag-category-key="student_graduation_status"
                :dict-value="String(row?.graduationStatus)"
              />
            </template>

            <!-- 联系电话 -->
            <template #mobile="{ row }">
              <span>{{ row?.mobile || '--' }}</span>
            </template>

            <!-- 操作 -->
            <template #actions="{ row }">
              <TableAction
                :actions="[
                  {
                    label: '查看详情',
                    type: 'link',
                    onClick: () => drawerApi.setData({ id: row.id }).open(),
                  },
                  // {
                  //   label: '删除',
                  //   type: 'link',
                  //   danger: true,
                  //   onClick: () =>
                  //     openDeleteStudentModal(
                  //       row.id as number,
                  //       row.studentNo,
                  //       row.name,
                  //     ),
                  // },
                ]"
              />
            </template>
          </Grid>
        </template>
        <template v-else>
          <Grid>
            <template #name="{ row }">
              <div class="my-2 flex flex-col gap-1">
                <span
                  :class="
                    row.studentNo
                      ? 'text-sm text-[#4C4C4D]'
                      : 'font-bold text-[#000000A6]'
                  "
                >
                  {{ row.name }}
                </span>
                <span v-if="row.studentNo" class="text-sm text-[#B0B1B2]">
                  {{ row.studentNo }}
                </span>
              </div>
            </template>

            <template #count="{ row }">
              <span v-if="row.count && row.count > 0">
                共{{ row.count }}人
              </span>
            </template>
          </Grid>
        </template>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <Drawer @refresh="refresh" />
    <CreateDrawer @refresh="refresh" />
    <BulkClassTransferDrawer />
    <BulkImportDrawer @refresh="refresh" />
    <DeleteStudentModal />
    <BulkDeleteStudentModal @refresh="refresh" />
    <GraduatedFileDrawer />
    <StudentGradeGraduationDrawer v-model:open="graduationDrawerOpen" />
  </div>
</template>

<style lang="scss" scoped>
:deep(.vxe-pager--sizes) {
  margin-right: 0 !important;
}
</style>
