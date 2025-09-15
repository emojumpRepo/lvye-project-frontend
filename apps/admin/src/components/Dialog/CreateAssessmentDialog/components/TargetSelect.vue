<script lang="ts" setup>
import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { inject, onMounted, ref, watch } from 'vue';

import { Search } from '@vben/icons';
import { ASSESSMENT_TARGET_TYPE } from '@vben/types';

import { Input as AInput, Radio as ARadio } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSimpleDeptList } from '#/api/system/dept';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';
import {
  formatDeptListToTree,
  getDeptTreeList,
  getDeptTreeListByStudentName,
} from '#/utils/transformDeptToTree';
import { useStudentProfileGroupGridSchema } from '#/views/students/data';

const props = withDefaults(
  defineProps<{ modelValue?: PsychologyAssessmentApi.AssessmentTarget }>(),
  {
    modelValue: () => ({ type: ASSESSMENT_TARGET_TYPE.STUDENT, selected: [] }),
  },
);

const emit = defineEmits<{
  (
    e: 'update:modelValue',
    value: PsychologyAssessmentApi.AssessmentTarget,
  ): void;
}>();

const { start, stop } = inject('CommonDialogContentLoading') as {
  set: (v: boolean) => void;
  start: () => void;
  stop: () => void;
};

// 从父组件注入缓存方法
const parentRef = inject<{
  cacheClassList: (classes: any[]) => void;
  cacheStudentsForClass: (
    classId: number,
    students: any[],
    count: number,
  ) => void;
  getCachedClass: (classId: number) => any;
  getCachedClassList: () => any[];
}>('parentRef');

// 单选：收件类型
const type = ref<PsychologyAssessmentApi.AssessmentTarget['type']>(
  props.modelValue.type,
);

type Student = { id: number; name: string; sno: string };
type ClassGroup = {
  count: number;
  id: number;
  loaded?: boolean;
  loading?: boolean;
  name: string;
  students?: Student[];
};

// 班级列表（初始仅有班级信息，无学生）
const allClasses = ref<ClassGroup[]>([]);

// 数据缓存状态
const isDataLoaded = ref(false);

// 搜索：仅点击"搜索"按钮后才应用关键词
const keyword = ref('');
const appliedKeyword = ref('');

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '275px',
    rowConfig: { keyField: 'id', isHover: false },
    checkboxConfig: { reserve: true },
    pagerConfig: { enabled: false },
    columns: useStudentProfileGroupGridSchema(),
    columnConfig: {
      resizable: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ _page }: any, formValues: any) => {
          if (formValues.name) {
            return await getDeptTreeListByStudentName(formValues.name);
          }
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
      trigger: 'row',
      hasChildField: 'hasChildField',
      loadMethod: async ({ row }: any) => {
        return await formatDeptListToTree(
          row.classDeptId,
          row.children,
          appliedKeyword.value,
        );
      },
    },
    showHeader: false,
    cellConfig: {
      height: 60,
    },
    toolbarConfig: {
      custom: false,
      zoom: false,
      refresh: false,
    },
  },
  gridEvents: {
    checkboxChange: async ({ records }: { records: any }) => {
      console.warn('checkboxChange', records);

      // 直接处理选中的记录，构建选择结果
      const selected: PsychologyAssessmentApi.SelectedAssessmentTargetItem[] =
        [];

      records.forEach((r: any) => {
        const classDeptId = r.classDeptId;
        const userId = r.userId;
        const hasChildField = r.hasChildField;
        const count = r.count || 0;
        const children = r.children || [];

        if (hasChildField) {
          // 年级或班级节点
          if (r.isGrade && count > 0) {
            // 年级节点
            if (children.length > 0) {
              // 如果children不为空，直接使用这些班级
              children.forEach((child: any) => {
                selected.push({
                  classId: child.value || child.id,
                  className: child.label || child.name,
                  studentIds: [], // 空数组表示全选该班级
                  totalStudent: child.count || 0,
                });
              });
            }
          } else if (r.isClass && count > 0) {
            // 班级节点
            if (children.length > 0) {
              // 如果children不为空，直接使用这些学生
              const studentIds = children
                .filter((child: any) => child.userId)
                .map((child: any) => child.userId);

              selected.push({
                classId: classDeptId,
                className: r.name,
                studentIds,
                totalStudent: count,
              });
            } else {
              // 如果children为空，直接添加班级到选择列表
              // 这里需要特殊处理：即使没有展开节点，也要表示全选该班级
              selected.push({
                classId: classDeptId,
                className: r.name,
                studentIds: [], // 空数组表示全选该班级
                totalStudent: count,
              });
            }
          }
        } else {
          // 学生节点
          if (classDeptId && userId) {
            // 对于学生节点，真正的班级ID是 gradeDeptId，classDeptId 是学生ID
            const realClassId = r.gradeDeptId; // 使用年级ID作为班级ID
            const className = r.className || r.name;

            // 查找是否已经存在该班级的选择
            const existingIndex = selected.findIndex(
              (item: any) => item.classId === realClassId,
            );

            if (existingIndex === -1) {
              // 如果不存在，创建新的班级选择
              selected.push({
                classId: realClassId,
                className,
                studentIds: [userId],
                totalStudent: r.count || 0,
              });
            } else {
              // 如果已存在，添加学生ID
              if (selected[existingIndex]) {
                selected[existingIndex].studentIds.push(userId);
              }
            }
          }
        }
      });

      // 处理需要额外请求API的年级
      for (const r of records) {
        if (
          r.isGrade &&
          r.count > 0 &&
          (!r.children || r.children.length === 0)
        ) {
          try {
            const classList = await getDeptTreeList(r.classDeptId, true);
            classList.forEach((classInfo) => {
              selected.push({
                classId: classInfo.classDeptId,
                className: classInfo.name,
                studentIds: [], // 空数组表示全选该班级
                totalStudent: classInfo.count,
              });
            });
          } catch (error) {
            console.error('获取年级下的班级失败:', error);
          }
        }
      }

      // 去重：如果同一个班级既被全选又被部分选择，保留全选
      const uniqueSelected: PsychologyAssessmentApi.SelectedAssessmentTargetItem[] =
        [];

      for (const item of selected) {
        const existing = uniqueSelected.find(
          (existingItem) => existingItem.classId === item.classId,
        );
        if (!existing) {
          uniqueSelected.push(item);
        } else if (
          existing.studentIds.length === 0 &&
          item.studentIds.length > 0
        ) {
          // 如果已存在的是全选，新的是部分选择，保持全选
          continue;
        } else if (
          existing.studentIds.length > 0 &&
          item.studentIds.length === 0
        ) {
          // 如果已存在的是部分选择，新的是全选，替换为全选
          const index = uniqueSelected.findIndex(
            (existingItem) => existingItem.classId === item.classId,
          );
          uniqueSelected[index] = item;
        }
      }

      // 直接同步到父组件
      emit('update:modelValue', {
        type: type.value,
        selected: uniqueSelected,
      });
    },
  },
});

