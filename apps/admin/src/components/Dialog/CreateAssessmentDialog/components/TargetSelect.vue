<script lang="ts" setup>
import type { AssessmentTarget } from '#/api/assessment/task';

import { computed, onMounted, ref, watch } from 'vue';

import { IconifyIcon, Search } from '@vben/icons';

import {
  Checkbox as ACheckbox,
  Collapse as ACollapse,
  Input as AInput,
  Radio as ARadio,
} from 'ant-design-vue';

import { AssessmentTargetType } from '#/api/assessment/task';
import { getStudentProfilePage } from '#/api/psychology/student-profile';
import { getDeptList } from '#/api/system/dept';
import LyButton from '#/components/LyButton/index.vue';
import LyLabel from '#/components/LyLabel/index.vue';

const props = withDefaults(defineProps<{ modelValue?: AssessmentTarget }>(), {
  modelValue: () => ({ type: 1, selected: [] }),
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: AssessmentTarget): void;
}>();

// 单选：收件类型
const type = ref<AssessmentTarget['type']>(props.modelValue.type);
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
const activeClassKeys = ref<number[]>([]);

async function loadClassList() {
  const data: any[] = await getDeptList();
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
  allClasses.value = leaves.map((n) => ({
    id: Number(n.id),
    name: String(n.name),
    count: Number(n.count ?? 0),
    students: undefined,
    loading: false,
    loaded: false,
  }));
}

async function loadStudentsForClass(group: ClassGroup) {
  if (group.loaded || group.loading) return;
  group.loading = true;
  try {
    const resp: any = await getStudentProfilePage({
      classDeptId: group.id,
      pageNo: 1,
      pageSize: 1000,
    });
    const list = (resp?.list || resp?.data || resp?.records || []) as any[];
    const total = Number(resp?.total ?? list.length ?? 0);
    group.students = list.map((s: any) => ({
      id: Number(s.id ?? s.userId),
      name: String(s.name ?? ''),
      sno: String(s.studentNo ?? ''),
    }));
    group.count = total;
    group.loaded = true;
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

onMounted(() => {
  loadClassList();
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
initSelected();

// 搜索：仅点击“搜索”按钮后才应用关键词
const keyword = ref('');
const appliedKeyword = ref('');
const filteredClasses = computed(() => {
  const kw = appliedKeyword.value.trim();
  if (!kw) return allClasses.value;
  return allClasses.value
    .map((c) => ({
      ...c,
      students: (c.students || []).filter(
        (s) => s.name.includes(kw) || s.sno.includes(kw),
      ),
    }))
    .filter(
      (c) => c.name.includes(kw) || (c.students && c.students.length > 0),
    );
});

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
  emit('update:modelValue', {
    type: type.value,
    selected,
  });
}

// 勾选单个学生
function toggleStudent(group: ClassGroup, id: number, checked: boolean) {
  const set = new Set(selectedByClass.value.get(group.id) || []);
  checked ? set.add(id) : set.delete(id);
  if (set.size > 0) selectedByClass.value.set(group.id, set);
  else selectedByClass.value.delete(group.id);
  sync();
}

// 勾选一个班级
function toggleClass(group: ClassGroup, checked: boolean) {
  if (checked) {
    const ensure = async () => {
      if (!group.loaded) await loadStudentsForClass(group);
      selectedByClass.value.set(
        group.id,
        new Set((group.students || []).map((s) => s.id)),
      );
      sync();
    };
    ensure();
    return;
  } else {
    selectedByClass.value.delete(group.id);
  }
  sync();
}

function isClassAllChecked(group: ClassGroup) {
  const set = selectedByClass.value.get(group.id);
  if (!set) return false;
  return set.size > 0 && set.size === (group.students?.length || 0);
}
function isClassIndeterminate(group: ClassGroup) {
  const set = selectedByClass.value.get(group.id);
  if (!set) return false;
  return set.size > 0 && set.size < (group.students?.length || 0);
}

// 收件类型变化也要同步
watch(type, sync);

function handleSearch() {
  appliedKeyword.value = keyword.value;
}

function isPanelActive(panel: any) {
  return !!panel?.isActive;
}
</script>

<template>
  <div class="mx-auto w-full max-w-[610px] space-y-6">
    <!-- 收件类型 -->
    <div>
      <LyLabel title="收件类型" required size="small" />
      <ARadio.Group v-model:value="type">
        <ARadio :value="AssessmentTargetType.STUDENT">学生本人</ARadio>
        <ARadio :value="AssessmentTargetType.PARENT">学生家长</ARadio>
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
      <div class="max-h-[250px] overflow-y-auto pr-1">
        <ACollapse
          v-model:active-key="activeClassKeys"
          @change="onCollapseChange"
        >
          <template #expandIcon="panel">
            <IconifyIcon
              :icon="
                isPanelActive(panel)
                  ? 'carbon:caret-down'
                  : 'carbon:caret-right'
              "
              class="size-4"
              color="#979899"
            />
          </template>
          <ACollapse.Panel v-for="c in filteredClasses" :key="c.id">
            <template #header>
              <div class="text-[16px] font-semibold text-[#4B4B4D]">
                {{ c.name }}
              </div>
            </template>
            <template #extra>
              <div class="flex items-center gap-4 text-[14px]">
                <span class="font-semibold text-[#000000A6]">
                  共{{ c.count }}人
                </span>
                <ACheckbox
                  :indeterminate="isClassIndeterminate(c)"
                  :checked="isClassAllChecked(c)"
                  @change="(e: any) => toggleClass(c, e.target.checked)"
                />
              </div>
            </template>

            <div v-if="c.loading" class="px-6 py-4 text-[#979899]">
              加载中...
            </div>
            <div v-else-if="!c.loaded" class="px-6 py-4 text-[#979899]">
              展开以加载学生
            </div>
            <div v-else class="bg-#fff flex flex-col gap-6">
              <div
                v-for="stu in c.students"
                :key="stu.id"
                class="flex items-center justify-between pl-6"
              >
                <div>
                  <div class="text-[14px] text-black">{{ stu.name }}</div>
                  <div class="text-[12px] text-[#B0B1B2]">{{ stu.sno }}</div>
                </div>
                <ACheckbox
                  :checked="selectedByClass.get(c.id)?.has(stu.id) ?? false"
                  @change="
                    (e: any) => toggleStudent(c, stu.id, e.target.checked)
                  "
                />
              </div>
            </div>
          </ACollapse.Panel>
        </ACollapse>
      </div>
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
