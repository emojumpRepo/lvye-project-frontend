<script lang="ts" setup>
import type { QuestionnaireVO } from '@vben/types';

import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { computed } from 'vue';

import { ASSESSMENT_TARGET_TYPE } from '@vben/types';

import dayjs from 'dayjs';

import LyLabel from '#/components/LyLabel/index.vue';

const props = withDefaults(
  defineProps<{
    assessments: QuestionnaireVO[];
    basic: PsychologyAssessmentApi.BasicInfo;
    target: PsychologyAssessmentApi.AssessmentTarget;
  }>(),
  {},
);

const selectedAssessments = computed(() => props.assessments ?? []);

const classStats = computed(() => {
  // 汇总每个已选择班级中的学生人数
  return props.target.selected.map((sel) => ({
    name: sel.className,
    count: sel.studentIds.length,
  }));
});

const involvedClassCount = computed(() => classStats.value.length);
const selectedStudentCount = computed(() =>
  props.target.selected.reduce((acc, cur) => acc + cur.studentIds.length, 0),
);

const dateRange = computed(() => {
  const [start, end] = props.basic.timeRange || [];
  if (!start || !end) return '';
  return `${dayjs(start).format('YYYY-MM-DD HH:mm:ss')} 至 ${dayjs(end).format('YYYY-MM-DD HH:mm:ss')}`;
});
</script>

<template>
  <div class="space-y-6 pr-1">
    <!-- 基本信息确认 -->
    <div>
      <LyLabel
        title="基本信息确认"
        has-indicator
        margin-bottom-class="mb-3"
        custom-gap-class="gap-3"
      />
      <section class="rounded-xl bg-[#F7F8FA] px-6 py-4">
        <div class="grid grid-cols-1 gap-[5px] text-[14px] text-[#4B4B4D]">
          <div>
            <span class="desc-title">批次名称：</span>
            <span>{{ basic.name || '—' }}</span>
          </div>
          <div>
            <span class="desc-title">测评量表：</span>
            <span>
              <template v-if="selectedAssessments.length > 0">
                {{ selectedAssessments.map((a) => a.title).join('、') }}
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
              target.type === ASSESSMENT_TARGET_TYPE.PARENT
                ? '学生家长'
                : '学生本人'
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
      <LyLabel
        title="目标对象统计"
        has-indicator
        margin-bottom-class="mb-3"
        custom-gap-class="gap-3"
      />
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