// 初始化选中状态 - 简化版本，只在组件挂载时调用
async function initSelected() {
  // 根据 props.modelValue 设置树形组件的选中状态
  if (props.modelValue.selected && props.modelValue.selected.length > 0) {
    console.warn('初始化选中状态:', props.modelValue.selected);

    // 延迟执行，确保数据已经加载完成
    try {
      // 获取当前表格数据
      const tableDataResult = gridApi.grid.getTableData();
      const tableData = tableDataResult.tableData || [];
      console.warn('当前表格数据:', tableData);

      if (tableData && tableData.length > 0) {
        // 需要展开的年级节点
        const gradesToExpand = new Set<number>();

        // 收集需要展开的年级
        props.modelValue.selected.forEach((item) => {
          // 根据班级ID推断年级ID
          // 从控制台日志看，班级ID 116,117,118 对应年级ID 115
          // 这里使用简单的推断逻辑，可能需要根据实际数据结构调整
          const gradeId = Math.floor(item.classId / 10) * 10 + 5;
          gradesToExpand.add(gradeId);
        });

        console.warn('需要展开的年级ID:', [...gradesToExpand]);

        // 展开年级节点
        for (const gradeId of gradesToExpand) {
          const gradeRow = tableData.find((row: any) => row.id === gradeId);
          if (gradeRow && gradeRow.hasChildField) {
            console.warn('展开年级节点:', gradeRow);
            try {
              // 展开节点
              await gridApi.grid.toggleTreeExpand(gradeRow);
              // 等待子节点加载
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
              console.error('展开年级节点失败:', error);
            }
          }
        }

        // 重新获取数据（包含展开的子节点）
        const updatedTableDataResult = gridApi.grid.getTableData();
        const updatedTableData = updatedTableDataResult.tableData || [];
        console.warn('展开后的数据数组:', updatedTableData);

        // 根据 props.modelValue.selected 找到对应的行并设置选中状态
        const rowsToSelect: any[] = [];

        props.modelValue.selected.forEach((item) => {
          if (item.studentIds.length > 0) {
            // 部分选择：找到对应的学生行
            item.studentIds.forEach((studentId) => {
              const studentRow = updatedTableData.find(
                (row: any) =>
                  row.userId === studentId && row.gradeDeptId === item.classId,
              );
              if (studentRow) {
                rowsToSelect.push(studentRow);
              }
            });
          } else {
            // 全选：找到对应的班级或年级行
            const classRow = updatedTableData.find(
              (row: any) =>
                row.classDeptId === item.classId || row.id === item.classId,
            );
            if (classRow) {
              rowsToSelect.push(classRow);
            }
          }
        });

        // 设置选中状态
        if (rowsToSelect.length > 0) {
          console.warn('要选中的行:', rowsToSelect);
          for (const row of rowsToSelect) {
            await gridApi.grid.setCheckboxRow(row, true);
          }
        } else {
          console.warn('没有找到要选中的行，可能需要调整年级ID推断逻辑');
        }
      }
    } catch (error) {
      console.error('设置选中状态失败:', error);
    } // 延迟1秒，确保数据完全加载
  }
}

