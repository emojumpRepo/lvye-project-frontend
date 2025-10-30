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

// 计算实际题号（排除 description 类型）
const getQuestionIndex = (index: number) => {
  return (
    props.answers.slice(0, index).filter((item) => item.type !== 'description')
      .length + 1
  );
};

// 计算总分
const totalScore = computed(() => {
  return props.answers.reduce(
    (sum, item) => sum + (Number(item.score) || 0),
    0,
  );
});

// 计算已答题数
const answeredCount = computed(() => {
  return props.answers.filter(
    (item) => item.answer && trimAnswer(item.answer) !== '',
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

// 去除答案字符串的前后空格
function trimAnswer(answer?: string) {
  if (!answer) return '';
  return answer.trim();
}
</script>

<template>
  <div class="mb-6">
    <!-- 统计信息 -->
    <div class="mb-6 grid grid-cols-1 gap-8 md:grid-cols-3">
      <div
        class="rounded-lg border border-[#1966FF]/30 bg-[#1966FF14] px-3 py-4 text-center"
      >
        <div class="text-2xl font-bold text-[#1966FF]">{{ answeredCount }}</div>
        <div class="text-sm text-[#1966FF]/70">已答题数</div>
      </div>
      <div
        class="rounded-lg border border-[#04DC70]/30 bg-[#14E77E0A] px-3 py-4 text-center"
      >
        <div class="text-primary text-2xl font-bold">{{ totalScore }}</div>
        <div class="text-primary/70 text-sm">总得分</div>
      </div>
      <div
        class="rounded-lg border border-gray-200 bg-gray-100 px-3 py-4 text-center"
      >
        <div class="text-2xl font-bold text-gray-500">
          {{ unansweredCount }}
        </div>
        <div class="text-sm text-gray-500">未答/无需作答题数</div>
      </div>
    </div>

    <!-- 答题列表 -->
    <div class="space-y-6">
      <div
        v-for="(item, idx) in answers"
        :key="item.index"
        class="rounded-lg border border-gray-200 px-6 py-4 transition-shadow hover:shadow-md"
        :class="{
          'border-none hover:shadow-none': item.type === 'description',
        }"
      >
        <!-- 描述文本题目：description -->
        <template v-if="item.type === 'description'">
          <div v-dompurify-html="item.title"></div>
        </template>
        <template v-else>
          <!-- 题目标题/分数 -->
          <div class="mb-3 flex items-center justify-between">
            <div class="flex-1">
              <p class="font-medium leading-relaxed text-gray-800">
                <span>{{ getQuestionIndex(idx) }}、</span>
                <!-- 内联填空题目：inline-form -->
                <span v-if="item.type === 'inline-form'">
                  {{ item.title.split(`\{\{answer\}\}`).join('__________') }}
                </span>
                <span v-else v-dompurify-html="item.title"></span>
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
          <div v-if="trimAnswer(item.answer)" class="mt-2 space-y-2">
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
                  getOptionTexts(item).map((t) => ({
                    label: formatAnswer(t),
                    value: t,
                  }))
                "
                style="width: 260px"
                disabled
              />
            </div>

            <!-- 文本输入：input -->
            <div v-else-if="item.type === 'input'">
              <Input :value="formatAnswer(trimAnswer(item.answer))" disabled />
            </div>

            <!-- 文本域：textarea -->
            <div v-else-if="item.type === 'textarea'">
              <Input.TextArea
                :value="formatAnswer(trimAnswer(item.answer))"
                :rows="3"
                disabled
              />
            </div>

            <!-- 兜底展示：标签 -->
            <div v-else class="flex items-center gap-2">
              <span
                v-if="trimAnswer(item.answer)"
                class="inline-flex items-center rounded-full bg-[#1966FF14] px-3 py-1 text-sm font-medium text-[#1966FF]"
              >
                {{ formatAnswer(trimAnswer(item.answer)) }}
              </span>
            </div>
          </div>

          <span
            v-else
            class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500"
          >
            未答/无需作答
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
