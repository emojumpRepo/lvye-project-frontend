<script setup lang="ts">
import type { Question } from '@vben/types';

import { computed } from 'vue';

import { Checkbox, Input, Radio, Rate, Select } from 'ant-design-vue';

import { formatAnswer } from '../composables/exportToPDF';

interface Props {
  answers?: Question[];
}

const props = withDefaults(defineProps<Props>(), {
  answers: () => [],
});

// 计算总分
const totalScore = computed(() => {
  return props.answers.reduce((sum, item) => sum + item.score, 0);
});

// 计算已答题数
const answeredCount = computed(() => {
  return props.answers.filter(
    (item) => item.answer && item.answer.trim() !== '',
  ).length;
});

// 计算未答题数
const unansweredCount = computed(() => {
  return props.answers.length - answeredCount.value;
});

// 标准化选项文本
function getOptionText(option: Question['options'][number]) {
  if (typeof option === 'string') return option;
  return option?.text ?? '';
}

// 获取题目选项文本数组
function getOptionTexts(question: Question) {
  return (question.options || []).map((opt) => getOptionText(opt));
}

// 将多选答案解析为数组
function parseMultiAnswer(answer?: string) {
  if (!answer) return [] as string[];
  return answer
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
</script>

<template>
  <div class="questionnaire-answer mb-6 px-4">
    <!-- 统计信息 -->
    <div class="mb-6 grid grid-cols-1 gap-8 md:grid-cols-3">
      <div
        class="rounded-lg border border-[#1966FF]/30 bg-[#1966FF14] p-2 text-center"
      >
        <div class="text-2xl font-bold text-[#1966FF]">{{ answeredCount }}</div>
        <div class="text-sm text-[#1966FF]/70">已答题数</div>
      </div>
      <div
        class="rounded-lg border border-[#FF0831]/30 bg-[#FF083114] p-2 text-center"
      >
        <div class="text-2xl font-bold text-[#FF0831]">
          {{ unansweredCount }}
        </div>
        <div class="text-sm text-[#FF0831]/70">未答题数</div>
      </div>
      <div
        class="rounded-lg border border-[#04DC70]/30 bg-[#14E77E0A] p-2 text-center"
      >
        <div class="text-primary text-2xl font-bold">{{ totalScore }}</div>
        <div class="text-primary/70 text-sm">总得分</div>
      </div>
    </div>

    <!-- 答题列表 -->
    <div class="space-y-4">
      <div
        v-for="item in answers"
        :key="item.index"
        class="rounded-lg border border-gray-200 px-4 py-2 transition-shadow hover:shadow-md"
      >
        <!-- 题目标题/分数 -->
        <div class="mb-3 flex items-center justify-between">
          <div class="flex-1">
            <p class="font-medium leading-relaxed text-gray-800">
              {{ item.index }}、{{ item.title }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-sm text-gray-500">得分：</span>
            <span
              class="text-primary inline-flex items-center rounded text-sm font-bold"
            >
              {{ item.score }}
            </span>
          </div>
        </div>

        <!-- 答案：按题型展示 -->
        <div class="mt-2 space-y-2">
          <!-- 单选题：radio -->
          <div v-if="item.type === 'radio'">
            <Radio.Group :value="item.answer">
              <Radio
                v-for="(opt, idx) in getOptionTexts(item)"
                :key="idx"
                :value="opt"
                class="mr-4"
              >
                {{ formatAnswer(opt) }}
              </Radio>
            </Radio.Group>
          </div>

          <!-- 多选题：checkbox -->
          <div v-else-if="item.type === 'checkbox'">
            <Checkbox.Group :value="parseMultiAnswer(item.answer)" disabled>
              <Checkbox
                v-for="(opt, idx) in getOptionTexts(item)"
                :key="idx"
                :value="opt"
                class="mr-4"
              >
                {{ formatAnswer(opt) }}
              </Checkbox>
            </Checkbox.Group>
          </div>

          <!-- 评分题：rate -->
          <div v-else-if="item.type === 'rate'">
            <Rate :value="Number(item.answer) || 0" disabled />
          </div>

          <!-- 下拉题：select -->
          <div v-else-if="item.type === 'select'">
            <Select
              :value="item.answer"
              :options="
                getOptionTexts(item).map((t) => ({ label: t, value: t }))
              "
              style="width: 260px"
              disabled
            />
          </div>

          <!-- 文本输入：input -->
          <div v-else-if="item.type === 'input'">
            <Input :value="formatAnswer(item.answer)" disabled />
          </div>

          <!-- 文本域：textarea -->
          <div v-else-if="item.type === 'textarea'">
            <Input.TextArea
              :value="formatAnswer(item.answer)"
              :rows="3"
              disabled
            />
          </div>

          <!-- 兜底展示：标签 -->
          <div v-else class="flex items-center gap-2">
            <span
              v-if="item.answer"
              class="inline-flex items-center rounded-full bg-[#1966FF14] px-3 py-1 text-sm font-medium text-[#1966FF]"
            >
              {{ formatAnswer(item.answer) }}
            </span>
            <span
              v-else
              class="inline-flex items-center rounded-full bg-[#FF083114] px-3 py-1 text-sm font-medium text-[#FF0831]"
            >
              未作答
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
