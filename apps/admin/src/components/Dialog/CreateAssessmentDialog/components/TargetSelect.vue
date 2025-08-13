<script lang="ts" setup>
import type { AssessmentTarget } from '#/api/assessment/task';

import { computed, ref, watch } from 'vue';

import { IconifyIcon, Search } from '@vben/icons';

import {
  Checkbox as ACheckbox,
  Collapse as ACollapse,
  Input as AInput,
  Radio as ARadio,
} from 'ant-design-vue';

import LyButton from '#/components/LyButton/index.vue';

const props = withDefaults(defineProps<{ modelValue?: AssessmentTarget }>(), {
  modelValue: () => ({ type: 'student', targetIds: [] }),
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: AssessmentTarget): void;
}>();

// 单选：批次名称
const type = ref<AssessmentTarget['type']>(props.modelValue.type);
// 多选：选中的学生 id 列表
const selectedIds = ref<string[]>([...props.modelValue.targetIds]);

type Student = { id: string; name: string; sno: string };
type ClassGroup = {
  count: number;
  id: string;
  name: string;
  students: Student[];
};

// 假数据（后续可替换为接口）
const allClasses = ref<ClassGroup[]>([
  {
    id: 'c1',
    name: '高一（1）班',
    count: 26,
    students: [
      { id: 's1', name: '李三', sno: '1252125212111' },
      { id: 's2', name: '李四', sno: '1252125212112' },
    ],
  },
  {
    id: 'c2',
    name: '高一（2）班',
    count: 26,
    students: [
      { id: 's3', name: '王五', sno: '1252125212113' },
      { id: 's4', name: '赵六', sno: '1252125212114' },
    ],
  },
]);

// 搜索：仅点击“搜索”按钮后才应用关键词
const keyword = ref('');
const appliedKeyword = ref('');
const filteredClasses = computed(() => {
  const kw = appliedKeyword.value.trim();
  if (!kw) return allClasses.value;
  return allClasses.value
    .map((c) => ({
      ...c,
      students: c.students.filter(
        (s) => s.name.includes(kw) || s.sno.includes(kw),
      ),
    }))
    .filter((c) => c.students.length > 0);
});

// 同步到父组件
function sync() {
  emit('update:modelValue', {
    type: type.value,
    targetIds: [...selectedIds.value],
  });
}

// 勾选单个学生
function toggleStudent(id: string, checked: boolean) {
  const set = new Set(selectedIds.value);
  checked ? set.add(id) : set.delete(id);
  selectedIds.value = [...set];
  sync();
}

// 勾选一个班级
function toggleClass(students: Student[], checked: boolean) {
  const set = new Set(selectedIds.value);
  students.forEach((s) => (checked ? set.add(s.id) : set.delete(s.id)));
  selectedIds.value = [...set];
  sync();
}

function isClassAllChecked(students: Student[]) {
  return students.every((s) => selectedIds.value.includes(s.id));
}
function isClassIndeterminate(students: Student[]) {
  const n = students.filter((s) => selectedIds.value.includes(s.id)).length;
  return n > 0 && n < students.length;
}

// 批次名称变化也要同步
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
    <!-- 批次名称 -->
    <div>
      <div class="mb-2 flex items-center gap-1 text-[14px]">
        <div class="font-medium text-black">收件类型</div>
        <div class="text-[#FA4B4B]">*</div>
      </div>
      <ARadio.Group v-model:value="type">
        <ARadio value="student">学生本人</ARadio>
        <ARadio value="parent">学生家长</ARadio>
      </ARadio.Group>
    </div>

    <!-- 选择班级 -->
    <div>
      <div class="mb-2 flex items-center gap-1 text-[14px]">
        <div class="font-medium text-black">选择班级</div>
        <div class="text-[#FA4B4B]">*</div>
      </div>
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

      <div class="max-h-[250px] overflow-y-auto pr-1">
        <ACollapse>
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
                  :indeterminate="isClassIndeterminate(c.students)"
                  :checked="isClassAllChecked(c.students)"
                  @change="
                    (e: any) => toggleClass(c.students, e.target.checked)
                  "
                />
              </div>
            </template>

            <div class="bg-#fff flex flex-col gap-6">
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
                  :checked="selectedIds.includes(stu.id)"
                  @change="(e: any) => toggleStudent(stu.id, e.target.checked)"
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