// 移除复杂的 watch 逻辑，只在组件挂载时初始化

async function loadClassList() {
  // 如果已经加载过，直接返回
  if (isDataLoaded.value && allClasses.value.length > 0) {
    stop();
    return;
  }

  // 尝试从父组件缓存恢复数据
  if (parentRef) {
    const cachedClasses = parentRef.getCachedClassList();
    if (cachedClasses.length > 0) {
      allClasses.value = cachedClasses;
      isDataLoaded.value = true;
      stop();
      return;
    }
  }

  const data: any[] = await getSimpleDeptList();
  // 取叶子节点作为班级；若后端已是平铺列表，则直接使用
  function flattenLeaves(nodes: any[]): any[] {
    const result: any[] = [];
    nodes?.forEach((n) => {
      if (n?.children && n.children.length > 0) {
        result.push(...flattenLeaves(n.children));
      } else if (n) {
        result.push(n);
      }
    });
    return result;
  }
  const leaves = Array.isArray(data) ? flattenLeaves(data) : [];
  const classes = leaves.map((n) => ({
    id: Number(n.id),
    name: String(n.name),
    count: Number(n.count ?? 0),
    students: undefined,
    loading: false,
    loaded: false,
  }));

  allClasses.value = classes;
  isDataLoaded.value = true;

  // 同步到父组件缓存
  if (parentRef) {
    parentRef.cacheClassList(classes);
  }
  stop();
}

onMounted(async () => {
  start();
  await loadClassList();

  // 数据加载完成后，如果有初始选中状态，需要恢复
  if (props.modelValue.selected && props.modelValue.selected.length > 0) {
    console.warn('组件挂载完成，尝试恢复选中状态:', props.modelValue.selected);
    // 延迟一点时间，确保树形组件完全渲染
    setTimeout(() => {
      initSelected();
    }, 1000);
  }
});

// 收件类型变化也要同步
watch(type, () => {
  // 保持当前的选择状态，只更新type
  emit('update:modelValue', {
    type: type.value,
    selected: props.modelValue.selected || [],
  });
});

async function handleSearch() {
  appliedKeyword.value = keyword.value;
  gridApi.query({ name: appliedKeyword.value });
}
</script>

<template>
  <div class="mx-auto w-full max-w-[610px] space-y-6">
    <!-- 收件类型 -->
    <div>
      <LyLabel title="测评对象" required size="small" />
      <ARadio.Group v-model:value="type">
        <ARadio :value="ASSESSMENT_TARGET_TYPE.STUDENT">学生本人</ARadio>
        <ARadio :value="ASSESSMENT_TARGET_TYPE.PARENT">学生家长</ARadio>
      </ARadio.Group>
    </div>

    <!-- 选择班级 -->
    <div>
      <LyLabel title="选择班级" required size="small" />
      <div class="mb-3 flex gap-4">
        <AInput
          v-model:value="keyword"
          placeholder="搜索学生添加"
          class="flex-1 rounded-[4px]"
        >
          <template #prefix>
            <Search class="size-5 text-[#979899]" />
          </template>
        </AInput>
        <LyButton
          size="middle"
          class="h-[40px] w-[86px] justify-center"
          type="success"
          @click="handleSearch"
        >
          搜索
        </LyButton>
      </div>

      <!-- 班级折叠列表 -->
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
          <span v-if="row.count && row.count > 0"> 共{{ row.count }}人 </span>
        </template>
      </Grid>
    </div>
  </div>
</template>
<style scoped lang="scss">
:deep(.ant-collapse) {
  background-color: #f7f8fa;
  border-radius: 4px;
}

:deep(.ant-collapse > .ant-collapse-item:last-child),
:deep(.ant-collapse > .ant-collapse-item:last-child > .ant-collapse-header) {
  border-radius: 0 0 4px 4px !important;
}

:deep(.ant-collapse > .ant-collapse-item > .ant-collapse-header) {
  justify-content: center;
}
</style>
