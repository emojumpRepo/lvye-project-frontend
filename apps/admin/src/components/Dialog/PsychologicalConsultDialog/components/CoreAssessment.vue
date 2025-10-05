<script setup lang="ts">
import type { CoreAssessmentType } from '#/api/consult';

import { computed, ref } from 'vue';

import { Input as AInput } from 'ant-design-vue';

import { riskOptions } from '#/api/consult';
import LyLabel from '#/components/LyLabel/index.vue';
import icon_done from '#/static/icons/consulting/icon_done.svg';
import icon_guancha from '#/static/icons/consulting/icon_guancha.svg';
import icon_test from '#/static/icons/consulting/icon_test.svg';
import icon_zhiliao from '#/static/icons/consulting/icon_zhiliao.svg';
import icon_zixun from '#/static/icons/consulting/icon_zixun.svg';

const props = withDefaults(
  defineProps<{
    availableIssues: string[];
    modelValue?: CoreAssessmentType;
  }>(),
  {
    modelValue: () => ({
      riskLevel: 0,
      issues: [],
      recommendation: 0,
    }),
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: CoreAssessmentType): void;
  (e: 'handleAddNewIssue', name: string): void;
}>();

// --- pros数据绑定 ---
const riskLevel = computed({
  get: () => props.modelValue.riskLevel,
  set: (val) =>
    emit('update:modelValue', { ...props.modelValue, riskLevel: val }),
});

const selectedIssues = computed({
  get: () => props.modelValue.issues,
  set: (val) => emit('update:modelValue', { ...props.modelValue, issues: val }),
});

const selectedRecs = computed({
  get: () => props.modelValue.recommendation,
  set: (val) =>
    emit('update:modelValue', { ...props.modelValue, recommendation: val }),
});

// --- 组件内部 UI 状态 ---
const customIssueInput = ref('');
const showIssueInput = ref(false);

const recOptions = [
  {
    key: 1,
    title: '需要持续咨询',
    desc: '建议安排后续咨询会面',
    icon: icon_zixun,
  },
  {
    key: 2,
    title: '需要继续量表测评',
    desc: '建议安排后续咨询会面',
    icon: icon_test,
  },
  {
    key: 3,
    title: '持续观察',
    desc: '建议安排后续咨询会面',
    icon: icon_guancha,
  },
  {
    key: 4,
    title: '问题基本解决',
    desc: '建议安排后续咨询会面',
    icon: icon_done,
  },
  {
    key: 5,
    title: '转介专业治疗',
    desc: '建议安排后续咨询会面',
    icon: icon_zhiliao,
  },
];

/** 选择风险等级 */
function selectRisk(key: number) {
  riskLevel.value = key;
}

/** 切换问题类型 */
function toggleIssue(name: string) {
  const issues = new Set(selectedIssues.value);
  issues.has(name) ? issues.delete(name) : issues.add(name);
  selectedIssues.value = [...issues];
}

/** 新增问题类型 */
function addIssue() {
  const name = customIssueInput.value.trim();
  if (!name) return;

  emit('handleAddNewIssue', name);

  if (!selectedIssues.value.includes(name)) {
    selectedIssues.value = [...selectedIssues.value, name];
  }
  customIssueInput.value = '';
  showIssueInput.value = false;
}

/** 选择后续建议 */
function selectRecommendation(key: number) {
  selectedRecs.value = key;
}

/** 校验数据 */
function validate() {
  if (!riskLevel.value) {
    return false;
  }
  if (selectedIssues.value.length === 0) {
    return false;
  }
  if (!selectedRecs.value) {
    return false;
  }
  return true;
}

defineExpose({
  validate,
});
</script>

<template>
  <div class="space-y-8">
    <section>
      <LyLabel
        title="风险等级评估"
        required
        has-indicator
        margin-bottom-class="mb-3"
        custom-title-class="text-[16px] font-semibold"
      />
      <div
        class="grid grid-cols-4 gap-4 rounded-xl bg-[#F7F8FA] px-8 py-6 max-lg:grid-cols-2"
      >
        <button
          v-for="opt in riskOptions"
          :key="opt.key"
          type="button"
          class="group flex w-full flex-col items-center rounded-xl border border-solid p-4 text-left transition-colors"
          :class="
            riskLevel === opt.key
              ? 'border-2 border-[#04DC70] bg-[#14E77E0D]'
              : '!border-[#F2F3F5] !bg-[#FFFFFF]'
          "
          @click="selectRisk(opt.key)"
        >
          <span
            class="mb-3 inline-block size-3 rounded-full"
            :style="{ backgroundColor: opt.dot }"
          ></span>
          <span class="text-[14px] font-medium text-black">
            {{ opt.title }}
          </span>
          <div class="text-[12px] text-[#979899]">{{ opt.desc }}</div>
        </button>
      </div>
    </section>

    <section>
      <LyLabel
        title="问题类型识别"
        required
        has-indicator
        margin-bottom-class="mb-3"
        custom-title-class="text-[16px] font-semibold"
      />
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="name in availableIssues"
          :key="name"
          type="button"
          class="rounded-[6px] border px-[10px] py-[6px] text-[13px] font-medium transition-colors"
          :class="
            selectedIssues.includes(name)
              ? 'border-[#04DC70] bg-[#14E77E14] text-[#04DC70]'
              : 'border-[#C8C9CC] text-[#4C4C4D] hover:bg-[#F2F3F5]'
          "
          @click="toggleIssue(name)"
        >
          {{ name }}
        </button>

        <div v-if="showIssueInput" class="flex items-center gap-2">
          <AInput
            v-model:value="customIssueInput"
            placeholder="请输入问题类型"
            class="rounded-[6px] border px-[10px] py-[6px] text-[13px] font-medium transition-colors"
            @keyup.enter="addIssue"
          />
          <button
            type="button"
            class="shrink-0 text-[13px] text-[#04DC70]"
            @click="addIssue"
          >
            添加
          </button>
          <button
            type="button"
            class="shrink-0 text-[13px] text-[#979899]"
            @click="showIssueInput = false"
          >
            取消
          </button>
        </div>

        <button
          v-else
          type="button"
          class="rounded-[6px] border border-[#C8C9CC] px-[10px] py-[6px] text-[13px] font-medium text-[#4C4C4D] transition-colors hover:bg-[#F2F3F5]"
          @click="showIssueInput = true"
        >
          + 添加
        </button>
      </div>
    </section>

    <section>
      <LyLabel
        title="后续处理建议"
        required
        has-indicator
        margin-bottom-class="mb-3"
        custom-title-class="text-[16px] font-semibold"
      />

      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="rec in recOptions"
          :key="rec.key"
          type="button"
          class="flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors"
          :class="
            selectedRecs === rec.key
              ? 'border-[#04DC70] bg-[#14E77E0D]'
              : 'border-transparent bg-[#F7F8FA] hover:bg-[#F2F3F5]'
          "
          @click="selectRecommendation(rec.key)"
        >
          <img :src="rec.icon" alt="icon" class="size-10" />
          <div class="flex flex-col">
            <span class="text-[14px] font-semibold">{{ rec.title }}</span>
            <span class="text-[12px] text-[#979899]">{{ rec.desc }}</span>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>
vvv
