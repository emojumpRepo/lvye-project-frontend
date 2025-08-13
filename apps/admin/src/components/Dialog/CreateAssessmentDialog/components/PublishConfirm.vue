<script lang="ts" setup>
import type {
  AssessmentTarget,
  AssessmentType,
  BasicInfo,
} from '#/api/assessment/task';

import { computed } from 'vue';

import dayjs from 'dayjs';

const props = withDefaults(
  defineProps<{
    assessment: AssessmentType | null;
    basic: BasicInfo;
    target: AssessmentTarget;
  }>(),
  {},
);

// 占位（如需离线回显可保留，但当前已从父层传递完整对象）

const selectedAssessment = computed(() => props.assessment);

// 用于统计“涉及班级、每个班人数”的演示数据（与 TargetSelect 保持一致）
type Student = { id: string; name: string; sno: string };
type ClassGroup = {
  count: number;
  id: string;
  name: string;
  students: Student[];
};
const classGroups: ClassGroup[] = [
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
];

const classStats = computed(() => {
  const selected = new Set(props.target.targetIds);
  const lines: { count: number; name: string }[] = [];
  classGroups.forEach((c) => {
    const n = c.students.filter((s) => selected.has(s.id)).length;
    if (n > 0) lines.push({ count: n, name: c.name });
  });
  return lines;
});

const involvedClassCount = computed(() => classStats.value.length);
const selectedStudentCount = computed(() => props.target.targetIds.length);

const dateRange = computed(() => {
  const [start, end] = props.basic.timeRange || [];
  if (!start || !end) return '';
  return `${dayjs(start).format('YYYY-MM-DD HH:mm:ss')} 至 ${dayjs(end).format('YYYY-MM-DD HH:mm:ss')}`;
});
</script>

<template>
  <div class="max-h-[408px] space-y-6 overflow-y-auto pr-1">
    <!-- 基本信息确认 -->
    <div>
      <div class="mb-3 flex items-center gap-3">
        <span class="h-[16px] w-[3px] rounded-full bg-[#04DC70]"></span>
        <h3 class="text-[16px] font-bold">基本信息确认</h3>
      </div>
      <section class="rounded-xl bg-[#F7F8FA] px-6 py-4">
        <div class="grid grid-cols-1 gap-[5px] text-[14px] text-[#4B4B4D]">
          <div>
            <span class="desc-title">批次名称：</span>
            <span>{{ basic.name || '—' }}</span>
          </div>
          <div>
            <span class="desc-title">测评量表：</span>
            <span>
              <template v-if="selectedAssessment">
                {{ selectedAssessment.name }}（预计{{
                  typeof selectedAssessment.questionCount === 'number'
                    ? selectedAssessment.time
                    : selectedAssessment.time
                }}）
              </template>
              <template v-else>—</template>
            </span>
          </div>
          <div>
            <span class="desc-title">有效时间：</span>
            <span>{{ dateRange || '—' }}</span>
          </div>
          <div>
            <span class="desc-title">收件类型：</span>
            <span>{{
              target.type === 'parent' ? '学生家长' : '学生本人'
            }}</span>
          </div>
          <div class="col-span-full">
            <span class="desc-title">任务描述：</span>
            <span>{{ basic.description || '—' }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- 目标对象统计 -->
    <div>
      <div class="mb-3 flex items-center gap-3">
        <span class="h-[16px] w-[3px] rounded-full bg-[#04DC70]"></span>
        <h3 class="text-[16px] font-bold">目标对象统计</h3>
      </div>
      <section class="rounded-xl bg-[#F7F8FA] px-6 py-4">
        <div class="grid grid-cols-1 gap-[5px] text-[14px] text-[#4B4B4D]">
          <div class="col-span-full">
            <span class="desc-title">涉及班级：</span>
            <span>{{ involvedClassCount }} 个班级</span>
          </div>
          <div>
            <span class="desc-title">目标学生：</span>
            <span>{{ selectedStudentCount }} 个学生</span>
          </div>
        </div>

        <div class="mt-3 rounded-md border border-[#E8E9EB] bg-white p-3">
          <div
            v-for="line in classStats"
            :key="line.name"
            class="text-[14px] text-black"
          >
            {{ line.name }}：{{ line.count }} 名学生
          </div>
          <div
            v-if="classStats.length === 0"
            class="text-[14px] text-[#B0B1B2]"
          >
            暂无选择
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.desc-title {
  @apply mr-2 font-medium text-[#000];
}
</style>
