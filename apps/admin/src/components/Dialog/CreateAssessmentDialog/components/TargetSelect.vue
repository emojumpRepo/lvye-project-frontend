<script lang="ts" setup>
import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';
import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

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

const selectedRowKeys = ref<number[]>([]);

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
// 多选：选中的学生，按班级聚合（使用数字 ID）
const selectedByClass = ref<Map<number, Set<number>>>(new Map());

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

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '200px',
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true },
    pagerConfig: { enabled: false },
    columns: useStudentProfileGroupGridSchema(),
    columnConfig: {
      resizable: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any, formValues: any) => {
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
    checkboxChange: ({
      records,
    }: {
      records: PsychologyStudentProfileApi.StudentProfile[];
    }) => {
      const filteredRecords = (records || []).filter(
        (r: any) => !r.hasChildField,
      );

      // 按 gradeDeptId 分组
      const groupedByClass = new Map<number, number[]>();

      filteredRecords.forEach((r: any) => {
        const gradeDeptId = r.gradeDeptId;
        const userId = r.userId;

        if (!groupedByClass.has(gradeDeptId)) {
          groupedByClass.set(gradeDeptId, []);
        }

        groupedByClass.get(gradeDeptId)!.push(userId);
      });

      const formattedData = [...groupedByClass.entries()].map(
        ([gradeDeptId, studentIds]) => ({
          classId: gradeDeptId,
          studentIds,
        }),
      );

      // 更新内部状态
      selectedByClass.value = new Map(
        formattedData.map((item) => [item.classId, new Set(item.studentIds)]),
      );
    },
  },
});

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

async function loadStudentsForClass(group: ClassGroup) {
  if (group.loaded || group.loading) return;

  // 尝试从父组件缓存恢复学生数据
  if (parentRef) {
    const cachedGroup = parentRef.getCachedClass(group.id);
    if (cachedGroup?.loaded && cachedGroup.students) {
      group.students = cachedGroup.students;
      group.count = cachedGroup.count;
      group.loaded = true;
      return;
    }
  }

  group.loading = true;
  try {
    const resp: any = await getStudentProfileSimpleList({
      classDeptId: group.id,
      pageNo: 1,
      pageSize: 1000,
    });
    const list = resp;
    const total = Number(list.length ?? 0);
    const students = list.map((s: any) => ({
      id: Number(s.userId),
      name: String(s.name ?? ''),
      sno: String(s.studentNo ?? ''),
    }));

    group.students = students;
    group.count = total;
    group.loaded = true;

    // 同步到父组件缓存
    if (parentRef) {
      parentRef.cacheStudentsForClass(group.id, students, total);
    }
  } finally {
    group.loading = false;
  }
}

function onCollapseChange(key: unknown): void {
  const keys = Array.isArray(key)
    ? (key as Array<number | string>)
    : [key as number | string];
  activeClassKeys.value = keys.map(Number);
  // 仅对新展开的面板加载学生（不阻塞 UI）
  activeClassKeys.value.forEach((k) => {
    const group = allClasses.value.find((c) => c.id === k);
    if (group && !group.loaded) {
      void loadStudentsForClass(group);
    }
  });
}

onMounted(async () => {
  start();
  await loadClassList();
});

// 初始化已选
function initSelected() {
  selectedByClass.value = new Map(
    (props.modelValue.selected || []).map((item) => [
      item.classId,
      new Set(item.studentIds),
    ]),
  );
}

// 监听 props.modelValue 变化，重新初始化选择状态
watch(
  () => props.modelValue,
  () => {
    initSelected();
  },
  { immediate: true, deep: true },
);

// 搜索：仅点击"搜索"按钮后才应用关键词
const keyword = ref('');
const appliedKeyword = ref('');

// 同步到父组件
function sync() {
  // 将 Map 转换为接口需要的结构
  const entries = [...selectedByClass.value.entries()];
  const selected = entries
    .map(([classId, idSet]) => {
      const group = allClasses.value.find((c) => c.id === classId);
      return {
        classId,
        className: group?.name ?? '',
        studentIds: [...idSet],
      };
    })
    .filter((it) => it.studentIds.length > 0);
  console.log('selected', selected);
  emit('update:modelValue', {
    type: type.value,
    selected,
  });
}

// 收件类型变化也要同步
watch(type, sync);

async function handleSearch() {
  appliedKeyword.value = keyword.value;
  gridApi.query({ name: appliedKeyword.value });
}
</script>

<template>
  <div class="mx-auto w-full max-w-[610px] space-y-6">
    <!-- 收件类型 -->
    <div>
      <LyLabel title="收件类型" required size="small" />
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
