<script setup lang="ts">
import type { CoreAssessmentType, RiskLevel } from '#/api/consult';

import { computed, ref } from 'vue';

import { Input as AInput } from 'ant-design-vue';

import { riskOptions } from '#/api/consult';
import icon_done from '#/static/icons/consulting/icon_done.svg';
import icon_guancha from '#/static/icons/consulting/icon_guancha.svg';
import icon_test from '#/static/icons/consulting/icon_test.svg';
import icon_zhiliao from '#/static/icons/consulting/icon_zhiliao.svg';
import icon_zixun from '#/static/icons/consulting/icon_zixun.svg';

const props = withDefaults(
  defineProps<{
    modelValue?: CoreAssessmentType;
  }>(),
  {
    modelValue: () => ({
      riskLevel: '',
      issues: [],
      recommendations: '',
    }),
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: CoreAssessmentType): void;
}>();

const riskLevel = ref<CoreAssessmentType['riskLevel']>(
  props.modelValue.riskLevel,
);
const selectedIssues = ref<string[]>([...props.modelValue.issues]);
const selectedRecs = ref<string>(props.modelValue.recommendations);

const builtinIssues = ref<string[]>([
  '学业压力',
  '人际关系',
  '情绪管理',
  '家庭问题',
  '自我认知',
  '适应困难',
]);
const customIssueInput = ref('');
const showIssueInput = ref(false);

interface RecOption {
  desc: string;
  icon: string;
  key: string;
  title: string;
}

const recOptions = ref<RecOption[]>([
  {
    key: 'consult',
    title: '需要持续咨询',
    desc: '建议安排后续咨询会面',
    icon: icon_zixun,
  },
  {
    key: 'scale',
    title: '需要继续量表测评',
    desc: '建议安排后续咨询会面',
    icon: icon_test,
  },
  {
    key: 'observe',
    title: '持续观察',
    desc: '建议安排后续咨询会面',
    icon: icon_guancha,
  },
  {
    key: 'resolved',
    title: '问题基本解决',
    desc: '建议安排后续咨询会面',
    icon: icon_done,
  },
  {
    key: 'transfer',
    title: '转介专业治疗',
    desc: '建议安排后续咨询会面',
    icon: icon_zhiliao,
  },
]);

const riskSelected = computed(() => riskLevel.value);

function sync() {
  emit('update:modelValue', {
    riskLevel: riskLevel.value,
    issues: [...selectedIssues.value],
    recommendations: selectedRecs.value,
  });
}

function selectRisk(key: RiskLevel) {
  riskLevel.value = key;
  sync();
}

function toggleIssue(name: string) {
  const set = new Set(selectedIssues.value);
  if (set.has(name)) set.delete(name);
  else set.add(name);
  selectedIssues.value = [...set];
  sync();
}

function addIssue() {
  const name = customIssueInput.value.trim();
  if (!name) return;
  if (!builtinIssues.value.includes(name)) builtinIssues.value.push(name);
  if (!selectedIssues.value.includes(name)) selectedIssues.value.push(name);
  customIssueInput.value = '';
  showIssueInput.value = false;
  sync();
}

function selectRecommendation(key: string) {
  selectedRecs.value = key;
  sync();
}

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
    <!-- 风险等级评估 -->
    <section>
      <div class="form-label-container">
        <span class="h-[16px] w-[3px] rounded-full bg-[#04DC70]"></span>
        <span class="font-semibold text-black">风险等级评估</span>
        <div class="text-[#FF0831]">*</div>
      </div>
      <div
        class="grid grid-cols-5 gap-4 rounded-xl bg-[#F7F8FA] px-8 py-6 max-lg:grid-cols-2"
      >
        <button
          v-for="opt in riskOptions"
          :key="opt.key"
          type="button"
          class="group flex w-full flex-col items-center rounded-xl border-2 border-solid p-4 text-left transition-colors"
          :class="
            riskSelected === opt.key
              ? 'border-[#04DC70] bg-[#14E77E0D]'
              : '!border-[#F2F3F5] !bg-[#FFFFFF]'
          "
          @click="selectRisk(opt.key)"
        >
          <span
            class="mb-3 inline-block size-3 rounded-full"
            :style="{ backgroundColor: opt.dot }"
          ></span>
          <span class="text-[14px] font-medium text-black">{{
            opt.title
          }}</span>
          <div class="text-[12px] text-[#979899]">{{ opt.desc }}</div>
        </button>
      </div>
    </section>

    <!-- 问题类型识别 -->
    <section>
      <div class="form-label-container">
        <span class="h-[16px] w-[3px] rounded-full bg-[#04DC70]"></span>
        <span class="font-semibold text-black">问题类型识别</span>
        <div class="text-[#FF0831]">*</div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="name in builtinIssues"
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

    <!-- 后续处理建议 -->
    <section>
      <div class="form-label-container">
        <span class="h-[16px] w-[3px] rounded-full bg-[#04DC70]"></span>
        <span class="font-semibold text-black">后续处理建议</span>
        <div class="text-[#FF0831]">*</div>
      </div>

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
<style scoped lang="scss">
.form-label-container {
  @apply mb-3 flex items-center gap-2 text-[16px];
}
</style>
